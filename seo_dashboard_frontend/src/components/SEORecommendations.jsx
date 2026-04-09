import { useState, useEffect } from "react";
import api from "../services/api";

function SEORecommendations({ websiteId, token }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRecommendations = async () => {
    if (!websiteId) {
      console.log("Pas de websiteId");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Appel API:", `/recommendations/${websiteId}/`);
      const res = await api.get(`/recommendations/${websiteId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Réponse reçue:", res.data);
      
      // Vérifier que les données sont un tableau
      if (Array.isArray(res.data)) {
        setRecommendations(res.data);
      } else {
        console.error("Les données ne sont pas un tableau:", res.data);
        setError("Format de données incorrect");
      }
    } catch (err) {
      console.error("Erreur complète:", err);
      console.error("Response:", err.response);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || "Impossible de charger les recommandations";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (websiteId) {
      fetchRecommendations();
    }
  }, [websiteId]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc2626';
      case 'medium': return '#f59e0b';
      default: return '#10b981';
    }
  };

  const getPriorityBg = (priority) => {
    switch (priority) {
      case 'high': return '#fee2e2';
      case 'medium': return '#fef3c7';
      default: return '#d1fae5';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return '⚠️ Haute priorité';
      case 'medium': return '📌 Priorité moyenne';
      default: return '✅ Priorité basse';
    }
  };

  const styles = {
    container: {
      background: "#fff",
      borderRadius: "16px",
      padding: "24px",
      marginTop: "20px",
      marginBottom: "20px",
      boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "20px",
      flexWrap: "wrap",
      gap: "10px",
    },
    title: {
      fontSize: "20px",
      fontWeight: "bold",
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },
    button: {
      background: "#6366f1",
      color: "#fff",
      border: "none",
      padding: "8px 16px",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "13px",
      transition: "background 0.2s",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
      gap: "16px",
    },
    card: {
      background: "#f9fafb",
      borderRadius: "12px",
      padding: "16px",
      borderLeft: "4px solid",
      transition: "transform 0.2s, box-shadow 0.2s",
      cursor: "pointer",
    },
    cardHover: {
      transform: "translateY(-2px)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    },
    cardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "12px",
      flexWrap: "wrap",
      gap: "8px",
    },
    category: {
      fontSize: "14px",
      fontWeight: "bold",
    },
    priority: {
      fontSize: "11px",
      padding: "4px 8px",
      borderRadius: "20px",
      fontWeight: "bold",
    },
    message: {
      fontSize: "14px",
      color: "#374151",
      lineHeight: "1.5",
    },
    loading: {
      textAlign: "center",
      padding: "40px",
      color: "#6b7280",
    },
    error: {
      background: "#fee2e2",
      color: "#dc2626",
      padding: "12px",
      borderRadius: "8px",
      marginBottom: "16px",
      textAlign: "center",
    },
    empty: {
      textAlign: "center",
      padding: "40px",
      color: "#6b7280",
    },
  };

  // État pour le hover
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          🤖 Agent SEO en analyse de votre site...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>
          🤖 Agent SEO - Recommandations intelligentes
        </div>
        <button 
          style={styles.button} 
          onClick={fetchRecommendations}
          onMouseEnter={(e) => e.target.style.background = "#4f46e5"}
          onMouseLeave={(e) => e.target.style.background = "#6366f1"}
        >
          🔄 Actualiser
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          ❌ {error}
        </div>
      )}

      {!error && recommendations.length === 0 && (
        <div style={styles.empty}>
          ✅ Aucune recommandation pour le moment. Votre site est bien optimisé !
        </div>
      )}

      {recommendations.length > 0 && (
        <div style={styles.grid}>
          {recommendations.map((rec, index) => (
            <div
              key={index}
              style={{
                ...styles.card,
                borderLeftColor: getPriorityColor(rec.priority),
                ...(hoveredIndex === index ? styles.cardHover : {}),
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div style={styles.cardHeader}>
                <span style={styles.category}>{rec.title}</span>
                <span
                  style={{
                    ...styles.priority,
                    background: getPriorityBg(rec.priority),
                    color: getPriorityColor(rec.priority),
                  }}
                >
                  {getPriorityText(rec.priority)}
                </span>
              </div>
              <div style={styles.message}>{rec.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SEORecommendations;