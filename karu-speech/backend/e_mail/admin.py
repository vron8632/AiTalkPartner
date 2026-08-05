from django.contrib import admin
from e_mail.models import EmailConfig, EmailVerifyCode


@admin.register(EmailConfig)
class EmailConfigAdmin(admin.ModelAdmin):
    """SMTP 邮箱配置（单例：维护第一行，列表页可直接编辑所有字段）。"""
    list_display = ['id', 'smtp_user', 'smtp_host', 'smtp_port', 'sender_name', 'smtp_password']
    # 列表页直接编辑（改完点页面底部「保存」即生效，无需进入详情页）
    list_editable = ['smtp_user', 'smtp_host', 'smtp_port', 'sender_name', 'smtp_password']
    list_display_links = ['id']

    def has_add_permission(self, request):
        # 已存在配置时不允许新增，保证单例
        return EmailConfig.objects.count() == 0

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(EmailVerifyCode)
class EmailVerifyCodeAdmin(admin.ModelAdmin):
    """邮箱验证码日志（只读，不需要新增/删除）。"""
    list_display = ['email', 'code', 'purpose', 'used', 'expires_at', 'created_at']
    list_filter = ['purpose', 'used']
    search_fields = ['email']
    ordering = ['-created_at']

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        # 日志允许查看，但禁止修改内容
        return False
