from django.db import models


class EmailConfig(models.Model):
    """SMTP 邮箱配置（后台可管理，单例使用第一行）。

    数据表名固定为 e_mail，字段与需求一致：
    邮箱授权密码 / SMTP服务器地址 / 邮箱端口号 / 邮箱地址 / 自定义发件人昵称
    """
    smtp_password = models.CharField('邮箱授权密码', max_length=128)
    smtp_host = models.CharField('SMTP服务器地址', max_length=128)
    smtp_port = models.IntegerField('邮箱端口号', default=465)
    smtp_user = models.EmailField('邮箱地址')
    sender_name = models.CharField('自定义发件人昵称', max_length=64, blank=True)

    class Meta:
        db_table = 'e_mail'
        verbose_name = '邮箱配置'
        verbose_name_plural = '邮箱配置'

    def __str__(self):
        return f'{self.sender_name or "SMTP"} <{self.smtp_user}>'


class EmailVerifyCode(models.Model):
    """邮箱验证码（注册/登录/改密/找回共用，2 分钟有效）。"""
    email = models.EmailField('邮箱')
    code = models.CharField('验证码', max_length=6)
    purpose = models.CharField('用途', max_length=20, default='verify',
                               help_text='verify|login|change_password|reset_password')
    used = models.BooleanField('已使用', default=False)
    expires_at = models.DateTimeField('过期时间')
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '邮箱验证码'
        verbose_name_plural = '邮箱验证码'
        ordering = ['-created_at']
        indexes = [models.Index(fields=['email', 'used', 'expires_at'])]

    def __str__(self):
        return f'{self.email}:{self.code}'
