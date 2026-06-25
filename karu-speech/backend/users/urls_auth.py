from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from users import views

urlpatterns = [
    path('login/', views.login, name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', views.me, name='me'),
]
