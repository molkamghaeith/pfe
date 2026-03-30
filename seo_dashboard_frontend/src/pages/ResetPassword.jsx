import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { theme } from "../styles/theme";

function ResetPassword() {
  const { uid, token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/auth/reset-password-confirm/", {
        uid,
        token,
        password,
      });
      alert("Mot de passe réinitialisé");
      navigate("/");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Erreur");
    }
  };

  return (
    <div style={theme.centerPage}>
      <div style={theme.card}>
        <h2 style={theme.title}>Nouveau mot de passe</h2>
        <p style={theme.subtitle}>Choisis un nouveau mot de passe sécurisé.</p>

        <form onSubmit={handleSubmit}>
          <input
            style={theme.input}
            type="password"
            placeholder="Nouveau mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button style={theme.button} type="submit">
            Valider
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;