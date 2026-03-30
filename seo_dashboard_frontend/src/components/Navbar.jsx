import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/");
  };

  const styles = {
    nav: {
  width: "100%",
  background: "#ffffff",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  padding: "16px 32px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  boxSizing: "border-box",
  backdropFilter: "blur(10px)",


  position: "fixed",   // ✅ FIXE
  top: 0,
  left: 0,
  zIndex: 1000,
},
    logo: {
      fontSize: "28px",
      fontWeight: "bold",
      textDecoration: "none",
      color: "#111827",
    },
    logoAccent: {
      color: "#6366f1",
    },
    links: {
      display: "flex",
      gap: "20px",
      alignItems: "center",
    },
    link: {
      textDecoration: "none",
      color: "#374151",
      fontWeight: "600",
    },
    button: {
      background: "#111827",
      color: "#fff",
      border: "none",
      padding: "10px 16px",
      borderRadius: "10px",
      cursor: "pointer",
      fontWeight: "bold",
    },
    secondaryButton: {
      background: "#e5e7eb",
      color: "#111827",
      border: "none",
      padding: "10px 16px",
      borderRadius: "10px",
      cursor: "pointer",
      fontWeight: "bold",
    },
  };

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.logo}>
        SEO<span style={styles.logoAccent}>mind</span>
      </Link>

      <div style={styles.links}>
        <Link to="/" style={styles.link}>
          Accueil
        </Link>

        {!token ? (
          <>
            <Link to="/Login" style={styles.link}>
              Connexion
            </Link>
            <Link to="/register" style={styles.link}>
              Inscription
            </Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" style={styles.link}>
              Dashboard
            </Link>
            <button style={styles.secondaryButton} onClick={handleLogout}>
              Déconnexion
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;