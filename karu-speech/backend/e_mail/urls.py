from django.urls import path
from e_mail import views

urlpatterns = [
    path('send-code/', views.send_code, name='email_send_code'),
    path('login/', views.login_by_code, name='email_login'),
    path('change-password/', views.change_password, name='email_change_password'),
    path('reset-password/', views.reset_password, name='email_reset_password'),
]
