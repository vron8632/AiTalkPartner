from rest_framework import serializers
from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer

from users.models import User
from e_mail import services as email_services


class UserSerializer(serializers.ModelSerializer):
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'nickname', 'avatar_url', 'phone', 'is_member', 'member_expire', 'is_staff', 'is_superuser']
        read_only_fields = ['username', 'email', 'phone', 'is_member', 'member_expire']


class UserCreateSerializer(BaseUserCreateSerializer):
    """注册序列化器：账号/密码/邮箱/昵称 + 二次确认密码 + 邮箱验证码。

    注意：djoser 的 USER_CREATE_PASSWORD_RETYPE=True 会绕过自定义 serializer
    （改用 djoser 内置类，丢失 nickname/email_verify_code），因此此处手动实现。
    """
    re_password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    email_verify_code = serializers.CharField(write_only=True)

    class Meta(BaseUserCreateSerializer.Meta):
        model = User
        fields = ('id', 'username', 'password', 'email', 'nickname', 're_password', 'email_verify_code')

    def validate(self, attrs):
        # 必须在 super().validate() 之前弹出，djoser 内部会执行 User(**attrs)
        re_password = attrs.pop('re_password', None)
        verify_code = attrs.pop('email_verify_code', None)
        attrs = super().validate(attrs)
        if attrs.get('password') != re_password:
            raise serializers.ValidationError({'re_password': '两次输入的密码不一致'})
        # 注册需校验邮箱验证码（2 分钟有效）
        if not attrs.get('email'):
            raise serializers.ValidationError({'email': '请输入邮箱地址'})
        try:
            email_services.verify_code(attrs['email'].strip().lower(), verify_code or '', 'verify')
        except email_services.CodeInvalidError as e:
            raise serializers.ValidationError({'email_verify_code': str(e)})
        return attrs

    def create(self, validated_data):
        validated_data.pop('re_password', None)
        return super().create(validated_data)
