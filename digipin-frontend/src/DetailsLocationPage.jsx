import { useState } from "react";
import { API_BASE } from "./api";

function simpleHash(pin) {
  if (!pin || pin.length < 5) return "";
  const salt = "$2a$10$";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789./";
  let hash = "";
  let seed = 0;
  for (let i = 0; i < pin.length; i++) seed = (seed * 31 + pin.charCodeAt(i)) & 0xffffffff;
  for (let i = 0; i < 31; i++) {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    hash += chars[(seed >>> 0) % chars.length];
  }
  return salt + hash;
}

function DetailsLocationPage({ tempUserId, onNext }) {
  const [name, setName] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [doorNumber, setDoorNumber] = useState("");
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinGenerated, setPinGenerated] = useState(false);

  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [digipin, setDigipin] = useState("");

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const hashedPin = pin.length === 5 && confirmPin === pin ? simpleHash(pin) : "";

  const callApi = async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || "Request failed");
    return data;
  };

  const startCooldown = (seconds = 30) => {
    setEmailCooldown(seconds);
    const timer = setInterval(() => {
      setEmailCooldown((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const sendEmailOtp = async () => {
    setMessage("");
    if (!tempUserId) return setMessage("Session missing. Verify phone OTP again.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMessage("Enter a valid email");
    setSendingOtp(true);
    try {
      await callApi("/api/auth/send-email-otp", { tempUserId, email: email.trim() });
      setMessage("Email OTP sent successfully");
      startCooldown(30);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyEmailOtp = async () => {
    setMessage("");
    if (!emailOtp.trim()) return setMessage("Enter email OTP");
    setVerifyingOtp(true);
    try {
      await callApi("/api/auth/verify-email-otp", { tempUserId, otp: emailOtp.trim() });
      setEmailVerified(true);
      setMessage("Email verified successfully");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const getOneLocation = () =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        reject,
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );
    });

  const getReadableAddress = async (latitude, longitude) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      const data = await res.json();
      return data.display_name || `Lat: ${latitude}, Lon: ${longitude}`;
    } catch {
      return `Lat: ${latitude}, Lon: ${longitude}`;
    }
  };

  const detectLocation = async () => {
    setMessage("");
    setDigipin("");
    if (!navigator.geolocation) return setMessage("Geolocation not supported by this browser");
    if (!tempUserId) return setMessage("Session missing. Verify phone OTP again.");
    setDetecting(true);
    try {
      const samples = [];
      for (let i = 0; i < 10; i++) {
        const point = await getOneLocation();
        samples.push(point);
        await new Promise((r) => setTimeout(r, 700));
      }
      const data = await callApi("/api/location/resolve", { tempUserId, samples });
      const readableAddress = await getReadableAddress(data.lat, data.lon);
      setLat(data.lat);
      setLon(data.lon);
      setDigipin(data.digipin);
      setAddress(readableAddress);
      setMessage("Location detected successfully");
    } catch (err) {
      setMessage(err.message || "Location detection failed");
    } finally {
      setDetecting(false);
    }
  };

  const handleGeneratePin = () => {
    setMessage("");
    if (!name.trim()) return setMessage("Enter your name first");
    if (!/^[0-9]{12}$/.test(aadhaar)) return setMessage("Aadhaar must be exactly 12 digits");
    if (!emailVerified) return setMessage("Verify your email first");
    if (!address.trim() || !lat || !lon || !digipin) return setMessage("Detect location first");
    if (!doorNumber.trim()) return setMessage("Enter your door number");
    if (!/^[0-9]{5}$/.test(pin)) return setMessage("PIN must be exactly 5 digits");
    if (pin !== confirmPin) return setMessage("PINs do not match");
    setPinGenerated(true);
    setMessage("");
  };

  const handleSubmit = async () => {
    setMessage("");
    if (!pinGenerated) return setMessage("Generate and confirm PIN first");
    setLoading(true);
    try {
      await callApi("/api/user/details", {
        tempUserId,
        name: name.trim(),
        aadhaar: aadhaar.trim(),
        address: address.trim(),
      });
      const account = await callApi("/api/user/create-account", { tempUserId, pin });
      setMessage(`Account created! DigiPIN: ${account.digipin}`);
      setTimeout(() => onNext?.(), 1000);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="details-page fade-in">
      <div className="details-header">
        <h2>Create Your Account</h2>
        <p className="muted">Complete all steps to generate your DigiPIN</p>
      </div>

      <div className="form-section">
        <div className="section-label">Personal Information</div>

        <div className="input-group">
          <label>Full Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" />
        </div>

        <div className="input-group">
          <label>Aadhaar Number</label>
          <input
            value={aadhaar}
            onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ""))}
            maxLength="12"
            placeholder="12-digit Aadhaar number"
          />
        </div>

        <div className="input-group">
          <label>Door Number</label>
          <input
            value={doorNumber}
            onChange={(e) => setDoorNumber(e.target.value)}
            placeholder="e.g. 4B, Flat 302, House No. 17"
          />
        </div>
      </div>

      <div className="form-section">
        <div className="section-label">Email Verification</div>

        <div className="input-group">
          <label>Email Address</label>
          <input
            value={email}
            onChange={(e) => { setEmail(e.target.value); setEmailVerified(false); }}
            placeholder="your@email.com"
            type="email"
          />
        </div>

        <button
          className={emailVerified ? "btn-success" : "btn-secondary"}
          onClick={sendEmailOtp}
          disabled={sendingOtp || emailVerified || emailCooldown > 0}
        >
          {emailVerified ? "Email Verified" : sendingOtp ? "Sending..." : emailCooldown > 0 ? `Resend in ${emailCooldown}s` : "Send Email OTP"}
        </button>

        {!emailVerified && (
          <>
            <div className="input-group" style={{ marginTop: "12px" }}>
              <label>Email OTP</label>
              <input
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))}
                maxLength="6"
                placeholder="6-digit OTP"
                className="otp-input"
              />
            </div>
            <button className="btn-outline" onClick={verifyEmailOtp} disabled={verifyingOtp}>
              {verifyingOtp ? "Verifying..." : "Verify Email OTP"}
            </button>
          </>
        )}
      </div>

      <div className="form-section">
        <div className="section-label">Location Detection</div>

        <div className="input-group">
          <label>Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Click 'Detect Location' to auto-fill"
          />
        </div>

        <button className="btn-detect" onClick={detectLocation} disabled={detecting}>
          {detecting ? (
            <span className="btn-loading"><span className="spinner" />Detecting Location...</span>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "8px" }}>
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
                <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
                <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
              </svg>
              Detect My Location
            </>
          )}
        </button>

        {digipin && (
          <div className="location-result">
            <div className="location-result-row">
              <span className="location-result-label">Latitude</span>
              <span className="location-result-value">{Number(lat).toFixed(6)}</span>
            </div>
            <div className="location-result-row">
              <span className="location-result-label">Longitude</span>
              <span className="location-result-value">{Number(lon).toFixed(6)}</span>
            </div>
            <div className="location-result-digipin">
              <span className="location-result-label">DigiPIN</span>
              <span className="digipin-value">{digipin}</span>
            </div>
          </div>
        )}
      </div>

      <div className="form-section">
        <div className="section-label">Set Login PIN</div>

        <div className="input-group">
          <label>5-digit Login PIN</label>
          <input
            type="password"
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setPinGenerated(false); }}
            maxLength="5"
            placeholder="Choose a 5-digit PIN"
            className="pin-input"
          />
        </div>

        <div className="input-group">
          <label>Confirm PIN</label>
          <input
            type="password"
            value={confirmPin}
            onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, "")); setPinGenerated(false); }}
            maxLength="5"
            placeholder="Re-enter your PIN"
            className="pin-input"
          />
        </div>

        {!pinGenerated && (
          <button
            className="btn-secondary"
            onClick={handleGeneratePin}
            disabled={pin.length !== 5 || confirmPin.length !== 5}
          >
            Generate Hashed PIN
          </button>
        )}

        {pinGenerated && hashedPin && (
          <div className="pin-hash-card">
            <div className="pin-hash-row">
              <span className="pin-hash-label">Generated PIN</span>
              <span className="pin-hash-val pin-dots">{"•".repeat(pin.length)}</span>
            </div>
            <div className="pin-hash-row">
              <span className="pin-hash-label">Hashed PIN</span>
              <span className="pin-hash-val pin-hash-mono">{hashedPin} - {doorNumber}</span>
            </div>
            <div className="pin-hash-note">
              Your PIN is securely hashed and combined with your door number for storage.
            </div>
          </div>
        )}
      </div>

      {message && (
        <div className={message.toLowerCase().includes("success") || message.toLowerCase().includes("created") ? "msg-success" : "msg-error"}>
          {message}
        </div>
      )}

      <button
        className="btn-primary"
        onClick={handleSubmit}
        disabled={loading || detecting || sendingOtp || verifyingOtp || !pinGenerated}
        style={{ marginTop: "8px" }}
      >
        {loading ? <span className="btn-loading"><span className="spinner" />Creating Account...</span> : "Create Account"}
      </button>
    </div>
  );
}

export default DetailsLocationPage;
