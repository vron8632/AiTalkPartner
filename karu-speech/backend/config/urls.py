from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect


def frontend_redirect(request):
    return redirect('https://192.168.1.124:5173/')


urlpatterns = [
    path('', frontend_redirect),
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls_auth')),
    path('api/', include('lessons.urls')),
    path('api/practice/', include('practice.urls')),
    path('api/payment/', include('payment.urls')),
    path('api/', include('users.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
