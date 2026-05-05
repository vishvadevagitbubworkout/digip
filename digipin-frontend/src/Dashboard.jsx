function Dashboard({ user, onLogout }) {
  return (
    <div className="glass-card fade-in" style={{ maxWidth: "600px", padding: "40px" }}>
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <div style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "var(--primary)",
          color: "white",
          fontSize: "32px",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px"
        }}>
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <h2 style={{ fontSize: "28px", margin: "0" }}>{user?.name}</h2>
        <p className="muted" style={{ margin: "4px 0 0 0" }}>{user?.phone} • {user?.email}</p>
      </div>

      <div className="location-box" style={{ textAlign: "center", border: "2px solid var(--primary)", background: "rgba(37, 99, 235, 0.05)" }}>
        <p style={{ margin: "0 0 8px", fontWeight: "bold", color: "var(--primary)" }}>Your DigiPIN</p>
        <div style={{ fontSize: "36px", letterSpacing: "4px", fontWeight: "900", color: "#1e293b" }}>
          {user?.digipin}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "30px" }}>
        <div className="location-box" style={{ margin: "0" }}>
          <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 4px", fontWeight: "bold", textTransform: "uppercase" }}>Registered Address</p>
          <p style={{ margin: "0", fontSize: "14px", fontWeight: "500", lineHeight: "1.5" }}>{user?.address}</p>
        </div>
        <div className="location-box" style={{ margin: "0" }}>
          <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 4px", fontWeight: "bold", textTransform: "uppercase" }}>Coordinates</p>
          <p style={{ margin: "0", fontSize: "14px", fontWeight: "500" }}>Lat: {user?.lat}</p>
          <p style={{ margin: "0", fontSize: "14px", fontWeight: "500" }}>Lon: {user?.lon}</p>
        </div>
      </div>

      <button onClick={onLogout} style={{ 
        background: "#f1f5f9", 
        color: "#475569", 
        border: "1px solid #cbd5e1" 
      }}>
        Logout
      </button>
    </div>
  );
}

export default Dashboard;