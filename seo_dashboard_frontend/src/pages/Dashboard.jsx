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

function Dashboard() {
  const [url, setUrl] = useState("");
  const [nomSite, setNomSite] = useState("");
  const [sites, setSites] = useState([]);
  const [properties, setProperties] = useState([]);
  const [gaData, setGaData] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedPropertyName, setSelectedPropertyName] = useState("");

  const token = localStorage.getItem("access");

  const formattedChartData = gaData.map((item) => ({
    ...item,
    date: `${item.date.slice(6, 8)}/${item.date.slice(4, 6)}`,
    users: Number(item.users),
    sessions: Number(item.sessions),
    views: Number(item.views),
  }));

  const fetchSites = async () => {
    try {
      const response = await api.get("/sites/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSites(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchProperties = async () => {
    try {
      const response = await api.get("/google-analytics/properties/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProperties(response.data);
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.error ||
          "Impossible de récupérer les propriétés Google Analytics"
      );
    }
  };

  const fetchGAData = async (propertyId) => {
    try {
      const response = await api.get(
        `/google-analytics/data/${propertyId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setGaData(response.data);
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.error || "Erreur récupération données GA"
      );
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleAddSite = async (e) => {
    e.preventDefault();

    try {
      const verifyResponse = await api.post(
        "/google-analytics/verify-url/",
        {
          site_url: url,
          property_id: selectedPropertyId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!verifyResponse.data.match) {
        alert(
          "La propriété Google Analytics choisie ne correspond pas à l’URL du site."
        );
        return;
      }

      await api.post(
        "/add-site/",
        {
          url: url,
          nom_site: nomSite,
          property_id: selectedPropertyId,
          property_name: selectedPropertyName,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUrl("");
      setNomSite("");
      setSelectedPropertyId("");
      setSelectedPropertyName("");
      fetchSites();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Erreur lors de l'ajout du site");
    }
  };

  const handleGoogleAnalyticsConnect = async () => {
    try {
      const response = await api.get("/google-analytics/login/", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      window.location.href = response.data.auth_url;
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.detail ||
          error.response?.data?.error ||
          "Erreur lors de la connexion à Google Analytics"
      );
    }
  };

  const handlePropertyChange = (e) => {
    const propertyId = e.target.value;
    setSelectedPropertyId(propertyId);

    const selectedProperty = properties.find(
      (prop) => prop.property_id === propertyId
    );

    setSelectedPropertyName(
      selectedProperty ? selectedProperty.display_name : ""
    );
  };

  return (
    <div style={theme.page}>
      <div style={theme.container}>
        <div style={theme.dashboardCard}>
          <h2 style={{ marginBottom: "10px", fontWeight: "bold" }}>
  Dashboard SEO<span style={{ color: "#6366f1" }}>mind</span>
</h2>
          <p style={{ color: "#6b7280" }}>
            <p style={{ color: "#6b7280" }}>
  Analyse intelligente de ton trafic web avec Google Analytics.
</p>
          </p>

          <div style={theme.rowButtons}>
            <button style={theme.secondaryButton} onClick={handleGoogleAnalyticsConnect}>
              🔗 Connecter Google Analytics
            </button>

            <button style={theme.secondaryButton} onClick={fetchProperties}>
              📋 Charger propriétés GA
            </button>
          </div>
        </div>

        <div style={theme.dashboardCard}>
          <h3 style={theme.sectionTitle}>Ajouter un site</h3>

          <form onSubmit={handleAddSite}>
            <input
              style={theme.input}
              type="text"
              placeholder="URL du site"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />

            <input
              style={theme.input}
              type="text"
              placeholder="Nom du site"
              value={nomSite}
              onChange={(e) => setNomSite(e.target.value)}
            />

            <select
              style={theme.select}
              value={selectedPropertyId}
              onChange={handlePropertyChange}
            >
              <option value="">Choisir une propriété Google Analytics</option>
              {properties.map((prop) => (
                <option key={prop.property_id} value={prop.property_id}>
                  {prop.display_name} - {prop.property_id}
                </option>
              ))}
            </select>

            <button style={theme.button} type="submit">
              Ajouter site
            </button>
          </form>
        </div>

        <div style={theme.dashboardCard}>
          <h3 style={theme.sectionTitle}>Liste des sites</h3>

          {sites.length === 0 ? (
            <p>Aucun site enregistré</p>
          ) : (
            <div>
              {sites.map((site) => (
                <div key={site.id} style={theme.siteItem}>
                  <strong>{site.nom_site}</strong> - {site.url}
                  <br />
                  <span style={{ color: "#6b7280" }}>
                    Propriété GA : {site.property_name} ({site.property_id})
                  </span>
                  <br />
                  <br />
                  <button
                    style={theme.secondaryButton}
                    onClick={() => fetchGAData(site.property_id)}
                  >
                    📊 Voir stats de ce site
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={theme.dashboardCard}>
          <h3 style={theme.sectionTitle}>Graphique d’évolution du trafic</h3>

          {formattedChartData.length === 0 ? (
            <p>Aucune donnée à afficher</p>
          ) : (
            <div style={{ width: "100%", height: "420px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="users" name="Users" />
                  <Line type="monotone" dataKey="sessions" name="Sessions" />
                  <Line type="monotone" dataKey="views" name="Views" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;