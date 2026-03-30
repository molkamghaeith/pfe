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

    def __str__(self):
        return f"Analyse {self.website.nom_site}"


class Recommendation(models.Model):
    analysis = models.ForeignKey(Analysis, on_delete=models.CASCADE)
    contenu = models.TextField()

    def __str__(self):
        return "Recommendation"