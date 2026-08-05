from rest_framework import viewsets, permissions
from payment.models import PaymentOrder
from payment.serializers import PaymentOrderSerializer


class PaymentOrderViewSet(viewsets.ModelViewSet):
    queryset = PaymentOrder.objects.all()
    serializer_class = PaymentOrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # 只允许查看自己的订单，防止越权访问他人订单
        return PaymentOrder.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
