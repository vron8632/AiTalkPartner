from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from users.models import User
from users.serializers import UserSerializer


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
