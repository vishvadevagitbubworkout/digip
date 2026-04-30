import { useState } from "react";
import PhonePage from "./PhonePage";
import OtpPage from "./OtpPage";
import DetailsLocationPage from "./DetailsLocationPage";

function App() {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [tempUserId, setTempUserId] = useState("");

  const steps = ["Phone", "Verify", "Details", "Done"];

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
        <PhonePage
          setPhone={setPhone}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <OtpPage
          phone={phone}
          setTempUserId={setTempUserId}
          onVerified={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <DetailsLocationPage
          phone={phone}
          tempUserId={tempUserId}
          onNext={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <div className="success-screen">
          <div className="success-icon">✅</div>
          <h2>Setup Complete</h2>
          <p>Your DigiPIN has been generated and saved successfully.</p>
        </div>
      )}
    </div>
  );
}

export default App;
