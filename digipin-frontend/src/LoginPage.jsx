import { useState } from "react";
import { API_BASE } from "./api";

function LoginPage({ onLogin, onBack }) {
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!identifier.trim()) return setMessage("Enter phone or email");
    if (!/^[0-9]{5}$/.test(pin)) return setMessage("Enter valid 5-digit PIN");

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          pin,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // Pass user data to App
      onLogin(data.user);

    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card fade-in" style={{ maxWidth: "420px" }}>
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <h2 style={{ color: "var(--primary)", fontSize: "28px" }}>Welcome Back</h2>
        <p className="muted">Enter your details to access your DigiPIN</p>
      </div>

      <form onSubmit={handleLogin}>
        <div className="input-group">
          <label>Phone or Email</label>
          <input
            type="text"
            placeholder="e.g. 9876543210 or user@email.com"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="input-group" style={{ marginBottom: "24px" }}>
          <label>5-Digit PIN</label>
          <input
            type="password"
            placeholder="•••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            maxLength="5"
            disabled={loading}
            className="otp-input"
            style={{ letterSpacing: "12px", padding: "14px", fontSize: "20px" }}
          />
        </div>

        {message && <div className="error-text" style={{ marginBottom: "16px" }}>{message}</div>}

        <button type="submit" className="primary-btn" disabled={loading}>
          {loading ? "Logging in..." : "Login to Dashboard"}
        </button>

        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          style={{ 
            marginTop: "16px", 
            background: "transparent", 
            color: "#64748b",
            border: "1px solid #cbd5e1"
          }}
        >
          Back to Signup
        </button>
      </form>
    </div>
  );
}

export default LoginPage;