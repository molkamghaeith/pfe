import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import homeImg from "../assets/home.png";

function Home() {
  const styles = {
    imageContainer: {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
},

image: {
  width: "100%",
  maxWidth: "550px",
  borderRadius: "20px",
  boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
},
    page: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #f5f7fb, #eef2ff)",
      fontFamily: "Arial, sans-serif",
    },
    hero: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "80px 30px",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "40px",
      alignItems: "center",
    },
    left: {},
    title: {
      fontSize: "54px",
      fontWeight: "bold",
      color: "#111827",
      marginBottom: "20px",
      lineHeight: 1.15,
    },
    accent: {
      color: "#6366f1",
    },
    text: {
      fontSize: "20px",
      color: "#4b5563",
      lineHeight: 1.7,
      marginBottom: "30px",
    },
    buttons: {
      display: "flex",
      gap: "16px",
      flexWrap: "wrap",
    },
    primaryButton: {
      textDecoration: "none",
      background: "#111827",
      color: "#fff",
      padding: "14px 22px",
      borderRadius: "12px",
      fontWeight: "bold",
    },
    secondaryButton: {
      textDecoration: "none",
      background: "#ffffff",
      color: "#111827",
      padding: "14px 22px",
      borderRadius: "12px",
      fontWeight: "bold",
      border: "1px solid #d1d5db",
    },
    right: {
      background: "#ffffff",
      borderRadius: "24px",
      boxShadow: "0 12px 30px rgba(0,0,0,0.1)",
      padding: "30px",
    },
    cardTitle: {
      fontSize: "24px",
      fontWeight: "bold",
      marginBottom: "20px",
      color: "#111827",
    },
    list: {
      display: "grid",
      gap: "14px",
    },
    item: {
      background: "#f9fafb",
      padding: "16px",
      borderRadius: "14px",
      border: "1px solid #e5e7eb",
    },
    itemTitle: {
      fontWeight: "bold",
      color: "#111827",
      marginBottom: "6px",
    },
    itemText: {
      color: "#6b7280",
      fontSize: "15px",
    },
    section: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "0 30px 60px",
    },
    sectionTitle: {
      textAlign: "center",
      fontSize: "34px",
      fontWeight: "bold",
      marginBottom: "30px",
      color: "#111827",
    },
    features: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "20px",
    },
    featureCard: {
      background: "#ffffff",
      borderRadius: "18px",
      padding: "24px",
      boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
    },
    featureTitle: {
      fontSize: "20px",
      fontWeight: "bold",
      marginBottom: "10px",
      color: "#111827",
    },
    featureText: {
      color: "#6b7280",
      lineHeight: 1.6,
    },
  };

  return (
    <div style={styles.page}>
      

     <section style={styles.hero}>
  
 

  {/* TEXTE À DROITE */}
  <div style={styles.left}>
    <h1 style={styles.title}>
      Bienvenue sur SEO<span style={styles.accent}>mind</span>
    </h1>

    <p style={styles.text}>
      Une plateforme intelligente pour analyser le trafic web,
      connecter Google Analytics, suivre les performances et améliorer
      la stratégie SEO de vos sites.
    </p>

    <div style={styles.buttons}>
      <Link to="/login" style={styles.primaryButton}>
        Commencer
      </Link>
      <Link to="/register" style={styles.secondaryButton}>
        Créer un compte
      </Link>
    </div>
  </div>
   {/* IMAGE À GAUCHE */}
  <div style={styles.imageContainer}>
    <img src={homeImg} alt="SEOmind" style={styles.image} />
  </div>

</section>
      

      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Fonctionnalités principales</h2>

        <div style={styles.features}>
          <div style={styles.featureCard}>
            <div style={styles.featureTitle}>Authentification sécurisée</div>
            <div style={styles.featureText}>
              Connexion classique, réinitialisation du mot de passe et
              authentification via Google.
            </div>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureTitle}>Dashboard analytique</div>
            <div style={styles.featureText}>
              Visualisez les indicateurs clés de trafic et leur évolution
              à travers des graphiques.
            </div>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureTitle}>Vision SEO intelligente</div>
            <div style={styles.featureText}>
              Une base solide pour intégrer ensuite des recommandations SEO
              automatisées.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;