from django.conf import settings
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from .serializers import RegisterSerializer


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


@api_view(["POST"])
@permission_classes([AllowAny])
def google_auth(request):
    credential = request.data.get("credential")

    print("GOOGLE AUTH BODY:", request.data)
    print("GOOGLE_WEB_CLIENT_ID:", settings.GOOGLE_WEB_CLIENT_ID)

    if not credential:
        return Response({"error": "credential manquant"}, status=400)

    try:
        idinfo = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            settings.GOOGLE_WEB_CLIENT_ID,
        )
        print("GOOGLE IDINFO:", idinfo)

    except Exception as e:
        print("GOOGLE VERIFY ERROR:", repr(e))
        return Response(
            {"error": f"Token Google invalide: {str(e)}"},
            status=400,
        )

    email = idinfo.get("email")
    given_name = idinfo.get("given_name", "")

    if not email:
        return Response({"error": "Email Google introuvable"}, status=400)

    username_base = email.split("@")[0]
    username = username_base

    user = User.objects.filter(email=email).first()

    if not user:
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{username_base}{counter}"
            counter += 1

        user = User.objects.create_user(
            username=username,
            email=email,
            first_name=given_name,
            password=None,
        )
        user.set_unusable_password()
        user.save()

    refresh = RefreshToken.for_user(user)

    return Response(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "username": user.username,
                "email": user.email,
            },
        },
        status=200,
    )

@api_view(["POST"])
@permission_classes([AllowAny])
def forgot_password(request):
    email = request.data.get("email")

    if not email:
        return Response({"error": "Email requis"}, status=400)

    user = User.objects.filter(email=email).first()

    if not user:
        return Response(
            {"message": "Si cet email existe, un lien a été généré."},
            status=200,
        )

    if not user.has_usable_password():
        return Response(
            {"error": "Ce compte utilise Google. Connectez-vous avec Google."},
            status=400,
        )

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    reset_link = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"

    send_mail(
        subject="Réinitialisation du mot de passe",
        message=f"Cliquez sur ce lien pour réinitialiser votre mot de passe : {reset_link}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[user.email],
        fail_silently=False,
    )

    return Response(
        {"message": "Email de réinitialisation envoyé avec succès."},
        status=200,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def reset_password_confirm(request):
    uidb64 = request.data.get("uid")
    token = request.data.get("token")
    password = request.data.get("password")

    if not uidb64 or not token or not password:
        return Response({"error": "uid, token et password sont requis"}, status=400)

    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except Exception:
        return Response({"error": "Lien invalide"}, status=400)

    if not default_token_generator.check_token(user, token):
        return Response({"error": "Token invalide ou expiré"}, status=400)

    user.set_password(password)
    user.save()

    return Response({"message": "Mot de passe réinitialisé avec succès"}, status=200)