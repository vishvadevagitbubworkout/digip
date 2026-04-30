import { useState } from "react";

const API_BASE = "http://localhost:5000";

function PhonePage({ setPhone, onNext }) {
  const [countryCode, setCountryCode] = useState("+91");
  const [localPhone, setLocalPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendOtp = async () => {
    setError("");

    if (!/^[0-9]{10}$/.test(localPhone)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }

    const fullPhone = `${countryCode}${localPhone}`;
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: fullPhone }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || data.message || "Failed to send OTP");
        return;
      }

      setPhone(fullPhone);
      onNext();
    } catch (err) {
      setError("Backend is not running or CORS is blocking the request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <h2>Verify Phone</h2>
      <p className="muted">Secure your account using mobile OTP verification.</p>

      <div className="input-group">
        <label>Mobile Number</label>
        <div className="phone-row">
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="country-select"
          >
            <option value="+91">🇮🇳 +91</option>
          </select>

          <input
            type="text"
            placeholder="9876543210"
            value={localPhone}
            maxLength="10"
            onChange={(e) => setLocalPhone(e.target.value.replace(/\D/g, ""))}
          />
        </div>
      </div>

      <button onClick={sendOtp} disabled={loading} className="primary-btn">
        {loading ? "Sending..." : "Send OTP"}
      </button>

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

export default PhonePage;
