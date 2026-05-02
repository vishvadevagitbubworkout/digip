import { useState } from "react";
import { API_BASE } from "./api";

function DetailsLocationPage({ tempUserId, onNext }) {
  const [name, setName] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailCooldown, setEmailCooldown] = useState(0);

  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [digipin, setDigipin] = useState("");

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const callApi = async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || data.message || "Request failed");
    }

    return data;
  };

  const sendEmailOtp = async () => {
    setMessage("");

    if (!tempUserId) return setMessage("Session missing. Verify phone OTP again.");

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return setMessage("Enter valid email");
    }

    setSendingOtp(true);

    try {
      await callApi("/api/auth/send-email-otp", {
        tempUserId,
        email: email.trim(),
      });

      setMessage("Email OTP sent successfully");
      startCooldown(30);
      
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSendingOtp(false);
    }
  };
const startCooldown = (seconds = 30) => {
  setEmailCooldown(seconds);

  const timer = setInterval(() => {
    setEmailCooldown((prev) => {
      if (prev <= 1) {
        clearInterval(timer);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
};
  const verifyEmailOtp = async () => {
    setMessage("");

    if (!emailOtp.trim()) return setMessage("Enter email OTP");

    setVerifyingOtp(true);

    try {
      await callApi("/api/auth/verify-email-otp", {
        tempUserId,
        otp: emailOtp.trim(),
      });

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
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          }),
        reject,
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 15000,
        }
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

    if (!navigator.geolocation) {
      return setMessage("Geolocation not supported by this browser");
    }

    if (!tempUserId) {
      return setMessage("Session missing. Verify phone OTP again.");
    }

    setDetecting(true);

    try {
      const samples = [];

      for (let i = 0; i < 10; i++) {
        const point = await getOneLocation();
        samples.push(point);
        await new Promise((resolve) => setTimeout(resolve, 700));
      }

      const data = await callApi("/api/location/resolve", {
        tempUserId,
        samples,
      });

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

  const handleSubmit = async () => {
    setMessage("");

    if (!name.trim()) return setMessage("Enter your name");

    if (!/^[0-9]{12}$/.test(aadhaar)) {
      return setMessage("Aadhaar must be exactly 12 digits");
    }

    if (!emailVerified) {
      return setMessage("Verify your email first");
    }

    if (!address.trim() || !lat || !lon || !digipin) {
      return setMessage("Detect location first");
    }

    if (!/^[0-9]{5}$/.test(pin)) {
      return setMessage("PIN must be exactly 5 digits");
    }

    if (pin !== confirmPin) {
      return setMessage("PINs do not match");
    }

    setLoading(true);

    try {
      await callApi("/api/user/details", {
        tempUserId,
        name: name.trim(),
        aadhaar: aadhaar.trim(),
        address: address.trim(),
      });

      const account = await callApi("/api/user/create-account", {
        tempUserId,
        pin,
      });

      setMessage(`Account created successfully. DigiPIN: ${account.digipin}`);

      setTimeout(() => {
        onNext?.();
      }, 1000);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card fade-in">
      <h2>User Details</h2>
      <p>Verify email, detect location, and create your DigiPIN account.</p>

      <div className="input-group">
        <label>Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
        />
      </div>

      <div className="input-group">
        <label>Aadhaar</label>
        <input
          value={aadhaar}
          onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ""))}
          maxLength="12"
          placeholder="Enter 12-digit Aadhaar"
        />
      </div>

      <div className="input-group">
        <label>Email</label>
        <input
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailVerified(false);
          }}
          placeholder="Enter email"
        />
      </div>

      <button
  onClick={sendEmailOtp}
  disabled={sendingOtp || emailVerified || emailCooldown > 0}
>
  {emailVerified
    ? "Email Verified"
    : sendingOtp
    ? "Sending..."
    : emailCooldown > 0
    ? `Resend in ${emailCooldown}s`
    : "Send Email OTP"}
</button>

      {!emailVerified && (
        <>
          <div className="input-group">
            <label>Email OTP</label>
            <input
              value={emailOtp}
              onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ""))}
              maxLength="6"
              placeholder="Enter email OTP"
            />
          </div>

          <button onClick={verifyEmailOtp} disabled={verifyingOtp}>
            {verifyingOtp ? "Verifying..." : "Verify Email"}
          </button>
        </>
      )}

      <div className="input-group">
        <label>Address</label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Detect location to fill address"
        />
      </div>

      <button onClick={detectLocation} disabled={detecting}>
        {detecting ? "Detecting Location..." : "Detect Location"}
      </button>

      {digipin && (
        <div className="result-box">
          <p><b>Latitude:</b> {lat}</p>
          <p><b>Longitude:</b> {lon}</p>
          <p><b>DigiPIN:</b> {digipin}</p>
        </div>
      )}

      <div className="input-group">
        <label>5-digit Login PIN</label>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          maxLength="5"
          placeholder="Enter 5-digit PIN"
        />
      </div>

      <div className="input-group">
        <label>Confirm PIN</label>
        <input
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
          maxLength="5"
          placeholder="Confirm PIN"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || detecting || sendingOtp || verifyingOtp}
      >
        {loading ? "Creating Account..." : "Create Account"}
      </button>

      {message && (
        <p
          className={
            message.toLowerCase().includes("success")
              ? "success-msg"
              : "error-msg"
          }
        >
          {message}
        </p>
      )}
    </div>
  );
}

export default DetailsLocationPage;