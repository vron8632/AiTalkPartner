from rest_framework import serializers
from lessons.models import Lesson, UserProgress


class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = '__all__'


class LessonProgressSerializer(serializers.ModelSerializer):
    progress_status = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'level_id', 'lesson_id', 'title', 'description', 'prompt_key',
                  'exercise_type', 'duration_goal', 'is_free', 'sort_order',
                  'theory_content', 'example_text', 'progress_status']

    def get_progress_status(self, obj) -> str:
        user = self.context.get('user')
        if not user:
            return 'unlocked' if obj.is_free else 'locked'
        progress = UserProgress.objects.filter(user=user, lesson=obj).first()
        if progress:
            return progress.status
        return 'unlocked' if obj.is_free else 'locked'
