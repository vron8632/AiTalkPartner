from django.urls import path
from rest_framework.routers import DefaultRouter
from lessons import views

router = DefaultRouter()
router.register(r'lessons', views.LessonViewSet)

urlpatterns = [
    path('lessons/progress/', views.lessons_with_progress, name='lessons_progress'),
    path('lessons/<int:lesson_id>/complete/', views.complete_lesson, name='complete_lesson'),
    path('lessons/<int:lesson_id>/generate-example/', views.generate_example, name='generate_example'),
]

urlpatterns += router.urls
