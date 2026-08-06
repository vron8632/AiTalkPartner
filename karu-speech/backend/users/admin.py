from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from users.models import User, SmsCode, LoginLog


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['id', 'username', 'nickname', 'is_member', 'member_expire', 'date_joined']
    list_filter = ['is_member', 'is_active']
    search_fields = ['username', 'nickname', 'phone', 'email']
    ordering = ['-date_joined']

    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('个人信息', {'fields': ('email', 'nickname', 'avatar_url', 'phone')}),
        ('会员信息', {'fields': ('is_member', 'member_expire')}),
        ('权限', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('时间信息', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
    )


@admin.register(SmsCode)
class SmsCodeAdmin(admin.ModelAdmin):
    list_display = ['phone', 'code', 'used', 'expires_at', 'created_at']
    list_filter = ['used']
    search_fields = ['phone']


@admin.register(LoginLog)
class LoginLogAdmin(admin.ModelAdmin):
    """登录日志（只读）。"""
    list_display = ['user', 'method', 'ip', 'created_at']
    list_filter = ['method', 'created_at']
    search_fields = ['user__username', 'user__nickname', 'user__phone', 'ip']

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False
