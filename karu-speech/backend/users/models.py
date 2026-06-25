from django.contrib.auth.models import AbstractUser, UserManager
from django.db import models


class CustomUserManager(UserManager):
    def _create_user(self, phone=None, password=None, **extra_fields):
        if not phone:
            raise ValueError('手机号必填')
        user = self.model(phone=phone, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, phone=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        return self._create_user(phone, password, **extra_fields)

    def create_superuser(self, phone=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self._create_user(phone, password, **extra_fields)


class User(AbstractUser):
    username = None
    email = None
    first_name = None
    last_name = None
    phone = models.CharField('手机号', max_length=11, unique=True)
    nickname = models.CharField('昵称', max_length=50, blank=True, null=True)
    avatar_url = models.CharField('头像', max_length=255, blank=True, null=True)
    is_member = models.BooleanField('会员', default=False)
    member_expire = models.DateTimeField('会员到期时间', blank=True, null=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'phone'
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = '用户'

    def __str__(self):
        return self.nickname or self.phone


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
