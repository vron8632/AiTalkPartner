from django.urls import path
from rest_framework.routers import DefaultRouter
from practice import views

router = DefaultRouter()
router.register(r'records', views.PracticeRecordViewSet)

urlpatterns = [
    path('upload/', views.upload_audio, name='upload_audio'),
    path('evaluate/<int:record_id>/', views.evaluate_record, name='evaluate_record'),
]

urlpatterns += router.urls
