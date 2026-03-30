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
        "scope": "https://www.googleapis.com/auth/analytics.readonly",
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

    response = service.properties().runReport(
        property=f"properties/{property_id}",
        body={
            "dateRanges": [{"startDate": "2026-02-28", "endDate": "2026-03-30"}],
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