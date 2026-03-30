export const theme = {
 page: {
  minHeight: "100vh",
  background: "#f5f7fb",
  padding: "100px 30px 30px", // ✅ espace pour navbar
  fontFamily: "Arial, sans-serif",
  color: "#1f2937",
},

  centerPage: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f7fb",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    borderRadius: "18px",
    padding: "30px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
  },

  dashboardCard: {
    background: "#ffffff",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
    marginBottom: "24px",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },

  title: {
    fontSize: "28px",
    fontWeight: "bold",
    marginBottom: "10px",
    textAlign: "center",
  },

  subtitle: {
    color: "#6b7280",
    marginBottom: "20px",
    textAlign: "center",
  },

  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    marginBottom: "14px",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
  },

  select: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    marginBottom: "14px",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
  },

  button: {
    width: "100%",
    background: "#111827",
    color: "#fff",
    border: "none",
    padding: "12px 14px",
    borderRadius: "10px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  secondaryButton: {
  background: "#e5e7eb",
  color: "#111827",
  border: "none",
  padding: "12px 18px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "bold",
  minWidth: "220px", // ✅ même largeur
  textAlign: "center",
},

  rowButtons: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "20px",
    justifyContent: "center",
  },

  linkText: {
    marginTop: "15px",
    textAlign: "center",
  },

  siteItem: {
    padding: "14px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    marginBottom: "12px",
    background: "#fafafa",
  },

  sectionTitle: {
    fontSize: "20px",
    fontWeight: "bold",
    marginBottom: "16px",
  },
};