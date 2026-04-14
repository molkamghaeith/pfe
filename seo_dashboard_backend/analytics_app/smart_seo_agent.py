import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import math
from collections import Counter
import re
import aiohttp
import asyncio

# ================= BENCHMARKS PAR SECTEUR =================
INDUSTRY_BENCHMARKS = {
    'default': {
        'name': 'Général',
        'avg_ctr': 0.035,
        'avg_position': 12.0,
        'avg_load_time': 1.8,
        'min_content': 800,
        'avg_pages_per_session': 2.5,
    },
    'sport_fitness': {
        'name': 'Sport & Fitness',
        'avg_ctr': 0.042,
        'avg_position': 8.0,
        'avg_load_time': 1.5,
        'min_content': 1200,
        'avg_pages_per_session': 3.0,
    },
    'ecommerce': {
        'name': 'E-commerce',
        'avg_ctr': 0.028,
        'avg_position': 15.0,
        'avg_load_time': 2.0,
        'min_content': 600,
        'avg_pages_per_session': 4.0,
    },
    'blog': {
        'name': 'Blog / Média',
        'avg_ctr': 0.038,
        'avg_position': 10.0,
        'avg_load_time': 1.5,
        'min_content': 1500,
        'avg_pages_per_session': 1.8,
    },
    'corporate': {
        'name': 'Site Corporate',
        'avg_ctr': 0.025,
        'avg_position': 18.0,
        'avg_load_time': 2.2,
        'min_content': 500,
        'avg_pages_per_session': 2.0,
    },
}

# ================= POIDS PAR CATÉGORIE =================
CATEGORY_WEIGHTS = {
    'sport_fitness': {
        'content': 0.35,
        'performance': 0.35,
        'seo': 0.30,
    },
    'ecommerce': {
        'content': 0.25,
        'performance': 0.35,
        'seo': 0.40,
    },
    'blog': {
        'content': 0.50,
        'performance': 0.25,
        'seo': 0.25,
    },
    'corporate': {
        'content': 0.30,
        'performance': 0.30,
        'seo': 0.40,
    },
    'default': {
        'content': 0.40,
        'performance': 0.30,
        'seo': 0.30,
    },
}


