import { useState } from "react";

const API_BASE = "http://localhost:5000";

function OtpPage({ phone, setTempUserId, onVerified }) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const verifyOtp = async () => {
    setError("");

    if (!phone) {
      setError("Phone number missing. Go back and enter phone again.");
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
    } catch (err) {
      setError("Backend is not running or CORS is blocking the request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <h2>Enter OTP</h2>
      <p className="muted">We sent a 6-digit OTP to <b>{phone}</b>.</p>

      <div className="input-group">
        <label>OTP</label>
        <input
          type="text"
          maxLength="6"
          placeholder="000000"
          className="otp-input"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        />
      </div>

      <button onClick={verifyOtp} disabled={loading} className="success-btn">
        {loading ? "Verifying..." : "Verify & Continue"}
      </button>

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

export default OtpPage;
