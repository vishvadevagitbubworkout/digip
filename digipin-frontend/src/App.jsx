import { useState } from "react";
import PhonePage from "./PhonePage";
import OtpPage from "./OtpPage";
import DetailsLocationPage from "./DetailsLocationPage";
import LoginPage from "./LoginPage";
import Dashboard from "./Dashboard";

function App() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [tempUserId, setTempUserId] = useState("");
  const [user, setUser] = useState(null);

  const steps = ["Phone", "Verify", "Details", "Done"];

  if (user) {
    return <Dashboard user={user} onLogout={() => setUser(null)} />;
  }

  if (step === "login") {
    return <LoginPage onLogin={setUser} onBack={() => setStep(1)} />;
  }

  return (
    <div className="glass-card fade-in">
      <div className="progress-bar">
        {steps.map((label, index) => {
          const active = step > index;
          return (
            <div key={label} className="progress-item">
              <div className={active ? "progress-dot active" : "progress-dot"}>
                {active ? "✓" : index + 1}
              </div>
              <span className={active ? "progress-label active" : "progress-label"}>
                {label}
              </span>
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <>
          <PhonePage setPhone={setPhone} onNext={() => setStep(2)} />
          <button type="button" className="secondary-btn" onClick={() => setStep("login")}>
            Already have an account? Sign In
          </button>
        </>
      )}

      {step === 2 && (
        <OtpPage phone={phone} setTempUserId={setTempUserId} onVerified={() => setStep(3)} />
      )}

      {step === 3 && (
        <DetailsLocationPage phone={phone} tempUserId={tempUserId} onNext={() => setStep(4)} />
      )}

      {step === 4 && (
        <div className="success-screen">
          <div className="success-icon">&#10003;</div>
          <h2 style={{ color: "var(--success)", marginBottom: "10px" }}>Account Created!</h2>
          <p className="muted" style={{ marginBottom: "24px" }}>
            Your DigiPIN has been generated and saved securely.
          </p>
          <button type="button" className="btn-primary" onClick={() => setStep("login")}>
            Go to Sign In
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
