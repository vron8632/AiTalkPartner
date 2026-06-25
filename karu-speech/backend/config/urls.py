from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls_auth')),
    path('api/', include('lessons.urls')),
    path('api/practice/', include('practice.urls')),
    path('api/payment/', include('payment.urls')),
    path('api/', include('users.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Serve frontend for all other routes
urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(
        template_name='index.html',
        extra_context={'STATIC_URL': settings.STATIC_URL},
    )),
]
