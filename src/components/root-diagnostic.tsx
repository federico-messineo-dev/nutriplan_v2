"use client";

import { useEffect, useState } from "react";

export function RootDiagnostic() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(1);
    const t = setTimeout(() => setStep(2), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: step >= 1 ? "#c84b31" : "#1a1a2e",
        color: "#fff",
        fontSize: 10,
        fontFamily: "monospace",
        padding: "4px 8px",
        textAlign: "center",
      }}
    >
      ROOT DIAG: {step === 0 ? "RENDERED (no effect)" : step === 1 ? "USE_EFFECT FIRED" : "USE_EFFECT + 2s TIMER"}
    </div>
  );
}
