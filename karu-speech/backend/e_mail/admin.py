from django.contrib import admin
from e_mail.models import EmailConfig, EmailVerifyCode


@admin.register(EmailConfig)
class EmailConfigAdmin(admin.ModelAdmin):
    """SMTP 邮箱配置（单例：维护第一行）。"""
    list_display = ['smtp_user', 'sender_name', 'smtp_host', 'smtp_port']

    def has_add_permission(self, request):
        # 已存在配置时不允许新增，保证单例
        return EmailConfig.objects.count() == 0

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(EmailVerifyCode)
class EmailVerifyCodeAdmin(admin.ModelAdmin):
    list_display = ['email', 'code', 'purpose', 'used', 'expires_at', 'created_at']
    list_filter = ['purpose', 'used']
    search_fields = ['email']
