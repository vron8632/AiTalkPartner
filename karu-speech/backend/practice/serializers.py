from rest_framework import serializers
from practice.models import PracticeRecord


class PracticeRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PracticeRecord
        fields = '__all__'
        read_only_fields = ['user']
