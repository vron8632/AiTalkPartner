from django.contrib import admin
from payment.models import PaymentOrder


@admin.register(PaymentOrder)
class PaymentOrderAdmin(admin.ModelAdmin):
    list_display = ['order_no', 'user', 'plan_type', 'amount_cents', 'status', 'channel', 'paid_at']
    list_filter = ['status', 'plan_type', 'channel']
    search_fields = ['order_no', 'user__phone']
    readonly_fields = ['created_at']
