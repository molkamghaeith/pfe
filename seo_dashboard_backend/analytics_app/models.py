from django.db import models
from django.contrib.auth.models import User


class Website(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    url = models.URLField()
    nom_site = models.CharField(max_length=255)
    property_id = models.CharField(max_length=100, null=True, blank=True)
    property_name = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.nom_site


class Analysis(models.Model):
    website = models.ForeignKey(Website, on_delete=models.CASCADE)
    trafic = models.IntegerField(default=0)
    clics = models.IntegerField(default=0)
    impressions = models.IntegerField(default=0)
    ctr = models.FloatField(default=0.0)
    position = models.FloatField(default=0.0)
    date_analyse = models.DateTimeField(auto_now_add=True, null=True, blank=True)  # ✅ AJOUTER

    def __str__(self):
        return f"Analyse {self.website.nom_site}"


# ✅ ANCIEN MODÈLE Recommendation (conservé pour compatibilité)
class Recommendation(models.Model):
    analysis = models.ForeignKey(Analysis, on_delete=models.CASCADE)
    contenu = models.TextField()

    def __str__(self):
        return "Recommendation"


# ✅ NOUVEAU MODÈLE - Recommendation SEO intelligente (AJOUTÉ SANS SUPPRIMER L'ANCIEN)
class SEORecommendation(models.Model):
    """Modèle pour les recommandations SEO intelligentes de l'agent"""
    
    PRIORITY_CHOICES = [
        ('high', '⚠️ Haute priorité'),
        ('medium', '📌 Priorité moyenne'),
        ('low', '✅ Priorité basse'),
    ]
    
    CATEGORY_CHOICES = [
        ('title', '📝 Optimisation des titres'),
        ('meta', '📄 Meta descriptions'),
        ('structure', '🏗️ Structure HTML'),
        ('content', '📖 Contenu'),
        ('technical', '⚙️ Technique'),
        ('traffic', '📊 Trafic'),
        ('engagement', '💬 Engagement'),
        ('seo', '🔍 SEO'),
        ('opportunity', '💡 Opportunité'),
    ]
    
    website = models.ForeignKey(Website, on_delete=models.CASCADE, related_name='seo_recommendations')
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    is_applied = models.BooleanField(default=False)  # Pour savoir si la recommandation a été appliquée
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = "Recommandation SEO"
        verbose_name_plural = "Recommandations SEO"
    
    def __str__(self):
        return f"[{self.get_priority_display()}] {self.title}"