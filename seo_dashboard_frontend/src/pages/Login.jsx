import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import loginImg from "../assets/login.png";

function Login() {
  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showActivationInfo, setShowActivationInfo] = useState(false); // ✅ AJOUTÉ

  const googleBtnRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!window.google || !googleBtnRef.current) return;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    });

    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: "outline",
      size: "large",
      width: 320,
      text: "continue_with",
      shape: "rectangular",
    });
  }, []);

  const handleGoogleResponse = async (response) => {
    setIsLoading(true);
    try {
      const res = await api.post("/auth/google/", {
        credential: response.credential,
      });

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      
      const errorMsg = error.response?.data?.error || 
                       error.response?.data?.detail ||
                       "Erreur Google login";
      
      if (errorMsg.includes("attente d'activation")) {
        setErrorMessage("⏳ Votre compte Google est en attente d'activation par l'administrateur.");
        setShowActivationInfo(true);
      } else {
        setErrorMessage(errorMsg);
        setShowActivationInfo(false);
      }
    }
    setIsLoading(false);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrorMessage("");
    setShowActivationInfo(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setShowActivationInfo(false);

    try {
      const response = await api.post("/auth/login/", form);

      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);

      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      
      const errorMsg = error.response?.data?.detail ||
                       error.response?.data?.error ||
                       "Erreur de connexion";
      
      if (errorMsg.includes("attente d'activation")) {
        setErrorMessage("⏳ Votre compte est en attente d'activation par l'administrateur.");
        setShowActivationInfo(true);
      } else if (errorMsg.includes("No active account") || errorMsg.includes("identifiants")) {
        setErrorMessage("❌ Nom d'utilisateur ou mot de passe incorrect.");
        setShowActivationInfo(false);
      } else {
        setErrorMessage(errorMsg);
        setShowActivationInfo(false);
      }
    }
    setIsLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>
        <div style={styles.right}>
          <img src={loginImg} alt="SEOmind login visual" style={styles.image} />
        </div>
        <div style={styles.left}>
          <div style={styles.formBox}>
            <h2 style={styles.title}>Connexion</h2>
            <p style={styles.subtitle}>Accède à ton dashboard SEOmind.</p>

            {/* ✅ Message d'information pour compte en attente d'activation */}
            {showActivationInfo && (
              <div style={{
                background: "#f3f4f6",
                color: "#374151",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "13px",
                textAlign: "center",
                border: "1px solid #e5e7eb"
              }}>
                📧 <strong>Compte en attente d'activation</strong><br />
                Vous recevrez un email dès que l'administrateur aura activé votre compte.
              </div>
            )}

            {/* ✅ Affichage des erreurs */}
            {errorMessage && !showActivationInfo && (
              <div style={{
                background: errorMessage.includes("attente d'activation") ? "#fef3c7" : "#fee2e2",
                color: errorMessage.includes("attente d'activation") ? "#92400e" : "#dc2626",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "14px",
                textAlign: "center"
              }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <input
                style={styles.input}
                type="text"
                name="username"
                placeholder="Nom d'utilisateur"
                value={form.username}
                onChange={handleChange}
                disabled={isLoading}
                required
              />

              <input
                style={styles.input}
                type="password"
                name="password"
                placeholder="Mot de passe"
                value={form.password}
                onChange={handleChange}
                disabled={isLoading}
                required
              />

              <button style={styles.button} type="submit" disabled={isLoading}>
                {isLoading ? "Connexion en cours..." : "Se connecter"}
              </button>
            </form>

            <div style={styles.separator}>Ou</div>

            <div
              ref={googleBtnRef}
              style={{ display: "flex", justifyContent: "center" }}
            />

            <p style={styles.linkText}>
              <Link to="/forgot-password">Mot de passe oublié ?</Link>
            </p>

            <p style={styles.linkText}>
              Pas de compte ? <Link to="/register">S'inscrire</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f7fb",
    padding: "110px 30px 30px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxSizing: "border-box",
  },
  wrapper: {
    width: "100%",
    maxWidth: "1200px",
    minHeight: "650px",
    background: "#ffffff",
    borderRadius: "24px",
    overflow: "hidden",
    boxShadow: "0 15px 40px rgba(0,0,0,0.10)",
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
  },
  left: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
  },
  formBox: {
    width: "100%",
    maxWidth: "380px",
  },
  right: {
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "30px",
  },
  image: {
    width: "100%",
    maxWidth: "500px",
    objectFit: "contain",
  },
  title: {
    fontSize: "32px",
    fontWeight: "bold",
    marginBottom: "10px",
    color: "#111827",
    textAlign: "center",
  },
  subtitle: {
    color: "#6b7280",
    marginBottom: "24px",
    textAlign: "center",
    fontSize: "16px",
  },
  input: {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    marginBottom: "14px",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    background: "#0f172a",
    color: "#fff",
    border: "none",
    padding: "14px 16px",
    borderRadius: "12px",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "15px",
  },
  separator: {
    margin: "22px 0",
    textAlign: "center",
    color: "#6b7280",
    fontSize: "16px",
  },
  linkText: {
    marginTop: "16px",
    textAlign: "center",
  },
};