from django.urls import path
from .views import RegisterView, google_auth, forgot_password, reset_password_confirm
from rest_framework_simplejwt.views import TokenObtainPairView

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("login/", TokenObtainPairView.as_view()),
    path("google/", google_auth),
    path("forgot-password/", forgot_password),
    path("reset-password-confirm/", reset_password_confirm),
]