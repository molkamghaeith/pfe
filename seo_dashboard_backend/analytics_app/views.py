from django.shortcuts import redirect
from django.conf import settings
from urllib.parse import urlencode
from django.http import JsonResponse
import requests
import secrets

from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

from django.contrib.auth.models import User
from .models import Website
from .serializers import WebsiteSerializer
from accounts.models import GoogleAnalyticsToken
from urllib.parse import urlparse
from datetime import date, timedelta
from .smart_seo_agent import get_smart_seo_recommendations  # ✅ NOUVEL AGENT INTELLIGENT
from .models import Website, Analysis


oauth_states = {}


# ================= WEBSITE =================

class WebsiteCreateView(generics.CreateAPIView):
    serializer_class = WebsiteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WebsiteListView(generics.ListAPIView):
    serializer_class = WebsiteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Website.objects.filter(user=self.request.user)


# ================= GOOGLE LOGIN =================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def google_analytics_login(request):
    state = secrets.token_urlsafe(16)
    oauth_states[state] = request.user.id

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly",
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }

    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return Response({"auth_url": url})


@api_view(["GET"])
def google_analytics_callback(request):
    code = request.GET.get("code")
    state = request.GET.get("state")

    if not code or not state:
        return JsonResponse({"error": "code ou state manquant"}, status=400)

    user_id = oauth_states.get(state)
    if not user_id:
        return JsonResponse({"error": "state invalide"}, status=400)

    user = User.objects.get(id=user_id)

    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    response = requests.post(token_url, data=data)
    token_data = response.json()

    GoogleAnalyticsToken.objects.update_or_create(
        user=user,
        defaults={
            "access_token": token_data.get("access_token"),
            "refresh_token": token_data.get("refresh_token"),
        },
    )

    oauth_states.pop(state, None)

    return redirect("http://localhost:5173/dashboard")


# ================= PROPERTIES =================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_ga_properties(request):
    token_obj = GoogleAnalyticsToken.objects.get(user=request.user)

    credentials = Credentials(token=token_obj.access_token)

    service = build("analyticsadmin", "v1beta", credentials=credentials)
    result = service.accountSummaries().list().execute()

    properties = []
    for account in result.get("accountSummaries", []):
        for prop in account.get("propertySummaries", []):
            properties.append({
                "property_id": prop.get("property", "").split("/")[-1],
                "display_name": prop.get("displayName"),
            })

    return JsonResponse(properties, safe=False)


