from django.urls import path
from .views import (
    WebsiteCreateView,
    WebsiteListView,
    google_analytics_login,
    google_analytics_callback,
    list_ga_properties,
    get_ga_data,
    verify_ga_property_url,
    get_search_console_data,
    get_seo_recommendations_api,
    export_seo_csv,
    export_analytics_csv,
    export_full_pdf,
    get_top_pages,
    get_organic_traffic,
)

urlpatterns = [
    path("add-site/", WebsiteCreateView.as_view()),
    path("sites/", WebsiteListView.as_view()),
    path("google-analytics/login/", google_analytics_login),
    path("google-analytics/callback/", google_analytics_callback),
    path("google-analytics/properties/", list_ga_properties),
    path("google-analytics/data/<str:property_id>/", get_ga_data),
    path("google-analytics/verify-url/", verify_ga_property_url),
    path("search-console/data/", get_search_console_data),
    path("recommendations/<int:website_id>/", get_seo_recommendations_api),
    path("export/seo-csv/<int:website_id>/", export_seo_csv),
    path("export/analytics-csv/<int:website_id>/", export_analytics_csv),
    path("export/full-pdf/<int:website_id>/", export_full_pdf),
    path("top-pages/<str:property_id>/", get_top_pages),
    path("organic-traffic/<str:property_id>/", get_organic_traffic),
]