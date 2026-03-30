from django.urls import path
from .views import (
    WebsiteCreateView,
    WebsiteListView,
    google_analytics_login,
    google_analytics_callback,
    list_ga_properties,
    get_ga_data,
    verify_ga_property_url,
)

urlpatterns = [
    path("add-site/", WebsiteCreateView.as_view()),
    path("sites/", WebsiteListView.as_view()),
    path("google-analytics/login/", google_analytics_login),
    path("google-analytics/callback/", google_analytics_callback),
    path("google-analytics/properties/", list_ga_properties),
    path("google-analytics/data/<str:property_id>/", get_ga_data),
    path("google-analytics/verify-url/", verify_ga_property_url),
]