import uuid
import os

from django.conf import settings
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import User
from users.serializers import UserSerializer

ALLOWED_AVATAR_EXTS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}


def _is_valid_image(head: bytes) -> bool:
    """按文件头魔数校验图片类型，防止伪装的非图片文件。"""
    if head.startswith(b'\xff\xd8\xff'):
        return True
    if head.startswith(b'\x89PNG\r\n\x1a\n'):
        return True
    if head.startswith((b'GIF87a', b'GIF89a')):
        return True
    if head[:4] == b'RIFF' and head[8:12] == b'WEBP':
        return True
    return False


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login(request):
    """兼容旧版手机号一键登录（djoser 登录请使用 /api/auth/jwt/create/）"""
    phone = request.data.get('phone', '').strip()
    if not phone or not phone.isdigit() or len(phone) != 11:
        return Response({'detail': '请输入正确的手机号'}, status=400)
    user, _ = User.objects.get_or_create(phone=phone, defaults={'username': phone, 'email': f'{phone}@example.com'})
    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data,
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def upload_avatar(request):
    """上传头像，保存到 MEDIA_ROOT/avatars/ 并更新用户 avatar_url。"""
    file = request.FILES.get('file')
    if not file:
        return Response({'detail': '请选择图片文件'}, status=400)
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in ALLOWED_AVATAR_EXTS:
        return Response({'detail': '仅支持 jpg/jpeg/png/gif/webp 图片'}, status=400)

    head = b''
    for chunk in file.chunks():
        head += chunk
        if len(head) >= 12:
            break
    if not _is_valid_image(head):
        return Response({'detail': '文件内容不是有效图片'}, status=400)

    filename = f'avatars/{request.user.id}/{uuid.uuid4().hex}{ext}'
    path = os.path.join(settings.MEDIA_ROOT, filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb+') as f:
        for chunk in file.chunks():
            f.write(chunk)

    request.user.avatar_url = f'{settings.MEDIA_URL}{filename}'
    request.user.save(update_fields=['avatar_url'])
    return Response({'avatar_url': request.user.avatar_url})
