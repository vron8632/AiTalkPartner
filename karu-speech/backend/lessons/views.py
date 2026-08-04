from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from openai import OpenAI
from django.conf import settings

from lessons.models import Lesson, UserProgress
from lessons.serializers import LessonSerializer, LessonProgressSerializer


class LessonViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def lessons_with_progress(request):
    lessons = Lesson.objects.all().order_by('level_id', 'sort_order')
    for lesson in lessons:
        UserProgress.objects.get_or_create(
            user=request.user, lesson=lesson,
            defaults={'status': 'unlocked' if lesson.is_free else 'locked'},
        )
    serializer = LessonProgressSerializer(lessons, many=True, context={'user': request.user})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def complete_lesson(request, lesson_id):
    lesson = Lesson.objects.filter(id=lesson_id).first()
    if not lesson:
        return Response({'detail': '课程不存在'}, status=404)

    progress, _ = UserProgress.objects.get_or_create(
        user=request.user, lesson=lesson,
        defaults={'status': 'completed', 'completed_at': timezone.now()},
    )
    if progress.status != 'completed':
        progress.status = 'completed'
        progress.completed_at = timezone.now()
        progress.save()

    from django.db.models import Q
    next_lesson = Lesson.objects.filter(
        Q(level_id=lesson.level_id, lesson_id=lesson.lesson_id + 1) |
        Q(level_id=lesson.level_id + 1, lesson_id=1)
    ).first()

    if next_lesson:
        UserProgress.objects.get_or_create(
            user=request.user, lesson=next_lesson,
            defaults={'status': 'unlocked'},
        )

    return Response({'status': 'completed'})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_example(request, lesson_id):
    lesson = Lesson.objects.filter(id=lesson_id).first()
    if not lesson:
        return Response({'detail': '课程不存在'}, status=404)

    client = OpenAI(api_key=settings.DEEPSEEK_API_KEY, base_url='https://api.deepseek.com')
    prompt = f'你是一个演说教练。请为课程"{lesson.title}"（{lesson.description}）写一段100-200字的范例演讲稿，风格真诚自然，有具体细节。直接输出演讲稿内容，不要加额外说明。'
    resp = client.chat.completions.create(model='deepseek-chat', messages=[{'role': 'user', 'content': prompt}], temperature=0.8)
    text = resp.choices[0].message.content.strip()
    return Response({'example_text': text})
