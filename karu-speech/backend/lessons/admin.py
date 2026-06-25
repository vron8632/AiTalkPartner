from django.contrib import admin
from lessons.models import Lesson, UserProgress


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ['id', 'level_id', 'lesson_id', 'title', 'exercise_type', 'is_free', 'duration_goal', 'sort_order']
    list_filter = ['level_id', 'exercise_type', 'is_free']
    search_fields = ['title', 'description']
    list_editable = ['is_free', 'sort_order']


@admin.register(UserProgress)
class UserProgressAdmin(admin.ModelAdmin):
    list_display = ['user', 'lesson', 'status', 'best_score', 'completed_at']
    list_filter = ['status']
    search_fields = ['user__phone', 'user__nickname']
