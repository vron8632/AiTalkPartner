from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from users.models import User, SmsCode


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['id', 'phone', 'nickname', 'is_member', 'member_expire', 'date_joined']
    list_filter = ['is_member', 'is_active']
    search_fields = ['phone', 'nickname']
    ordering = ['-date_joined']

    fieldsets = (
        (None, {'fields': ('phone', 'password')}),
        ('个人信息', {'fields': ('nickname', 'avatar_url')}),
        ('会员信息', {'fields': ('is_member', 'member_expire')}),
        ('权限', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('时间信息', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('phone', 'password1', 'password2'),
        }),
    )


@admin.register(SmsCode)
class SmsCodeAdmin(admin.ModelAdmin):
    list_display = ['phone', 'code', 'used', 'expires_at', 'created_at']
    list_filter = ['used']
    search_fields = ['phone']
