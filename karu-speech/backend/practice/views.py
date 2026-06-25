import uuid
import os

from django.conf import settings
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from practice.models import PracticeRecord
from practice.serializers import PracticeRecordSerializer
from services.evaluate import evaluate_speech
from services.asr import transcribe


class PracticeRecordViewSet(viewsets.ModelViewSet):
    queryset = PracticeRecord.objects.all()
    serializer_class = PracticeRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PracticeRecord.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_audio(request):
    file = request.FILES.get('file')
    lesson_id = request.data.get('lesson_id')
    if not file:
        return Response({'detail': '请上传音频文件'}, status=400)
    if not lesson_id:
        return Response({'detail': '缺少课程ID'}, status=400)

    ext = os.path.splitext(file.name)[1] or '.webm'
    filename = f'audio/{request.user.id}/{uuid.uuid4().hex}{ext}'
    path = os.path.join(settings.MEDIA_ROOT, filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)

    with open(path, 'wb+') as f:
        for chunk in file.chunks():
            f.write(chunk)

    url = f'{settings.MEDIA_URL}{filename}'
    record = PracticeRecord.objects.create(
        user=request.user,
        lesson_id=lesson_id,
        audio_url=url,
        duration_sec=int(request.data.get('duration', 0)),
    )
    return Response({'id': record.id, 'audio_url': url}, status=201)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def evaluate_record(request, record_id):
    record = PracticeRecord.objects.filter(id=record_id, user=request.user).first()
    if not record:
        return Response({'detail': '记录不存在'}, status=404)

    try:
        if record.audio_url and not record.transcript:
            audio_path = os.path.join(settings.MEDIA_ROOT, record.audio_url.replace(settings.MEDIA_URL, ''))
            if os.path.exists(audio_path):
                record.transcript = transcribe(audio_path)
                record.save()

        transcript = record.transcript or '(无语音内容)'
        result = evaluate_speech(transcript)
        record.scores = result['scores']
        record.feedback = {
            'strengths': result['strengths'],
            'improvements': result['improvements'],
            'summary': result['summary'],
            'tips': result['tips'],
        }
        record.save()
        return Response({'record_id': record.id, 'transcript': record.transcript, **result})
    except Exception as e:
        return Response({'detail': str(e)}, status=500)
