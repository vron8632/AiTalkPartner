from django.contrib import admin
from practice.models import PracticeRecord


@admin.register(PracticeRecord)
class PracticeRecordAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'lesson', 'duration_sec', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__phone', 'user__nickname']
    readonly_fields = ['created_at']
