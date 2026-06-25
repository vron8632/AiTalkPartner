from rest_framework.routers import DefaultRouter
from payment.views import PaymentOrderViewSet

router = DefaultRouter()
router.register(r'orders', PaymentOrderViewSet)
urlpatterns = router.urls
