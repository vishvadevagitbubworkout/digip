import { useState } from "react";
import { API_BASE } from "./api";

function OtpPage({ phone, setTempUserId, onVerified }) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const verifyOtp = async () => {
    setError("");
    if (!phone) {
      setError("Phone number missing. Go back and re-enter.");
      return;
    }
    if (!/^[0-9]{6}$/.test(otp)) {
      setError("Enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || data.message || "Invalid OTP");
        return;
      }
      setTempUserId(data.tempUserId || data.userId || "");
      onVerified();
    } catch {
      setError("Backend is not running or CORS is blocking the request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <h2>Enter OTP</h2>
      <p className="muted">
        We sent a 6-digit code to <strong>{phone}</strong>. It expires in 5 minutes.
      </p>

      <div className="input-group">
        <label>One-Time Password</label>
        <input
          type="text"
          maxLength="6"
          placeholder="000000"
          className="otp-input"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        />
      </div>

      <button className="btn-success" onClick={verifyOtp} disabled={loading}>
        {loading
          ? <span className="btn-loading"><span className="spinner" />Verifying...</span>
          : "Verify & Continue"}
      </button>

      {error && <p className="msg-error">{error}</p>}
    </div>
  );
}

export default OtpPage;