# ================= DATA =================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_ga_data(request, property_id):
    token_obj = GoogleAnalyticsToken.objects.get(user=request.user)

    credentials = Credentials(token=token_obj.access_token)

    service = build("analyticsdata", "v1beta", credentials=credentials)

    start_date_str = request.GET.get("start_date")
    end_date_str = request.GET.get("end_date")

    if not start_date_str or not end_date_str:
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        start_date_str = start_date.strftime("%Y-%m-%d")
        end_date_str = end_date.strftime("%Y-%m-%d")

    print(f"📊 Période Analytics : du {start_date_str} au {end_date_str}")

    response = service.properties().runReport(
        property=f"properties/{property_id}",
        body={
            "dateRanges": [{"startDate": start_date_str, "endDate": end_date_str}],
            "dimensions": [{"name": "date"}],
            "metrics": [
                {"name": "activeUsers"},
                {"name": "sessions"},
                {"name": "screenPageViews"},
                {"name": "bounceRate"},
            ],
        },
    ).execute()

    data = []
    for row in response.get("rows", []):
        data.append({
            "date": row["dimensionValues"][0]["value"],
            "users": row["metricValues"][0]["value"],
            "sessions": row["metricValues"][1]["value"],
            "views": row["metricValues"][2]["value"],
            "bounceRate": row["metricValues"][3]["value"],
        })

    return Response(data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def verify_ga_property_url(request):
    site_url = request.data.get("site_url")
    property_id = request.data.get("property_id")

    if not site_url or not property_id:
        return Response(
            {"error": "site_url et property_id sont obligatoires"},
            status=400
        )

    try:
        token_obj = GoogleAnalyticsToken.objects.get(user=request.user)
    except GoogleAnalyticsToken.DoesNotExist:
        return Response(
            {"error": "Aucun compte Google Analytics connecté."},
            status=404
        )

    credentials = Credentials(token=token_obj.access_token)

    service = build("analyticsadmin", "v1beta", credentials=credentials)

    try:
        streams_response = service.properties().dataStreams().list(
            parent=f"properties/{property_id}"
        ).execute()
    except Exception as e:
        return Response(
            {"error": "Impossible de récupérer les data streams", "details": str(e)},
            status=400
        )

    site_domain = urlparse(site_url).netloc.replace("www.", "").lower()

    for stream in streams_response.get("dataStreams", []):
        web_stream_data = stream.get("webStreamData")
        if web_stream_data and web_stream_data.get("defaultUri"):
            default_uri = web_stream_data["defaultUri"]
            ga_domain = urlparse(default_uri).netloc.replace("www.", "").lower()

            if site_domain == ga_domain:
                return Response({
                    "match": True,
                    "site_url": site_url,
                    "default_uri": default_uri,
                    "message": "La propriété GA correspond à l’URL du site."
                })

    return Response({
        "match": False,
        "site_url": site_url,
        "message": "Cette propriété Google Analytics ne correspond pas à l’URL saisie."
    })


# ================= SEARCH CONSOLE =================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_search_console_data(request):
    site_url = request.GET.get("site_url")

    if not site_url:
        return JsonResponse({"error": "site_url manquant"}, status=400)

    start_date_str = request.GET.get("start_date")
    end_date_str = request.GET.get("end_date")

    try:
        token_obj = GoogleAnalyticsToken.objects.get(user=request.user)
    except:
        return JsonResponse({"error": "Token Google introuvable"}, status=404)

    credentials = Credentials(
        token=token_obj.access_token,
        refresh_token=token_obj.refresh_token,
        token_uri=token_obj.token_uri,
        client_id=token_obj.client_id,
        client_secret=token_obj.client_secret,
        scopes=[
            "https://www.googleapis.com/auth/webmasters.readonly"
        ],
    )

    service = build("searchconsole", "v1", credentials=credentials)

    if start_date_str and end_date_str:
        start_date = start_date_str
        end_date = end_date_str
    else:
        end_date_obj = date.today()
        start_date_obj = end_date_obj - timedelta(days=90)
        start_date = str(start_date_obj)
        end_date = str(end_date_obj)

    request_body = {
        "startDate": start_date,
        "endDate": end_date,
        "dimensions": ["query"],
        "rowLimit": 10
    }

    response = service.searchanalytics().query(
        siteUrl=site_url,
        body=request_body
    ).execute()

    results = []

    for row in response.get("rows", []):
        results.append({
            "keyword": row["keys"][0],
            "clicks": row["clicks"],
            "impressions": row["impressions"],
            "ctr": row["ctr"],
            "position": row["position"],
        })

    return JsonResponse(results, safe=False)


# ================= RECOMMANDATIONS SEO (NOUVEL AGENT INTELLIGENT) =================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_seo_recommendations_api(request, website_id):
    """API pour obtenir les recommandations SEO avec l'agent intelligent"""
    try:
        website = Website.objects.get(id=website_id, user=request.user)
    except Website.DoesNotExist:
        return Response({"error": "Site non trouvé"}, status=404)
    
    ga_data = []
    gsc_data = []
    
    # Récupérer les données GA
    analyses = Analysis.objects.filter(website=website).order_by('-date_analyse')[:30]
    for analysis in analyses:
        ga_data.append({
            'users': analysis.trafic,
            'sessions': analysis.clics,
            'views': analysis.impressions,
        })
    
    # Utiliser le nouvel agent intelligent (sans if/else)
    recommendations = get_smart_seo_recommendations(website.url, ga_data, gsc_data)
    
    return Response(recommendations)


# ================= EXPORT FONCTIONS (VRAIES DONNÉES) =================

from .export_utils import export_seo_to_csv, export_analytics_to_csv, export_full_report_pdf

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_seo_csv(request, website_id):
    """Exporte les données Search Console en CSV - VRAIES DONNÉES"""
    try:
        website = Website.objects.get(id=website_id, user=request.user)
    except Website.DoesNotExist:
        return Response({"error": "Site non trouvé"}, status=404)
    
    try:
        token_obj = GoogleAnalyticsToken.objects.get(user=request.user)
    except GoogleAnalyticsToken.DoesNotExist:
        return Response({"error": "Token Google non trouvé"}, status=404)
    
    # Récupérer les données SEO réelles
    end_date = date.today()
    start_date = end_date - timedelta(days=90)
    
    credentials = Credentials(
        token=token_obj.access_token,
        refresh_token=token_obj.refresh_token,
        token_uri=token_obj.token_uri,
        client_id=token_obj.client_id,
        client_secret=token_obj.client_secret,
        scopes=["https://www.googleapis.com/auth/webmasters.readonly"],
    )
    
    service = build("searchconsole", "v1", credentials=credentials)
    
    request_body = {
        "startDate": str(start_date),
        "endDate": str(end_date),
        "dimensions": ["query"],
        "rowLimit": 100
    }
    
    response = service.searchanalytics().query(
        siteUrl=website.url,
        body=request_body
    ).execute()
    
    gsc_data = []
    for row in response.get("rows", []):
        gsc_data.append({
            "keyword": row["keys"][0],
            "clicks": row["clicks"],
            "impressions": row["impressions"],
            "ctr": row["ctr"],
            "position": row["position"],
        })
    
    return export_seo_to_csv(gsc_data, website.nom_site)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_analytics_csv(request, website_id):
    """Exporte les données Google Analytics en CSV - VRAIES DONNÉES"""
    try:
        website = Website.objects.get(id=website_id, user=request.user)
    except Website.DoesNotExist:
        return Response({"error": "Site non trouvé"}, status=404)
    
    try:
        token_obj = GoogleAnalyticsToken.objects.get(user=request.user)
    except GoogleAnalyticsToken.DoesNotExist:
        return Response({"error": "Token Google non trouvé"}, status=404)
    
    # Récupérer les données GA réelles
    end_date = date.today()
    start_date = end_date - timedelta(days=30)
    start_date_str = start_date.strftime("%Y-%m-%d")
    end_date_str = end_date.strftime("%Y-m-%d")
    
    credentials = Credentials(token=token_obj.access_token)
    service = build("analyticsdata", "v1beta", credentials=credentials)
    
    response = service.properties().runReport(
        property=f"properties/{website.property_id}",
        body={
            "dateRanges": [{"startDate": start_date_str, "endDate": end_date_str}],
            "dimensions": [{"name": "date"}],
            "metrics": [
                {"name": "activeUsers"},
                {"name": "sessions"},
                {"name": "screenPageViews"},
            ],
        },
    ).execute()
    
    ga_data = []
    for row in response.get("rows", []):
        ga_data.append({
            "date": row["dimensionValues"][0]["value"],
            "users": row["metricValues"][0]["value"],
            "sessions": row["metricValues"][1]["value"],
            "views": row["metricValues"][2]["value"],
        })
    
    return export_analytics_to_csv(ga_data, website.nom_site)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def export_full_pdf(request, website_id):
    """Exporte un rapport complet en PDF - VRAIES DONNÉES"""
    try:
        website = Website.objects.get(id=website_id, user=request.user)
    except Website.DoesNotExist:
        return Response({"error": "Site non trouvé"}, status=404)
    
    try:
        token_obj = GoogleAnalyticsToken.objects.get(user=request.user)
    except GoogleAnalyticsToken.DoesNotExist:
        return Response({"error": "Token Google non trouvé"}, status=404)
    
    # 1. Récupérer les données GA réelles
    end_date = date.today()
    start_date_ga = end_date - timedelta(days=30)
    start_date_ga_str = start_date_ga.strftime("%Y-%m-%d")
    end_date_str = end_date.strftime("%Y-%m-%d")
    
    credentials = Credentials(token=token_obj.access_token)
    service_ga = build("analyticsdata", "v1beta", credentials=credentials)
    
    ga_response = service_ga.properties().runReport(
        property=f"properties/{website.property_id}",
        body={
            "dateRanges": [{"startDate": start_date_ga_str, "endDate": end_date_str}],
            "dimensions": [{"name": "date"}],
            "metrics": [
                {"name": "activeUsers"},
                {"name": "sessions"},
                {"name": "screenPageViews"},
            ],
        },
    ).execute()
    
    ga_data = []
    for row in ga_response.get("rows", []):
        ga_data.append({
            "date": row["dimensionValues"][0]["value"],
            "users": row["metricValues"][0]["value"],
            "sessions": row["metricValues"][1]["value"],
            "views": row["metricValues"][2]["value"],
        })
    
    # 2. Récupérer les données GSC réelles
    start_date_gsc = end_date - timedelta(days=90)
    start_date_gsc_str = str(start_date_gsc)
    
    credentials_gsc = Credentials(
        token=token_obj.access_token,
        refresh_token=token_obj.refresh_token,
        token_uri=token_obj.token_uri,
        client_id=token_obj.client_id,
        client_secret=token_obj.client_secret,
        scopes=["https://www.googleapis.com/auth/webmasters.readonly"],
    )
    service_gsc = build("searchconsole", "v1", credentials=credentials_gsc)
    
    request_body = {
        "startDate": start_date_gsc_str,
        "endDate": end_date_str,
        "dimensions": ["query"],
        "rowLimit": 50
    }
    
    gsc_response = service_gsc.searchanalytics().query(
        siteUrl=website.url,
        body=request_body
    ).execute()
    
    gsc_data = []
    for row in gsc_response.get("rows", []):
        gsc_data.append({
            "keyword": row["keys"][0],
            "clicks": row["clicks"],
            "impressions": row["impressions"],
            "ctr": row["ctr"],
            "position": row["position"],
        })
    
    return export_full_report_pdf(gsc_data, ga_data, website.nom_site, website.url)