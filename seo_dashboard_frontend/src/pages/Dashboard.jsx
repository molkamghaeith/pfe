import { useEffect, useState } from "react";
import api from "../services/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { theme } from "../styles/theme";
import PeriodSelector from "../components/PeriodSelector"; // ✅ AJOUT

function Dashboard() {
  const [url, setUrl] = useState("");
  const [nomSite, setNomSite] = useState("");
  const [sites, setSites] = useState([]);
  const [properties, setProperties] = useState([]);
  const [gaData, setGaData] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedPropertyName, setSelectedPropertyName] = useState("");
  const [seoData, setSeoData] = useState([]);
  const [loading, setLoading] = useState(false); // ✅ AJOUT
  const [currentPeriod, setCurrentPeriod] = useState("last30Days"); // ✅ AJOUT
  const [currentSiteUrl, setCurrentSiteUrl] = useState(""); // ✅ AJOUT

  const token = localStorage.getItem("access");

  // ================= SEARCH CONSOLE =================
  const fetchSearchConsole = async (siteUrl, startDate = null, endDate = null) => {
    if (!siteUrl) {
      alert("URL du site manquante");
      return;
    }

    setLoading(true);
    try {
      let url = `/search-console/data/?site_url=${encodeURIComponent(siteUrl)}`;
      if (startDate && endDate) {
        url += `&start_date=${startDate}&end_date=${endDate}`;
      }

      const response = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSeoData(response.data);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Erreur Search Console");
    }
    setLoading(false);
  };

  // ================= FORMAT GRAPH =================
  const formattedChartData = [...gaData]
  .sort((a, b) => a.date.localeCompare(b.date)) // ✅ Tri par date originale
  .map((item) => ({
    ...item,
    date: `${item.date.slice(6, 8)}/${item.date.slice(4, 6)}`, // formaté pour affichage
    users: Number(item.users),
    sessions: Number(item.sessions),
    views: Number(item.views),
  }));

  // ================= FETCH =================
  const fetchSites = async () => {
    const res = await api.get("/sites/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setSites(res.data);
  };

  const fetchProperties = async () => {
    const res = await api.get("/google-analytics/properties/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    setProperties(res.data);
  };

  // ✅ MODIFIÉ : accepte les dates en paramètre
  const fetchGAData = async (propertyId, startDate = null, endDate = null) => {
    setLoading(true);
    try {
      let url = `/google-analytics/data/${propertyId}/`;
      if (startDate && endDate) {
        url += `?start_date=${startDate}&end_date=${endDate}`;
      }

      const res = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGaData(res.data);
    } catch (error) {
      console.error(error);
      alert("Erreur récupération données GA");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSites();
  }, []);

  // ================= ADD SITE =================
  const handleAddSite = async (e) => {
    e.preventDefault();

    const exists = sites.some((site) => site.url === url);
    if (exists) {
      alert("Ce site existe déjà !");
      return;
    }

    try {
      const verify = await api.post(
        "/google-analytics/verify-url/",
        {
          site_url: url,
          property_id: selectedPropertyId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!verify.data.match) {
        alert("URL ≠ propriété GA");
        return;
      }

      await api.post(
        "/add-site/",
        {
          url,
          nom_site: nomSite,
          property_id: selectedPropertyId,
          property_name: selectedPropertyName,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUrl("");
      setNomSite("");
      fetchSites();
    } catch (error) {
      alert(error.response?.data?.error || "Erreur ajout site");
    }
  };

  const handleGoogleAnalyticsConnect = async () => {
    const res = await api.get("/google-analytics/login/", {
      headers: { Authorization: `Bearer ${token}` },
    });
    window.location.href = res.data.auth_url;
  };

  const handlePropertyChange = (e) => {
    const id = e.target.value;
    setSelectedPropertyId(id);
    const prop = properties.find((p) => p.property_id === id);
    setSelectedPropertyName(prop?.display_name || "");
  };

  // ✅ NOUVEAU : gère le changement de période
  const handlePeriodChange = (startDate, endDate, periodKey) => {
    setCurrentPeriod(periodKey);
    if (selectedPropertyId) {
      fetchGAData(selectedPropertyId, startDate, endDate);
    }
    if (currentSiteUrl) {
      fetchSearchConsole(currentSiteUrl, startDate, endDate);
    }
  };

  // ✅ NOUVEAU : gère le clic sur un site
  const handleSiteSelect = (site) => {
    setSelectedPropertyId(site.property_id);
    setSelectedPropertyName(site.property_name);
    setCurrentSiteUrl(site.url);
    fetchGAData(site.property_id);
    fetchSearchConsole(site.url);
  };

  // ================= STYLES =================
 // ================= STYLES (CORRIGÉS) =================
const styles = {
  searchContainer: {
    background: "#fff",
    padding: "20px",
    borderRadius: "12px",
    marginTop: "20px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
    overflowX: "auto", // ✅ permet le scroll horizontal si nécessaire
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "500px", // ✅ largeur minimale pour éviter l'écrasement
  },
  th: {
    background: "#f3f4f6",
    padding: "12px",
    textAlign: "left",
    fontWeight: "bold",
    borderBottom: "2px solid #e5e7eb",
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #eee",
    textAlign: "left",
  },
  // ✅ AJOUT : largeurs spécifiques pour chaque colonne
  colKeyword: { width: "40%" },
  colClicks: { width: "15%" },
  colImpressions: { width: "15%" },
  colCtr: { width: "15%" },
  colPosition: { width: "15%" },
};

  return (
    <div style={theme.page}>
      <div style={theme.container}>
        {/* HEADER */}
        <div style={theme.dashboardCard}>
          <h2>
            Dashboard SEO<span style={{ color: "#6366f1" }}>mind</span>
          </h2>

          <div style={theme.rowButtons}>
            <button style={theme.secondaryButton} onClick={handleGoogleAnalyticsConnect}>
              🔗 Connecter Google Analytics
            </button>

            <button style={theme.secondaryButton} onClick={fetchProperties}>
              📋 Charger propriétés
            </button>
          </div>
        </div>

        {/* ADD SITE */}
        <div style={theme.dashboardCard}>
          <h3>Ajouter un site</h3>

          <form onSubmit={handleAddSite}>
            <input
              style={theme.input}
              placeholder="URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />

            <input
              style={theme.input}
              placeholder="Nom"
              value={nomSite}
              onChange={(e) => setNomSite(e.target.value)}
            />

            <select style={theme.select} onChange={handlePropertyChange}>
              <option>Choisir propriété</option>
              {properties.map((p) => (
                <option key={p.property_id} value={p.property_id}>
                  {p.display_name}
                </option>
              ))}
            </select>

            <button style={theme.button}>Ajouter</button>
          </form>
        </div>

        {/* SITES */}
        <div style={theme.dashboardCard}>
          <h3>Sites</h3>

          {sites.map((site) => (
            <div key={site.id} style={theme.siteItem}>
              <strong>{site.nom_site}</strong>

              <button style={styles.siteButton} onClick={() => handleSiteSelect(site)}>
                📊 Sélectionner
              </button>
            </div>
          ))}
        </div>

        {/* SÉLECTEUR DE PÉRIODE */}
        <PeriodSelector onPeriodChange={handlePeriodChange} currentPeriod={currentPeriod} />

        {/* GRAPH */}
        <div style={theme.dashboardCard}>
          <h3>Graphique</h3>

          {loading && <p>Chargement des données...</p>}

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={formattedChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={2} />
              <Line type="monotone" dataKey="sessions" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="views" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* SEO TABLE */}
        <div style={styles.searchContainer}>
          <h3>Search Console</h3>

          {loading && <p>Chargement des données SEO...</p>}

          {!loading && seoData.length === 0 && (
            <p>Aucune donnée SEO disponible pour cette période.</p>
          )}

          {!loading && seoData.length > 0 && (
  <table style={styles.table}>
    <colgroup>
      <col style={styles.colKeyword} />
      <col style={styles.colClicks} />
      <col style={styles.colImpressions} />
      <col style={styles.colCtr} />
      <col style={styles.colPosition} />
    </colgroup>
    <thead>
      <tr>
        <th style={styles.th}>Mot-clé</th>
        <th style={styles.th}>Clics</th>
        <th style={styles.th}>Impressions</th>
        <th style={styles.th}>CTR</th>
        <th style={styles.th}>Position</th>
      </tr>
    </thead>
    <tbody>
      {seoData.map((row, i) => (
        <tr key={i}>
          <td style={styles.td}>{row.keyword}</td>
          <td style={styles.td}>{row.clicks}</td>
          <td style={styles.td}>{row.impressions}</td>
          <td style={styles.td}>{(row.ctr * 100).toFixed(2)}%</td>
          <td style={styles.td}>{row.position.toFixed(2)}</td>
        </tr>
      ))}
    </tbody>
  </table>
)}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;