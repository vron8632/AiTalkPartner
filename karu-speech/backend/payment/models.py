from django.db import models


class PaymentOrder(models.Model):
    PLAN_TYPES = [
        ('monthly', '月度'),
        ('quarterly', '季度'),
        ('yearly', '年度'),
    ]
    STATUS_CHOICES = [
        ('pending', '待支付'),
        ('paid', '已支付'),
        ('expired', '已过期'),
        ('refunded', '已退款'),
    ]

    user = models.ForeignKey('users.User', on_delete=models.CASCADE, verbose_name='用户')
    order_no = models.CharField('订单号', max_length=32, unique=True)
    plan_type = models.CharField('套餐类型', max_length=20, choices=PLAN_TYPES)
    amount_cents = models.IntegerField('金额(分)')
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='pending')
    channel = models.CharField('支付渠道', max_length=20, blank=True, null=True, help_text='alipay|wxpay')
    trade_no = models.CharField('交易号', max_length=64, blank=True, null=True, help_text='支付平台交易号')
    paid_at = models.DateTimeField('支付时间', blank=True, null=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)

    class Meta:
        verbose_name = '支付订单'
        verbose_name_plural = '支付订单'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.order_no}'
