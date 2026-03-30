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

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/auth/register/", form);
      alert("Inscription réussie");
      navigate("/");
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'inscription");
    }
  };

  return (
    <div style={theme.centerPage}>
      <div style={theme.card}>
        <h2 style={theme.title}>Inscription</h2>
        <p style={theme.subtitle}>Crée ton compte pour accéder au dashboard.</p>

        <form onSubmit={handleSubmit}>
          <input
            style={theme.input}
            type="text"
            name="username"
            placeholder="Nom d'utilisateur"
            value={form.username}
            onChange={handleChange}
          />

          <input
            style={theme.input}
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />

          <input
            style={theme.input}
            type="password"
            name="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={handleChange}
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