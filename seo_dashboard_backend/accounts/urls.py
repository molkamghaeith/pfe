from django.urls import path
from .views import RegisterView, google_auth, forgot_password, reset_password_confirm, CustomTokenObtainPairView
from rest_framework_simplejwt.views import TokenObtainPairView

from .views import (
    RegisterView, 
    google_auth, 
    forgot_password, 
    reset_password_confirm, 
    CustomTokenObtainPairView,
    get_user_role,           # ✅ AJOUTER CETTE LIGNE
    admin_get_users,         # ✅ AJOUTER CETTE LIGNE
    admin_toggle_user_status, # ✅ AJOUTER CETTE LIGNE
    admin_delete_user,       # ✅ AJOUTER CETTE LIGNE
    admin_get_stats,         # ✅ AJOUTER CETTE LIGNE
    admin_create_user,
)

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("login/", CustomTokenObtainPairView.as_view()),
    path("google/", google_auth),
    path("forgot-password/", forgot_password),
    path("reset-password-confirm/", reset_password_confirm),
    path("me/", get_user_role),                     # ✅ AJOUTER
    path("admin/users/", admin_get_users),          # ✅ AJOUTER
    path("admin/users/<int:user_id>/toggle-status/", admin_toggle_user_status),  # ✅ AJOUTER
    path("admin/users/<int:user_id>/", admin_delete_user),  # ✅ AJOUTER
    path("admin/stats/", admin_get_stats),          # ✅ AJOUTER
    path("admin/users/create/", admin_create_user),
]