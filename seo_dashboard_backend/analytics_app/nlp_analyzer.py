import spacy
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import requests
from bs4 import BeautifulSoup

class SemanticAnalyzer:
    def __init__(self):
        # Chargement du modèle de langue français
        self.nlp = spacy.load("fr_core_news_sm")

    def get_page_content(self, url):
        """Récupère et nettoie le contenu textuel d'une page web."""
        try:
            response = requests.get(url, timeout=10)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Suppression des balises script et style
            for script in soup(["script", "style"]):
                script.decompose()
            
            text = soup.get_text()
            # Nettoyage basique
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            return text
        except Exception as e:
            print(f"Erreur lors de l'extraction du contenu: {e}")
            return ""

    def preprocess_text(self, text):
        """Nettoie et lemmatise le texte."""
        doc = self.nlp(text)
        # Garde uniquement les mots non-stopwords et non-punctuations, puis les lemmatise
        tokens = [token.lemma_.lower() for token in doc if not token.is_stop and not token.is_punct]
        return " ".join(tokens)

    def calculate_similarity(self, text1, text2):
        """Calcule la similarité cosinus entre deux textes."""
        if not text1 or not text2:
            return 0.0
        # Création du vecteur TF-IDF
        vectorizer = TfidfVectorizer().fit_transform([text1, text2])
        vectors = vectorizer.toarray()
        # Calcul de la similarité cosinus
        cosine_sim = cosine_similarity(vectors)
        # La similarité est une matrice 2x2, on prend la valeur (0,1)
        return cosine_sim[0, 1]

    def extract_key_entities(self, text):
        """Extrait les entités nommées (personnes, organisations, lieux) du texte."""
        doc = self.nlp(text)
        entities = {}
        for ent in doc.ents:
            if ent.label_ not in entities:
                entities[ent.label_] = []
            if ent.text not in entities[ent.label_]:
                entities[ent.label_].append(ent.text)
        return entities