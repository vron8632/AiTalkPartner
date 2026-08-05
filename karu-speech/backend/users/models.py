from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models


class CustomUserManager(UserManager):
    def _create_user(self, username=None, email=None, password=None, **extra_fields):
        if not username:
            raise ValueError('账号必填')
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, username=None, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(username, email, password, **extra_fields)

    def create_superuser(self, username=None, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self._create_user(username, email, password, **extra_fields)


class User(AbstractUser):
    phone = models.CharField('手机号', max_length=20, blank=True, null=True, unique=True)
    nickname = models.CharField('昵称', max_length=50, blank=True, null=True)
    avatar_url = models.CharField('头像', max_length=255, blank=True, null=True)
    is_member = models.BooleanField('会员', default=False)
    member_expire = models.DateTimeField('会员到期时间', blank=True, null=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = '用户'

    def __str__(self):
        return self.nickname or self.username


class SmsCode(models.Model):
    phone = models.CharField('手机号', max_length=11)
    code = models.CharField('验证码', max_length=6)
    used = models.BooleanField('已使用', default=False)
    expires_at = models.DateTimeField('过期时间')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '验证码'
        verbose_name_plural = '验证码'
        indexes = [
            models.Index(fields=['phone', 'used']),
        ]

    def __str__(self):
        return f'{self.phone}:{self.code}'
