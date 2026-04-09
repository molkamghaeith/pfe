import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { theme } from "../styles/theme";

function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [isRegistered, setIsRegistered] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/auth/register/", form);
      
      if (response.data.message) {
        setIsRegistered(true);
      } else {
        alert("Inscription réussie");
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      
      if (error.response?.data?.error) {
        setErrorMessage(error.response.data.error);
      } else if (error.response?.data?.username) {
        setErrorMessage(`Nom d'utilisateur: ${error.response.data.username[0]}`);
      } else if (error.response?.data?.email) {
        setErrorMessage(`Email: ${error.response.data.email[0]}`);
      } else {
        setErrorMessage("Erreur lors de l'inscription. Vérifiez vos informations.");
      }
    }
  };

  // ✅ Écran d'attente d'activation (couleurs modifiées)
  if (isRegistered) {
    return (
      <div style={theme.centerPage}>
        <div style={theme.card}>
          <h2 style={{ ...theme.title, color: "#9333ea" }}>✅ Inscription en attente</h2> {/* 🔥 Mauve */}
          
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <p style={{ fontSize: "16px", marginBottom: "15px" }}>
              Votre compte a été créé avec succès.
            </p>
            <p style={{ 
              background: "#f3f4f6",  /* 🔥 Gris clair (remplace jaune) */
              padding: "12px", 
              borderRadius: "8px",
              color: "#374151",        /* 🔥 Gris foncé pour le texte */
              marginBottom: "20px"
            }}>
              ⏳ <strong>En attente d'activation par l'administrateur.</strong>
            </p>
            <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "25px" }}>
              Vous recevrez un email dès que votre compte sera activé.<br />
              Vous pourrez alors vous connecter.
            </p>
            <Link to="/" style={theme.button}>
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={theme.centerPage}>
      <div style={theme.card}>
        <h2 style={theme.title}>Inscription</h2>
        <p style={theme.subtitle}>Crée ton compte pour accéder au dashboard.</p>

        {errorMessage && (
          <div style={{
            background: "#fee2e2",
            color: "#dc2626",
            padding: "10px",
            borderRadius: "8px",
            marginBottom: "15px",
            fontSize: "14px",
            textAlign: "center"
          }}>
            ❌ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            style={theme.input}
            type="text"
            name="username"
            placeholder="Nom d'utilisateur"
            value={form.username}
            onChange={handleChange}
            required
          />

          <input
            style={theme.input}
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            style={theme.input}
            type="password"
            name="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={handleChange}
            required
          />

          <button style={theme.button} type="submit">
            S'inscrire
          </button>
        </form>

        <p style={theme.linkText}>
          Déjà un compte ? <Link to="/">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;