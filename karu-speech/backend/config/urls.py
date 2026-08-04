from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.views.static import serve

FRONTEND_DIST = str(settings.BASE_DIR / 'frontend_dist')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls_auth')),
    path('api/', include('lessons.urls')),
    path('api/practice/', include('practice.urls')),
    path('api/payment/', include('payment.urls')),
    path('api/', include('users.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# Serve frontend build assets
urlpatterns += [
    re_path(r'^(?P<path>assets/.*)$', serve, {'document_root': FRONTEND_DIST}),
    re_path(r'^(favicon\.jpeg|favicon\.svg|icons\.svg)$', serve, {'document_root': FRONTEND_DIST}),
]

# SPA catch-all — serve index.html for everything else
urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(template_name='index.html')),
]
