import { useState, useEffect } from "react";
import { API_BASE } from "./api";

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <span className="toast-icon">{type === "error" ? "!" : "✓"}</span>
      <span className="toast-message">{message}</span>
      <button className="toast-close" onClick={onClose} type="button">×</button>
    </div>
  );
}

function LoginPage({ onLogin, onBack }) {
  const [identifier, setIdentifier] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [attemptsLeft, setAttemptsLeft] = useState(null);

  const addToast = (message, type = "error") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!identifier.trim()) return addToast("Enter phone or email");
    if (!/^[0-9]{5}$/.test(pin)) return addToast("Enter a valid 5-digit PIN");

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errMsg = data.error || "Login failed";
        const match = errMsg.match(/Attempts left[:\s]+(\d+)/i);
        if (match) {
          const left = parseInt(match[1], 10);
          setAttemptsLeft(left);
          addToast(`Wrong PIN — ${left} attempt${left !== 1 ? "s" : ""} remaining before lockout`, "error");
        } else {
          setAttemptsLeft(null);
          addToast(errMsg, "error");
        }
        return;
      }

      setAttemptsLeft(null);
      addToast("Login successful!", "success");
      setTimeout(() => onLogin(data.user), 700);
    } catch {
      addToast("Unable to reach server. Check your connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page fade-in">
      <div className="toast-container">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
        ))}
      </div>

      <div className="login-brand">
        <div className="brand-logo">D</div>
        <h1 className="brand-title">DigiPIN</h1>
        <p className="brand-sub">Precision Location Identity</p>
      </div>

      <div className="glass-card login-card">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p className="muted">Sign in to access your DigiPIN dashboard</p>
        </div>

        <form onSubmit={handleLogin} noValidate>
          <div className="input-group">
            <label>Phone or Email</label>
            <input
              type="text"
              placeholder="9876543210 or user@email.com"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>5-Digit PIN</label>
            <input
              type="password"
              placeholder="•••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              maxLength="5"
              disabled={loading}
              className="pin-input"
            />
          </div>

          {attemptsLeft !== null && (
            <div className="attempts-banner">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>
                <strong>{attemptsLeft}</strong> attempt{attemptsLeft !== 1 ? "s" : ""} remaining before your account is locked
              </span>
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="btn-loading"><span className="spinner" />Signing in...</span> : "Sign In"}
          </button>

          <button type="button" className="btn-ghost" onClick={onBack} disabled={loading}>
            Create new account
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
