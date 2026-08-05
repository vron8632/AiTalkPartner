from rest_framework import serializers
from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer

from users.models import User


class UserSerializer(serializers.ModelSerializer):
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'nickname', 'avatar_url', 'phone', 'is_member', 'member_expire', 'is_staff', 'is_superuser']
        read_only_fields = ['username', 'email', 'phone', 'is_member', 'member_expire']


class UserCreateSerializer(BaseUserCreateSerializer):
    """注册序列化器：账号/密码/邮箱/昵称 + 二次确认密码。

    注意：djoser 的 USER_CREATE_PASSWORD_RETYPE=True 会绕过自定义 serializer
    （改用 djoser 内置类，丢失 nickname），因此此处手动实现 re_password 校验。
    """
    re_password = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta(BaseUserCreateSerializer.Meta):
        model = User
        fields = ('id', 'username', 'password', 'email', 'nickname', 're_password')

    def validate(self, attrs):
        # 必须在 super().validate() 之前弹出，djoser 内部会执行 User(**attrs)
        re_password = attrs.pop('re_password', None)
        attrs = super().validate(attrs)
        if attrs.get('password') != re_password:
            raise serializers.ValidationError({'re_password': '两次输入的密码不一致'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('re_password', None)
        return super().create(validated_data)
