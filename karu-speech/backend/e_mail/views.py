from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

from users.models import User
from users.serializers import UserSerializer
from users.views import record_login_log
from e_mail import services


def _error(detail, status=400):
    return Response({'detail': detail}, status=status)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def send_code(request):
    """发送邮箱验证码。purpose: verify(注册)/login(登录)/change_password(改密)/reset_password(找回)"""
    email = (request.data.get('email') or '').strip().lower()
    purpose = (request.data.get('purpose') or 'verify').strip()
    if not email:
        return _error('请输入邮箱地址')
    if purpose not in services.PURPOSES:
        return _error('purpose 参数不合法')
    try:
        services.send_verify_code(email, purpose)
    except services.EmailNotConfiguredError as e:
        return _error(str(e), 500)
    except services.SendTooFrequentError as e:
        return _error(str(e))
    except Exception:
        return _error('验证码发送失败，请检查邮箱配置或稍后重试', 500)
    return Response({'detail': '验证码已发送，请查收邮箱', 'ttl_minutes': services.CODE_TTL_MINUTES})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_by_code(request):
    """邮箱验证码登录：校验通过后签发 JWT。"""
    email = (request.data.get('email') or '').strip().lower()
    code = (request.data.get('code') or '').strip()
    if not email or not code:
        return _error('请输入邮箱和验证码')
    user = User.objects.filter(email=email).first()
    if not user:
        return _error('该邮箱尚未注册，请先注册')
    try:
        services.verify_code(email, code, 'login')
    except services.CodeInvalidError as e:
        return _error(str(e))
    refresh = RefreshToken.for_user(user)
    record_login_log(user, 'email_code', request)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': UserSerializer(user).data,
    })


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """个人中心：邮箱验证码修改密码（验证码发到当前登录用户的邮箱）。"""
    code = (request.data.get('code') or '').strip()
    new_password = request.data.get('new_password') or ''
    email = request.user.email or ''
    if not email:
        return _error('当前账号未绑定邮箱，无法通过邮箱验证码修改密码')
    if not code or not new_password:
        return _error('请输入验证码和新密码')
    try:
        services.verify_code(email, code, 'change_password')
        validate_password(new_password, request.user)
    except services.CodeInvalidError as e:
        return _error(str(e))
    except DjangoValidationError as e:
        return _error('；'.join(sum((list(v) for v in e.message_dict.values()), [])))
    request.user.set_password(new_password)
    request.user.save(update_fields=['password'])
    return Response({'detail': '密码修改成功'})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def reset_password(request):
    """找回密码：邮箱验证码直接重置密码（无需登录）。"""
    email = (request.data.get('email') or '').strip().lower()
    code = (request.data.get('code') or '').strip()
    new_password = request.data.get('new_password') or ''
    if not email or not code or not new_password:
        return _error('请输入邮箱、验证码和新密码')
    user = User.objects.filter(email=email).first()
    if not user:
        return _error('该邮箱尚未注册，请先注册')
    try:
        services.verify_code(email, code, 'reset_password')
        validate_password(new_password, user)
    except services.CodeInvalidError as e:
        return _error(str(e))
    except DjangoValidationError as e:
        return _error('；'.join(sum((list(v) for v in e.message_dict.values()), [])))
    user.set_password(new_password)
    user.save(update_fields=['password'])
    return Response({'detail': '密码已重置，请使用新密码登录'})
