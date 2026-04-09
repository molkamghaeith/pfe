import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    is_active: true,
  });
  const [formError, setFormError] = useState("");
  
  const navigate = useNavigate();
  const token = localStorage.getItem("access");

  useEffect(() => {
    checkAdminRole();
    fetchUsers();
  }, []);

  const checkAdminRole = async () => {
    try {
      const res = await api.get("/auth/me/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.data.role !== "super_admin") {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error(error);
      navigate("/");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/auth/admin/users/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.post(
        `/auth/admin/users/${userId}/toggle-status/`,
        { is_active: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (error) {
      console.error(error);
      alert("Erreur lors du changement de statut");
    }
  };

  const deleteUser = async (userId, username) => {
    if (window.confirm(`Supprimer définitivement l'utilisateur "${username}" ?`)) {
      try {
        await api.delete(`/auth/admin/users/${userId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchUsers();
      } catch (error) {
        console.error(error);
        alert("Erreur lors de la suppression");
      }
    }
  };

  const createUser = async (e) => {
    e.preventDefault();
    setFormError("");
    
    if (!newUser.username || !newUser.email || !newUser.password) {
      setFormError("Tous les champs sont requis");
      return;
    }
    
    try {
      await api.post("/auth/admin/users/create/", newUser, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowAddModal(false);
      setNewUser({ username: "", email: "", password: "", is_active: true });
      fetchUsers();
    } catch (error) {
      console.error(error);
      setFormError(error.response?.data?.error || "Erreur lors de la création");
    }
  };

  const styles = {
    container: {
      minHeight: "100vh",
      background: "#f5f7fb",
      padding: "100px 30px 30px",
      fontFamily: "Arial, sans-serif",
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "30px",
    },
    title: {
      fontSize: "28px",
      fontWeight: "bold",
      color: "#111827",
    },
    addButton: {
      background: "#6366f1",
      color: "#fff",
      border: "none",
      padding: "12px 20px",
      borderRadius: "10px",
      cursor: "pointer",
      fontWeight: "bold",
      fontSize: "14px",
    },
    tableContainer: {
      background: "#fff",
      borderRadius: "12px",
      overflow: "auto",
      boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      minWidth: "600px",
    },
    th: {
      background: "#f3f4f6",
      padding: "15px",
      textAlign: "left",
      fontWeight: "bold",
      borderBottom: "2px solid #e5e7eb",
    },
    td: {
      padding: "12px 15px",
      borderBottom: "1px solid #e5e7eb",
    },
    activeBadge: {
      background: "#d1fae5",
      color: "#065f46",
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "bold",
    },
    inactiveBadge: {
      background: "#fee2e2",
      color: "#991b1b",
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "bold",
    },
    roleBadge: {
      background: "#e0e7ff",
      color: "#4338ca",
      padding: "4px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "bold",
    },
    actionButton: {
      background: "#0f172a",
      color: "#fff",
      border: "none",
      padding: "6px 12px",
      borderRadius: "6px",
      cursor: "pointer",
      marginRight: "8px",
      fontSize: "12px",
    },
    deleteButton: {
      background: "#dc2626",
      color: "#fff",
      border: "none",
      padding: "6px 12px",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "12px",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
    },
    modal: {
      background: "#fff",
      borderRadius: "16px",
      padding: "30px",
      width: "450px",
      maxWidth: "90%",
    },
    modalTitle: {
      fontSize: "24px",
      fontWeight: "bold",
      marginBottom: "20px",
    },
    input: {
      width: "100%",
      padding: "12px",
      marginBottom: "15px",
      borderRadius: "8px",
      border: "1px solid #d1d5db",
      fontSize: "14px",
      boxSizing: "border-box",
    },
    checkbox: {
      marginRight: "10px",
    },
    modalButtons: {
      display: "flex",
      gap: "10px",
      justifyContent: "flex-end",
      marginTop: "20px",
    },
    saveButton: {
      background: "#6366f1",
      color: "#fff",
      border: "none",
      padding: "10px 20px",
      borderRadius: "8px",
      cursor: "pointer",
    },
    cancelButton: {
      background: "#e5e7eb",
      color: "#111827",
      border: "none",
      padding: "10px 20px",
      borderRadius: "8px",
      cursor: "pointer",
    },
    errorText: {
      color: "#dc2626",
      fontSize: "14px",
      marginBottom: "15px",
      textAlign: "center",
    },
  };

  if (loading) {
    return <div style={styles.container}>Chargement...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Administration SEOmind</h1>
        <button style={styles.addButton} onClick={() => setShowAddModal(true)}>
          + Ajouter un utilisateur
        </button>
      </div>

      {/* Tableau des utilisateurs */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Nom d'utilisateur</th>
              <th style={styles.th}>Adresse électronique</th>
              <th style={styles.th}>Rôle</th>
              <th style={styles.th}>Statut</th>
              <th style={styles.th}>Date d'inscription</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={styles.td}>
                  <strong>{user.username}</strong>
                </td>
                <td style={styles.td}>{user.email}</td>
                <td style={styles.td}>
                  <span style={user.is_superuser ? styles.roleBadge : {}}>
                    {user.is_superuser ? "Super Admin" : user.is_staff ? "Admin" : "Utilisateur"}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={user.is_active ? styles.activeBadge : styles.inactiveBadge}>
                    {user.is_active ? "Actif" : "Inactif"}
                  </span>
                </td>
                <td style={styles.td}>
                  {new Date(user.date_joined).toLocaleDateString("fr-FR")}
                </td>
                <td style={styles.td}>
                  <button
                    style={styles.actionButton}
                    onClick={() => toggleUserStatus(user.id, user.is_active)}
                  >
                    {user.is_active ? "🔒 Désactiver" : "✅ Activer"}
                  </button>
                  {!user.is_superuser && (
                    <button
                      style={styles.deleteButton}
                      onClick={() => deleteUser(user.id, user.username)}
                    >
                      🗑️ Supprimer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Ajouter utilisateur */}
      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 style={styles.modalTitle}>Ajouter un utilisateur</h2>
            
            {formError && <div style={styles.errorText}>{formError}</div>}
            
            <form onSubmit={createUser}>
              <input
                style={styles.input}
                type="text"
                placeholder="Nom d'utilisateur *"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
              />
              
              <input
                style={styles.input}
                type="email"
                placeholder="Email *"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              />
              
              <input
                style={styles.input}
                type="password"
                placeholder="Mot de passe *"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              />
              
              <label style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
                <input
                  type="checkbox"
                  checked={newUser.is_active}
                  onChange={(e) => setNewUser({ ...newUser, is_active: e.target.checked })}
                  style={styles.checkbox}
                />
                Activer le compte immédiatement
              </label>
              
              <div style={styles.modalButtons}>
                <button type="button" style={styles.cancelButton} onClick={() => setShowAddModal(false)}>
                  Annuler
                </button>
                <button type="submit" style={styles.saveButton}>
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;