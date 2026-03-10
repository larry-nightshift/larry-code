from django.urls import path
from .views import SiteExportView

urlpatterns = [
    path('export/', SiteExportView.as_view({'post': 'export'}), name='site-export'),
]