class SmartSEOAgent:
    """
    Agent SEO intelligent sans conditions if/else
    Utilise des calculs mathématiques et statistiques
    """
    
    def __init__(self, site_url, ga_data=None, gsc_data=None):
        self.site_url = site_url
        self.ga_data = ga_data if ga_data else []
        self.gsc_data = gsc_data if gsc_data else []
        self.scores = {}
        self.recommendations = []
        self.benchmark = None
        self.industry = 'default'
        self.avg_ctr = 0
        self.avg_position = 0
        self.load_time = 0
        # Métriques de contenu
        self.title_length = 0
        self.has_title = 0
        self.meta_desc_length = 0
        self.has_meta_desc = 0
        self.h1_count = 0
        self.h2_count = 0
        self.h3_count = 0
        self.images_without_alt = 0
        self.text_length = 0
        self.internal_links = 0
        
    def detect_industry(self, soup, text):
        """Détecte automatiquement le secteur d'activité"""
        text_lower = text.lower()
        
        keywords = {
            'sport_fitness': ['gym', 'fitness', 'musculation', 'sport', 'entraînement', 'coach', 'cardio', 'titanium'],
            'ecommerce': ['acheter', 'panier', 'commander', 'prix', 'livraison', 'promotion', 'réduction'],
            'blog': ['article', 'blog', 'news', 'actualité', 'conseil', 'tutoriel', 'guide'],
            'corporate': ['entreprise', 'service', 'contact', 'propos', 'carrière', 'recrutement'],
        }
        
        scores = {}
        for industry, words in keywords.items():
            score = sum(1 for word in words if word in text_lower)
            scores[industry] = score
        
        if max(scores.values()) > 0:
            return max(scores, key=scores.get)
        return 'default'
    
    async def get_pagespeed_metrics(self):
        """Récupère les métriques PageSpeed Insights"""
        try:
            url = f"https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={self.site_url}"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    data = await response.json()
                    
                    lighthouse = data.get('lighthouseResult', {})
                    audits = lighthouse.get('audits', {})
                    categories = lighthouse.get('categories', {})
                    
                    return {
                        'performance_score': categories.get('performance', {}).get('score', 0) * 100,
                        'seo_score': categories.get('seo', {}).get('score', 0) * 100,
                        'lcp': audits.get('largest-contentful-paint', {}).get('numericValue', 0),
                        'fid': audits.get('max-potential-fid', {}).get('numericValue', 0),
                        'cls': audits.get('cumulative-layout-shift', {}).get('numericValue', 0),
                        'first_contentful_paint': audits.get('first-contentful-paint', {}).get('numericValue', 0),
                        'speed_index': audits.get('speed-index', {}).get('numericValue', 0),
                    }
        except Exception as e:
            print(f"Erreur PageSpeed: {e}")
            return None
    
    def analyze_performance_metrics(self, pagespeed_data):
        """Analyse les métriques de performance PageSpeed"""
        if not pagespeed_data:
            return []
        
        issues = []
        
        perf_score = pagespeed_data.get('performance_score', 0)
        if perf_score < 50:
            issues.append({
                'category': 'performance',
                'title': '📊 Performance PageSpeed',
                'message': f"📊 Score PageSpeed: {perf_score:.0f}/100 - Site très lent (optimisez images, JS, CSS)",
                'priority': 'high'
            })
        elif perf_score < 80:
            issues.append({
                'category': 'performance',
                'title': '📊 Performance PageSpeed',
                'message': f"📊 Score PageSpeed: {perf_score:.0f}/100 - À améliorer",
                'priority': 'medium'
            })
        
        lcp = pagespeed_data.get('lcp', 0)
        if lcp > 4:
            issues.append({
                'category': 'performance',
                'title': '🐌 LCP (chargement)',
                'message': f"🐌 LCP: {lcp:.1f}s (recommandé < 2.5s)",
                'priority': 'high'
            })
        elif lcp > 2.5:
            issues.append({
                'category': 'performance',
                'title': '🐌 LCP (chargement)',
                'message': f"🐌 LCP: {lcp:.1f}s à surveiller",
                'priority': 'medium'
            })
        
        cls = pagespeed_data.get('cls', 0)
        if cls > 0.25:
            issues.append({
                'category': 'performance',
                'title': '📐 CLS (stabilité)',
                'message': f"📐 CLS: {cls:.3f} (recommandé < 0.1)",
                'priority': 'high'
            })
        
        return issues
    
    def analyze(self):
        """Analyse complète sans conditions"""
        print(f"🧠 Agent SEO: Analyse de {self.site_url}")
        
        # 1. Analyse du contenu
        content_analysis = self.analyze_content_vector()
        
        # 2. Analyse des performances
        performance_analysis = self.analyze_performance_stats()
        
        # 3. Analyse SEO
        seo_analysis = self.analyze_seo_correlations()
        
        # Stocker les métriques
        self.avg_ctr = seo_analysis.get('avg_ctr', 0)
        self.avg_position = seo_analysis.get('avg_position', 0)
        self.load_time = content_analysis.get('load_time', 0)
        self.title_length = content_analysis.get('title_length', 0)
        self.has_title = content_analysis.get('has_title', 0)
        self.meta_desc_length = content_analysis.get('meta_desc_length', 0)
        self.has_meta_desc = content_analysis.get('has_meta_desc', 0)
        self.h1_count = content_analysis.get('h1_count', 0)
        self.h2_count = content_analysis.get('h2_count', 0)
        self.h3_count = content_analysis.get('h3_count', 0)
        self.images_without_alt = content_analysis.get('img_without_alt', 0)
        self.text_length = content_analysis.get('text_length', 0)
        self.internal_links = content_analysis.get('internal_links', 0)
        
        # 4. Détection du secteur
        try:
            response = requests.get(self.site_url, timeout=10)
            soup = BeautifulSoup(response.text, 'html.parser')
            text = soup.get_text()
            self.industry = self.detect_industry(soup, text)
        except:
            self.industry = 'default'
        
        print(f"📊 Secteur: {INDUSTRY_BENCHMARKS.get(self.industry, INDUSTRY_BENCHMARKS['default'])['name']}")
        
        # 5. Analyse PageSpeed
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            pagespeed_data = loop.run_until_complete(self.get_pagespeed_metrics())
            pagespeed_issues = self.analyze_performance_metrics(pagespeed_data)
            loop.close()
        except:
            pagespeed_issues = []
        
        # 6. Génération des scores
        self.generate_scores(content_analysis, performance_analysis, seo_analysis, self.industry)
        
        # 7. Génération des recommandations
        self.generate_recommendations()
        
        # 8. Ajout des issues PageSpeed
        for issue in pagespeed_issues:
            self.recommendations.append({
                'category': issue['category'],
                'title': issue['title'],
                'message': issue['message'],
                'priority': issue['priority'],
                'priority_score': 3 if issue['priority'] == 'high' else (2 if issue['priority'] == 'medium' else 1),
                'gain': 0
            })
        
        return self.recommendations
    
    def analyze_content_vector(self):
        """Vectorise le contenu et calcule les métriques - VERSION ROBUSTE AVEC DEBUG"""
        try:
            # Utiliser un User-Agent réaliste
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
            response = requests.get(self.site_url, timeout=15, headers=headers)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # --- Titre ---
            title_tag = soup.find('title')
            title = title_tag.string.strip() if title_tag and title_tag.string else ""
            title_length = len(title)
            has_title = 1 if title else 0
            print(f"📝 Titre trouvé: '{title[:60]}' ({title_length} caractères)")
            
            # --- Meta description ---
            meta_tag = soup.find('meta', attrs={'name': 'description'})
            meta_desc = meta_tag.get('content', '').strip() if meta_tag else ""
            meta_desc_length = len(meta_desc)
            has_meta_desc = 1 if meta_desc else 0
            print(f"📄 Meta description: {meta_desc_length} caractères")
            
            # --- Balises H1, H2, H3 ---
            h1_count = len(soup.find_all('h1'))
            h2_count = len(soup.find_all('h2'))
            h3_count = len(soup.find_all('h3'))
            print(f"🏗️ H1: {h1_count}, H2: {h2_count}, H3: {h3_count}")
            
            # --- Images ---
            images = soup.find_all('img')
            img_count = len(images)
            img_without_alt = len([img for img in images if not img.get('alt')])
            print(f"🖼️ Images: {img_count} total, {img_without_alt} sans alt")
            
            # --- Liens internes / externes ---
            links = soup.find_all('a', href=True)
            internal = 0
            external = 0
            parsed_url = urlparse(self.site_url)
            main_domain = parsed_url.netloc.replace('www.', '')
            social_domains = ['facebook.com', 'twitter.com', 'instagram.com', 'linkedin.com', 
                              'youtube.com', 'tiktok.com', 'pinterest.com', 'whatsapp.com',
                              'github.com', 'vercel.app']
            for link in links:
                href = link.get('href', '').strip()
                if not href or href == '#' or href.startswith('javascript:') or href.startswith('mailto:') or href.startswith('tel:'):
                    continue
                if any(dom in href.lower() for dom in social_domains):
                    continue
                if href.startswith('/') and not href.startswith('//'):
                    internal += 1
                elif main_domain in href and 'http' in href:
                    internal += 1
                elif href.startswith('http') and main_domain not in href:
                    external += 1
            print(f"🔗 Liens: {internal} internes, {external} externes")
            
            # --- Taille du contenu ---
            text = soup.get_text()
            text_length = len(text)
            print(f"📖 Contenu: {text_length} caractères")
            
            # --- Autres métriques techniques ---
            canonical = soup.find('link', rel='canonical')
            has_canonical = 1 if canonical and canonical.get('href') else 0
            schema = soup.find('script', type='application/ld+json')
            has_schema = 1 if schema else 0
            viewport = soup.find('meta', attrs={'name': 'viewport'})
            has_viewport = 1 if viewport else 0
            
            # --- Temps de chargement ---
            load_time = response.elapsed.total_seconds()
            print(f"⚡ Temps de chargement: {load_time:.2f}s")
            
            metrics = {
                'title_length': title_length,
                'has_title': has_title,
                'meta_desc_length': meta_desc_length,
                'has_meta_desc': has_meta_desc,
                'h1_count': h1_count,
                'h2_count': h2_count,
                'h3_count': h3_count,
                'img_count': img_count,
                'img_without_alt': img_without_alt,
                'internal_links': internal,
                'external_links': external,
                'text_length': text_length,
                'has_canonical': has_canonical,
                'has_schema': has_schema,
                'has_viewport': has_viewport,
                'load_time': load_time,
                'page_size': len(response.content) / 1024,
            }
            return metrics
            
        except Exception as e:
            print(f"❌ Erreur analyse contenu: {e}")
            # Retourner un dictionnaire avec des valeurs par défaut
            return {
                'title_length': 0, 'has_title': 0,
                'meta_desc_length': 0, 'has_meta_desc': 0,
                'h1_count': 0, 'h2_count': 0, 'h3_count': 0,
                'img_count': 0, 'img_without_alt': 0,
                'internal_links': 0, 'external_links': 0,
                'text_length': 0, 'has_canonical': 0,
                'has_schema': 0, 'has_viewport': 0,
                'load_time': 0, 'page_size': 0,
            }
    
    def analyze_performance_stats(self):
        """Analyse statistique des performances (trafic)"""
        stats = {
            'total_users': 0,
            'avg_users': 0,
            'total_sessions': 0,
            'avg_sessions': 0,
            'total_views': 0,
            'avg_views': 0,
            'trend': 0,
            'volatility': 0,
        }
        
        if self.ga_data and len(self.ga_data) > 0:
            users_list = []
            sessions_list = []
            views_list = []
            
            for item in self.ga_data:
                try:
                    users = int(item.get('users', 0)) if item.get('users') else 0
                    sessions = int(item.get('sessions', 0)) if item.get('sessions') else 0
                    views = int(item.get('views', 0)) if item.get('views') else 0
                    users_list.append(users)
                    sessions_list.append(sessions)
                    views_list.append(views)
                except:
                    pass
            
            if users_list:
                stats['total_users'] = sum(users_list)
                stats['avg_users'] = stats['total_users'] / len(users_list)
                stats['total_sessions'] = sum(sessions_list)
                stats['avg_sessions'] = stats['total_sessions'] / len(sessions_list)
                stats['total_views'] = sum(views_list)
                stats['avg_views'] = stats['total_views'] / len(views_list)
                
                if len(users_list) >= 14:
                    recent = sum(users_list[-7:])
                    previous = sum(users_list[-14:-7])
                    stats['trend'] = ((recent - previous) / (previous + 1)) * 100
                    
                    mean = stats['avg_users']
                    variance = sum((x - mean) ** 2 for x in users_list) / len(users_list)
                    stats['volatility'] = math.sqrt(variance)
        
        return stats
    
    def analyze_seo_correlations(self):
        """Analyse des corrélations SEO (CTR, position)"""
        seo_metrics = {
            'total_clicks': 0,
            'total_impressions': 0,
            'avg_ctr': 0,
            'avg_position': 0,
            'keyword_count': 0,
            'ctr_variance': 0,
            'position_variance': 0,
        }
        
        if self.gsc_data and len(self.gsc_data) > 0:
            clicks_list = []
            impressions_list = []
            ctr_list = []
            position_list = []
            
            for item in self.gsc_data:
                try:
                    clicks = int(item.get('clicks', 0)) if item.get('clicks') else 0
                    impressions = int(item.get('impressions', 0)) if item.get('impressions') else 0
                    ctr = float(item.get('ctr', 0)) if item.get('ctr') else 0
                    position = float(item.get('position', 0)) if item.get('position') else 0
                    
                    clicks_list.append(clicks)
                    impressions_list.append(impressions)
                    ctr_list.append(ctr)
                    position_list.append(position)
                except:
                    pass
            
            if clicks_list:
                seo_metrics['total_clicks'] = sum(clicks_list)
                seo_metrics['total_impressions'] = sum(impressions_list)
                seo_metrics['keyword_count'] = len(clicks_list)
                
                if impressions_list:
                    total_imp = sum(impressions_list)
                    if total_imp > 0:
                        seo_metrics['avg_ctr'] = seo_metrics['total_clicks'] / total_imp
                
                if position_list:
                    seo_metrics['avg_position'] = sum(position_list) / len(position_list)
                    mean_pos = seo_metrics['avg_position']
                    seo_metrics['position_variance'] = sum((p - mean_pos) ** 2 for p in position_list) / len(position_list)
                
                if ctr_list:
                    mean_ctr = seo_metrics['avg_ctr']
                    seo_metrics['ctr_variance'] = sum((c - mean_ctr) ** 2 for c in ctr_list) / len(ctr_list)
        
        return seo_metrics
    
    def generate_scores(self, content, performance, seo, industry='default'):
        """Génère des scores pondérés avec benchmark"""
        
        # Score de contenu
        content_score = 0
        content_weight = 0
        
        if content.get('has_title', 0):
            ideal_title = 45
            diff = abs(content.get('title_length', 0) - ideal_title)
            title_score = max(0, 100 - (diff * 2))
            content_score += title_score * 0.15
            content_weight += 0.15
        
        if content.get('has_meta_desc', 0):
            ideal_meta = 120
            diff = abs(content.get('meta_desc_length', 0) - ideal_meta)
            meta_score = max(0, 100 - (diff * 0.8))
            content_score += meta_score * 0.10
            content_weight += 0.10
        else:
            content_score += 0 * 0.10
            content_weight += 0.10
        
        h1_count = content.get('h1_count', 0)
        if h1_count == 1:
            content_score += 100 * 0.10
        elif h1_count == 0:
            content_score += 0 * 0.10
        else:
            content_score += 50 * 0.10
        content_weight += 0.10
        
        h2_h3_ratio = (content.get('h2_count', 0) + content.get('h3_count', 0)) / 10
        structure_score = min(100, h2_h3_ratio * 100)
        content_score += structure_score * 0.10
        content_weight += 0.10
        
        if content.get('img_count', 0) > 0:
            alt_ratio = 1 - (content.get('img_without_alt', 0) / content.get('img_count', 1))
            alt_score = alt_ratio * 100
            content_score += alt_score * 0.10
        content_weight += 0.10
        
        internal_score = min(100, content.get('internal_links', 0) * 5)
        content_score += internal_score * 0.10
        content_weight += 0.10
        
        text_score = min(100, content.get('text_length', 0) / 20)
        content_score += text_score * 0.15
        content_weight += 0.15
        
        tech_score = 0
        tech_score += content.get('has_canonical', 0) * 33
        tech_score += content.get('has_schema', 0) * 33
        tech_score += content.get('has_viewport', 0) * 34
        content_score += tech_score * 0.10
        content_weight += 0.10
        
        perf_score = 0
        load_time = content.get('load_time', 0)
        if load_time < 1:
            perf_score = 100
        elif load_time < 2:
            perf_score = 70
        elif load_time < 3:
            perf_score = 40
        else:
            perf_score = 10
        content_score += perf_score * 0.10
        content_weight += 0.10
        
        if content_weight > 0:
            self.scores['content'] = content_score / content_weight
        else:
            self.scores['content'] = 0
        
        # Score de performance (trafic)
        if performance.get('total_users', 0) > 0:
            traffic_score = min(100, (performance['total_users'] / 500) * 100)
            engagement_score = 0
            if performance.get('avg_views', 0) > 0 and performance.get('avg_sessions', 0) > 0:
                pages_per_session = performance['avg_views'] / performance['avg_sessions']
                engagement_score = min(100, pages_per_session * 50)
            self.scores['performance'] = (traffic_score * 0.6) + (engagement_score * 0.4)
        else:
            self.scores['performance'] = 0
        
        # Score SEO (Search Console)
        if seo.get('total_impressions', 0) > 0:
            ctr_score_raw = (seo.get('avg_ctr', 0) / 0.05) * 100
            ctr_score = min(100, ctr_score_raw)
            position_score = max(0, 100 - (seo.get('avg_position', 0) * 3))
            self.scores['seo'] = (ctr_score * 0.4) + (position_score * 0.6)
            print(f"🎯 SEO - CTR: {seo.get('avg_ctr', 0):.3f} ({ctr_score:.0f}/100) - Position: {seo.get('avg_position', 0):.1f} ({position_score:.0f}/100) = {self.scores['seo']:.0f}/100")
        else:
            self.scores['seo'] = 0
        
        # Poids dynamiques
        weights = CATEGORY_WEIGHTS.get(industry, CATEGORY_WEIGHTS['default'])
        
        self.scores['global'] = (
            self.scores.get('content', 0) * weights['content'] +
            self.scores.get('performance', 0) * weights['performance'] +
            self.scores.get('seo', 0) * weights['seo']
        )
        
        self.benchmark = INDUSTRY_BENCHMARKS.get(industry, INDUSTRY_BENCHMARKS['default'])
        
        if self.avg_ctr > 0:
            ctr_vs_benchmark = (self.avg_ctr / self.benchmark['avg_ctr']) * 100 if self.benchmark['avg_ctr'] > 0 else 100
            self.scores['competitiveness'] = min(150, ctr_vs_benchmark)
    
    def generate_recommendations(self):
        """Génère des recommandations courtes et claires"""
        
        recommendations_list = []
        
        # --- 1. Titre (balise title) ---
        if self.has_title == 0:
            recommendations_list.append({
                'category': 'title',
                'title': '📝 Titre',
                'message': "❌ Balise title manquante ! Ajoutez un titre de 30-60 caractères.",
                'priority': 'high',
                'priority_score': 3
            })
        else:
            if self.title_length < 30:
                recommendations_list.append({
                    'category': 'title',
                    'title': '📝 Titre',
                    'message': f"📝 Titre trop court: {self.title_length} caractères (idéal 30-60)",
                    'priority': 'medium',
                    'priority_score': 2
                })
            elif self.title_length > 60:
                recommendations_list.append({
                    'category': 'title',
                    'title': '📝 Titre',
                    'message': f"📝 Titre trop long: {self.title_length} caractères (idéal 30-60)",
                    'priority': 'medium',
                    'priority_score': 2
                })
            else:
                recommendations_list.append({
                    'category': 'title',
                    'title': '📝 Titre',
                    'message': f"✅ Titre: {self.title_length} caractères (bonne longueur)",
                    'priority': 'low',
                    'priority_score': 1
                })
        
        # --- 2. Meta description ---
        if self.has_meta_desc == 0:
            recommendations_list.append({
                'category': 'meta',
                'title': '📄 Meta description',
                'message': "❌ Meta description manquante ! Ajoutez une description de 50-160 caractères.",
                'priority': 'high',
                'priority_score': 3
            })
        else:
            if self.meta_desc_length < 50:
                recommendations_list.append({
                    'category': 'meta',
                    'title': '📄 Meta description',
                    'message': f"📄 Meta description trop courte: {self.meta_desc_length} caractères (min 50)",
                    'priority': 'medium',
                    'priority_score': 2
                })
            elif self.meta_desc_length > 160:
                recommendations_list.append({
                    'category': 'meta',
                    'title': '📄 Meta description',
                    'message': f"📄 Meta description trop longue: {self.meta_desc_length} caractères (max 160)",
                    'priority': 'medium',
                    'priority_score': 2
                })
            else:
                recommendations_list.append({
                    'category': 'meta',
                    'title': '📄 Meta description',
                    'message': f"✅ Meta description: {self.meta_desc_length} caractères",
                    'priority': 'low',
                    'priority_score': 1
                })
        
        # --- 3. Structure H1 ---
        if self.h1_count == 0:
            recommendations_list.append({
                'category': 'structure',
                'title': '🏗️ Structure H1',
                'message': "🏗️ Aucune balise H1 trouvée (recommandé: 1 seule)",
                'priority': 'high',
                'priority_score': 3
            })
        elif self.h1_count > 1:
            recommendations_list.append({
                'category': 'structure',
                'title': '🏗️ Structure H1',
                'message': f"🏗️ {self.h1_count} balises H1 trouvées (recommandé: 1 seule)",
                'priority': 'medium',
                'priority_score': 2
            })
        else:
            recommendations_list.append({
                'category': 'structure',
                'title': '🏗️ Structure H1',
                'message': "✅ Une seule balise H1",
                'priority': 'low',
                'priority_score': 1
            })
        
        # --- 4. Images sans alt ---
        if self.images_without_alt > 0:
            recommendations_list.append({
                'category': 'content',
                'title': '🖼️ Images',
                'message': f"🖼️ {self.images_without_alt} images sans attribut alt",
                'priority': 'medium',
                'priority_score': 2
            })
        else:
            recommendations_list.append({
                'category': 'content',
                'title': '🖼️ Images',
                'message': "✅ Toutes les images ont un attribut alt",
                'priority': 'low',
                'priority_score': 1
            })
        
        # --- 5. Longueur du contenu ---
        if self.text_length < 500:
            recommendations_list.append({
                'category': 'content',
                'title': '📖 Contenu',
                'message': f"📖 Contenu trop court: {self.text_length} caractères (min 800 recommandé)",
                'priority': 'high',
                'priority_score': 3
            })
        elif self.text_length < 800:
            recommendations_list.append({
                'category': 'content',
                'title': '📖 Contenu',
                'message': f"📖 Contenu moyen: {self.text_length} caractères (viser 800+)",
                'priority': 'medium',
                'priority_score': 2
            })
        else:
            recommendations_list.append({
                'category': 'content',
                'title': '📖 Contenu',
                'message': f"✅ Contenu riche: {self.text_length} caractères",
                'priority': 'low',
                'priority_score': 1
            })
        
        # --- 6. Liens internes ---
        if self.internal_links < 3:
            recommendations_list.append({
                'category': 'content',
                'title': '🔗 Liens internes',
                'message': f"🔗 Peu de liens internes: {self.internal_links} (5+ recommandé)",
                'priority': 'medium',
                'priority_score': 2
            })
        elif self.internal_links < 10:
            recommendations_list.append({
                'category': 'content',
                'title': '🔗 Liens internes',
                'message': f"🔗 {self.internal_links} liens internes (peut être amélioré)",
                'priority': 'low',
                'priority_score': 1
            })
        else:
            recommendations_list.append({
                'category': 'content',
                'title': '🔗 Liens internes',
                'message': f"✅ {self.internal_links} liens internes (bon maillage)",
                'priority': 'low',
                'priority_score': 1
            })
        
        # --- 7. Temps de réponse serveur (HTTP) ---
        if self.load_time > 3:
            recommendations_list.append({
                'category': 'technical',
                'title': '🚀 Temps de réponse serveur',
                'message': f"🚀 Serveur très lent: {self.load_time:.1f}s (recommandé < 2s)",
                'priority': 'high',
                'priority_score': 3
            })
        elif self.load_time > 2:
            recommendations_list.append({
                'category': 'technical',
                'title': '🚀 Temps de réponse serveur',
                'message': f"🚀 Serveur lent: {self.load_time:.1f}s (recommandé < 2s)",
                'priority': 'medium',
                'priority_score': 2
            })
        else:
            recommendations_list.append({
                'category': 'technical',
                'title': '🚀 Temps de réponse serveur',
                'message': f"✅ Serveur rapide: {self.load_time:.1f}s",
                'priority': 'low',
                'priority_score': 1
            })
        
        # --- 8. Trafic ---
        if self.scores.get('performance', 0) > 0:
            if self.scores['performance'] < 30:
                recommendations_list.append({
                    'category': 'traffic',
                    'title': '📊 Trafic',
                    'message': f"📊 Trafic très faible: {self.scores['performance']:.0f}/100",
                    'priority': 'high',
                    'priority_score': 3
                })
            elif self.scores['performance'] < 60:
                recommendations_list.append({
                    'category': 'traffic',
                    'title': '📊 Trafic',
                    'message': f"📊 Trafic à améliorer: {self.scores['performance']:.0f}/100",
                    'priority': 'medium',
                    'priority_score': 2
                })
            else:
                recommendations_list.append({
                    'category': 'traffic',
                    'title': '📊 Trafic',
                    'message': f"✅ Bon trafic: {self.scores['performance']:.0f}/100",
                    'priority': 'low',
                    'priority_score': 1
                })
        
        # --- 9. CTR ---
        if self.avg_ctr > 0:
            ctr_percent = self.avg_ctr * 100
            if ctr_percent < 2:
                recommendations_list.append({
                    'category': 'seo',
                    'title': '🎯 Taux de clic (CTR)',
                    'message': f"🎯 CTR très faible: {ctr_percent:.1f}% (viser 3-5%)",
                    'priority': 'high',
                    'priority_score': 3
                })
            elif ctr_percent < 3:
                recommendations_list.append({
                    'category': 'seo',
                    'title': '🎯 Taux de clic (CTR)',
                    'message': f"🎯 CTR faible: {ctr_percent:.1f}% (viser 3-5%)",
                    'priority': 'medium',
                    'priority_score': 2
                })
            else:
                recommendations_list.append({
                    'category': 'seo',
                    'title': '🎯 Taux de clic (CTR)',
                    'message': f"✅ Bon CTR: {ctr_percent:.1f}%",
                    'priority': 'low',
                    'priority_score': 1
                })
        
        # --- 10. Position Google ---
        if self.avg_position > 0:
            if self.avg_position > 20:
                recommendations_list.append({
                    'category': 'seo',
                    'title': '📍 Position Google',
                    'message': f"📍 Position faible: {self.avg_position:.1f} (viser page 1)",
                    'priority': 'high',
                    'priority_score': 3
                })
            elif self.avg_position > 10:
                recommendations_list.append({
                    'category': 'seo',
                    'title': '📍 Position Google',
                    'message': f"📍 Position à améliorer: {self.avg_position:.1f} (viser page 1)",
                    'priority': 'medium',
                    'priority_score': 2
                })
            else:
                recommendations_list.append({
                    'category': 'seo',
                    'title': '📍 Position Google',
                    'message': f"✅ Bonne position: {self.avg_position:.1f}",
                    'priority': 'low',
                    'priority_score': 1
                })
        
        # Trier par priorité (high > medium > low)
        priority_order = {'high': 3, 'medium': 2, 'low': 1}
        recommendations_list.sort(key=lambda x: priority_order.get(x['priority'], 0), reverse=True)
        
        # Ajouter les recommandations (max 8)
        for rec in recommendations_list[:8]:
            self.recommendations.append(rec)
        
        # --- Score global (amélioré, avec explication) ---
        # Interprétation du score
        global_score = self.scores['global']
        if global_score < 40:
            interpretation = "🔴 Faible - Travail important à fournir"
        elif global_score < 70:
            interpretation = "🟠 Moyen - Plusieurs points à corriger"
        else:
            interpretation = "🟢 Bon - Bien optimisé"
        
        score_msg = f"📊 Score SEO global: {global_score:.0f}/100 ({interpretation})\n"
        score_msg += f"   • 📝 Contenu: {self.scores['content']:.0f}/100 (poids {CATEGORY_WEIGHTS.get(self.industry, CATEGORY_WEIGHTS['default'])['content']*100:.0f}%)\n"
        score_msg += f"   • 📊 Trafic: {self.scores['performance']:.0f}/100 (poids {CATEGORY_WEIGHTS.get(self.industry, CATEGORY_WEIGHTS['default'])['performance']*100:.0f}%)\n"
        score_msg += f"   • 🎯 SEO (position/CTR): {self.scores['seo']:.0f}/100 (poids {CATEGORY_WEIGHTS.get(self.industry, CATEGORY_WEIGHTS['default'])['seo']*100:.0f}%)"
        
        self.recommendations.insert(0, {
            'category': 'global',
            'title': '📊 Score SEO',
            'message': score_msg,
            'priority': 'high',
            'priority_score': 3,
            'gain': 0
        })
        
        # Benchmark (comparaison secteur)
        if self.benchmark and self.industry != 'default' and self.avg_ctr > 0:
            benchmark_msg = f"📈 Référence {self.benchmark['name']}: CTR {self.benchmark['avg_ctr']*100:.0f}% | Position {self.benchmark['avg_position']:.0f}"
            self.recommendations.append({
                'category': 'benchmark',
                'title': '📈 Comparaison secteur',
                'message': benchmark_msg,
                'priority': 'low',
                'priority_score': 1,
                'gain': 0
            })


def get_smart_seo_recommendations(site_url, ga_data=None, gsc_data=None):
    """Fonction principale pour obtenir les recommandations SEO intelligentes"""
    agent = SmartSEOAgent(site_url, ga_data, gsc_data)
    recommendations = agent.analyze()
    return recommendations