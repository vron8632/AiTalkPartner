from rest_framework import serializers
from practice.models import PracticeRecord


class PracticeRecordSerializer(serializers.ModelSerializer):
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    lesson_level_id = serializers.IntegerField(source='lesson.level_id', read_only=True)
    lesson_lesson_id = serializers.IntegerField(source='lesson.lesson_id', read_only=True)

    class Meta:
        model = PracticeRecord
        fields = '__all__'
        read_only_fields = ['user']
