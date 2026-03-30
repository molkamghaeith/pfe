import { useState } from "react";
import api from "../services/api";
import { theme } from "../styles/theme";

function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/forgot-password/", { email });
      alert(res.data.message);
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "Erreur");
    }
  };

  return (
    <div style={theme.centerPage}>
      <div style={theme.card}>
        <h2 style={theme.title}>Mot de passe oublié</h2>
        <p style={theme.subtitle}>
          Entre ton email pour recevoir un lien de réinitialisation.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            style={theme.input}
            type="email"
            placeholder="Votre email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button style={theme.button} type="submit">
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;