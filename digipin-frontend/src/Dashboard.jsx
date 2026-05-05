function Dashboard({ user, onLogout }) {
  return (
    <div className="dashboard-page fade-in">
      <div style={{ textAlign: "center", marginBottom: "28px" }}>
        <div className="dashboard-avatar">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
        <h2 style={{ fontSize: "24px", margin: "0 0 4px" }}>{user?.name}</h2>
        <p className="muted" style={{ margin: 0 }}>{user?.phone} &bull; {user?.email}</p>
      </div>

      <div className="dashboard-digipin-card">
        <div className="dashboard-digipin-label">Your DigiPIN</div>
        <div className="dashboard-digipin-value">{user?.digipin}</div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-info-card">
          <div className="dashboard-info-label">Registered Address</div>
          <div className="dashboard-info-value">{user?.address}</div>
        </div>
        <div className="dashboard-info-card">
          <div className="dashboard-info-label">Coordinates</div>
          <div className="dashboard-info-value">
            <div>Lat: {user?.lat}</div>
            <div>Lon: {user?.lon}</div>
          </div>
        </div>
      </div>

      <button className="btn-ghost" onClick={onLogout}>
        Sign Out
      </button>
    </div>
  );
}

export default Dashboard;
