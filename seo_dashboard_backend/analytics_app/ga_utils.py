# analytics_app/ga_utils.py
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from datetime import date, timedelta

def fetch_top_pages(property_id, user, start_date=None, end_date=None, limit=10):
    """Récupère les pages les plus vues (titre, chemin, vues) pour une propriété GA."""
    from accounts.models import GoogleAnalyticsToken
    try:
        token_obj = GoogleAnalyticsToken.objects.get(user=user)
    except GoogleAnalyticsToken.DoesNotExist:
        return []

    credentials = Credentials(token=token_obj.access_token)
    service = build("analyticsdata", "v1beta", credentials=credentials)

    if not start_date:
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
    if not end_date:
        end_date = date.today()

    start = start_date.strftime("%Y-%m-%d") if hasattr(start_date, 'strftime') else str(start_date)
    end = end_date.strftime("%Y-%m-%d") if hasattr(end_date, 'strftime') else str(end_date)

    try:
        response = service.properties().runReport(
            property=f"properties/{property_id}",
            body={
                "dateRanges": [{"startDate": start, "endDate": end}],
                "dimensions": [{"name": "pageTitle"}, {"name": "pagePath"}],
                "metrics": [{"name": "screenPageViews"}],
                "orderBys": [{"metric": {"metricName": "screenPageViews"}, "desc": True}],
                "limit": limit
            }
        ).execute()

        pages = []
        for row in response.get("rows", []):
            pages.append({
                "title": row["dimensionValues"][0]["value"],
                "path": row["dimensionValues"][1]["value"],
                "views": int(row["metricValues"][0]["value"])
            })
        return pages
    except Exception as e:
        print(f"❌ Erreur fetch_top_pages: {e}")
        return []