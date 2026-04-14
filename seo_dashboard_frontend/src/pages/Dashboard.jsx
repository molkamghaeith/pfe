import { useEffect, useState } from "react";
import api from "../services/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { theme } from "../styles/theme";
import PeriodSelector from "../components/PeriodSelector";
import SEORecommendations from "../components/SEORecommendations";

function Dashboard() {
  const [url, setUrl] = useState("");
  const [nomSite, setNomSite] = useState("");
  const [sites, setSites] = useState([]);
  const [currentWebsiteId, setCurrentWebsiteId] = useState(null); 
  const [properties, setProperties] = useState([]);
  const [gaData, setGaData] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedPropertyName, setSelectedPropertyName] = useState("");
  const [seoData, setSeoData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState("last30Days");
  const [currentSiteUrl, setCurrentSiteUrl] = useState("");
  const [topPages, setTopPages] = useState([]);
  const [organicUsers, setOrganicUsers] = useState(0); // ✅ AJOUT

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
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      ...item,
      date: `${item.date.slice(6, 8)}/${item.date.slice(4, 6)}`,
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

  // ================= TOP PAGES (avec dates) =================
  const fetchTopPages = async (propertyId, startDate = null, endDate = null) => {
    try {
      let url = `/top-pages/${propertyId}/`;
      if (startDate && endDate) {
        url += `?start_date=${startDate}&end_date=${endDate}`;
      }
      const res = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTopPages(res.data);
    } catch (error) {
      console.error("Erreur top pages:", error);
      setTopPages([]);
    }
  };

  // ================= TRAFIC ORGANIQUE (AJOUT) =================
  const fetchOrganicTraffic = async (propertyId, startDate = null, endDate = null) => {
    try {
      let url = `/organic-traffic/${propertyId}/`;
      if (startDate && endDate) {
        url += `?start_date=${startDate}&end_date=${endDate}`;
      }
      const res = await api.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrganicUsers(res.data.organic_users);
    } catch (error) {
      console.error("Erreur trafic organique:", error);
      setOrganicUsers(0);
    }
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

  const handlePeriodChange = (startDate, endDate, periodKey) => {
    setCurrentPeriod(periodKey);
    if (selectedPropertyId) {
      fetchGAData(selectedPropertyId, startDate, endDate);
      fetchTopPages(selectedPropertyId, startDate, endDate);
      fetchOrganicTraffic(selectedPropertyId, startDate, endDate); // ✅ AJOUT
    }
    if (currentSiteUrl) {
      fetchSearchConsole(currentSiteUrl, startDate, endDate);
    }
  };

  const handleSiteSelect = (site) => {
    setSelectedPropertyId(site.property_id);
    setSelectedPropertyName(site.property_name);
    setCurrentSiteUrl(site.url);
    setCurrentWebsiteId(site.id);
    fetchGAData(site.property_id);
    fetchSearchConsole(site.url);
    fetchTopPages(site.property_id);
    fetchOrganicTraffic(site.property_id); // ✅ AJOUT
  };

  // ================= EXPORT FUNCTIONS =================
  const exportSEOCSV = async () => {
    if (!currentWebsiteId) {
      alert("Sélectionnez d'abord un site");
      return;
    }
    
    try {
      const response = await api.get(`/export/seo-csv/${currentWebsiteId}/`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `seo_report_${currentWebsiteId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'export CSV");
    }
  };

  const exportAnalyticsCSV = async () => {
    if (!currentWebsiteId) {
      alert("Sélectionnez d'abord un site");
      return;
    }
    
    try {
      const response = await api.get(`/export/analytics-csv/${currentWebsiteId}/`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics_report_${currentWebsiteId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'export CSV");
    }
  };

  const exportFullPDF = async () => {
    if (!currentWebsiteId) {
      alert("Sélectionnez d'abord un site");
      return;
    }
    
    try {
      const response = await api.get(`/export/full-pdf/${currentWebsiteId}/`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `seo_full_report_${currentWebsiteId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'export PDF: " + (error.response?.data?.error || error.message));
    }
  };

  // ================= STYLES =================
  const styles = {
    searchContainer: {
      background: "#fff",
      padding: "20px",
      borderRadius: "12px",
      marginTop: "20px",
      boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
      overflowX: "auto",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "500px",
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
    colKeyword: { width: "40%" },
    colClicks: { width: "15%" },
    colImpressions: { width: "15%" },
    colCtr: { width: "15%" },
    colPosition: { width: "15%" },
    siteButton: {
      marginLeft: "10px",
      padding: "5px 10px",
      background: "#e5e7eb",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
    },
    exportButtons: {
      display: "flex",
      gap: "10px",
      marginBottom: "20px",
      flexWrap: "wrap",
      justifyContent: "center",
    },
    exportBtnSEO: {
      background: "#10b981",
      color: "#fff",
      border: "none",
      padding: "10px 16px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
    },
    exportBtnAnalytics: {
      background: "#3b82f6",
      color: "#fff",
      border: "none",
      padding: "10px 16px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
    },
    exportBtnPDF: {
      background: "#ff8c00",
      color: "#fff",
      border: "none",
      padding: "10px 16px",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
    },
    cards: {
      display: "grid",
      gridTemplateColumns: "repeat(5, 1fr)", // ✅ 5 colonnes pour inclure le trafic organique
      gap: "20px",
      marginBottom: "20px",
    },
    cardStat: {
      background: "#fff",
      padding: "20px",
      borderRadius: "12px",
      boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
      textAlign: "center",
    },
  };

  // ================= FILTRAGE DES PAGES INDÉSIRABLES =================
  const validTopPages = topPages.filter(page => 
    page.path && 
    page.path !== '/' && 
    !page.path.startsWith('/_') && 
    !page.title?.includes('The land of fitness')
  );

  // ================= CALCUL DES KPI =================
  const totalUsers = gaData.reduce((sum, day) => sum + (Number(day.users) || 0), 0);
  const totalSessions = gaData.reduce((sum, day) => sum + (Number(day.sessions) || 0), 0);
  const totalViews = gaData.reduce((sum, day) => sum + (Number(day.views) || 0), 0);

  const bounceRateValues = gaData
    .map(item => Number(item.bounceRate))
    .filter(rate => !isNaN(rate) && rate !== null && rate !== undefined);
  const avgBounceRate = bounceRateValues.length > 0
    ? (bounceRateValues.reduce((a, b) => a + b, 0) / bounceRateValues.length) * 100
    : null;

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

        {/* BOUTONS D'EXPORT */}
        <div style={styles.exportButtons}>
          <button style={styles.exportBtnSEO} onClick={exportSEOCSV}>
            📊 Exporter SEO (CSV)
          </button>
          <button style={styles.exportBtnAnalytics} onClick={exportAnalyticsCSV}>
            📈 Exporter Analytics (CSV)
          </button>
          <button style={styles.exportBtnPDF} onClick={exportFullPDF}>
            📄 Exporter Rapport complet (PDF)
          </button>
        </div>

        {/* SÉLECTEUR DE PÉRIODE */}
        <PeriodSelector onPeriodChange={handlePeriodChange} currentPeriod={currentPeriod} />

        {/* CARTES KPI */}
        <div style={styles.cards}>
          <div style={styles.cardStat}>
            <h4>👥 Utilisateurs</h4>
            <p>{totalUsers}</p>
          </div>
          <div style={styles.cardStat}>
            <h4>🔄 Sessions</h4>
            <p>{totalSessions}</p>
          </div>
          <div style={styles.cardStat}>
            <h4>👁️ Pages vues</h4>
            <p>{totalViews}</p>
          </div>
          <div style={styles.cardStat}>
            <h4>📉 Taux de rebond</h4>
            <p>{avgBounceRate !== null ? `${avgBounceRate.toFixed(1)}%` : 'N/A'}</p>
          </div>
          <div style={styles.cardStat}>
            <h4>🌿 Trafic organique</h4>
            <p>{organicUsers}</p>
          </div>
        </div>

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

        {/* TOP PAGES - GRAPHIQUE À BARRES HORIZONTALES (filtré) */}
        <div style={theme.dashboardCard}>
          <h3>📄 Pages les plus consultées</h3>
          {validTopPages.length === 0 ? (
            <p>Aucune donnée disponible</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(300, validTopPages.length * 40)}>
              <BarChart
                layout="vertical"
                data={validTopPages.slice(0, 8)}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="title" width={150} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => `${value} vues`} />
                <Legend />
                <Bar dataKey="views" fill="#6366f1" name="Vues">
                  {validTopPages.slice(0, 8).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.views > 100 ? "#10b981" : "#f59e0b"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
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

        {/* RECOMMANDATIONS SEO */}
        {currentWebsiteId && (
          <SEORecommendations 
            websiteId={currentWebsiteId} 
            token={token} 
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;