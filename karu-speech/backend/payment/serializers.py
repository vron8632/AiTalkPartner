from rest_framework import serializers
from payment.models import PaymentOrder


class PaymentOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentOrder
        fields = '__all__'
        read_only_fields = ['user']
