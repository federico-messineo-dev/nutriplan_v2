"use client";

import { useEffect, useLayoutEffect, useState } from "react";

let timeoutFired = false;

export function RootDiagnostic() {
  const [step, setStep] = useState(0);
  const [layoutStep, setLayoutStep] = useState(0);

  // Fire setTimeout directly during render (outside React lifecycle)
  // to test if macrotasks work on this mobile browser
  if (typeof window !== "undefined" && !timeoutFired) {
    timeoutFired = true;
    setTimeout(() => {
      const el = document.getElementById("rd-bar");
      if (el) el.style.outline = "4px solid lime";
    }, 1500);
  }

  useEffect(() => {
    setStep(1);
    const t = setTimeout(() => setStep(2), 2000);
    return () => clearTimeout(t);
  }, []);

  useLayoutEffect(() => {
    setLayoutStep(1);
  }, []);

  const bg =
    layoutStep >= 1 ? "#2e7d32" : step >= 1 ? "#c84b31" : "#1a1a2e";
  const text =
    layoutStep >= 1
      ? `ROOT DIAG: USE_LAYOUT_EFFECT OK (useEffect=${step})`
      : step >= 1
        ? "ROOT DIAG: USE_EFFECT OK"
        : "ROOT DIAG: RENDERED (no effect)";

  return (
    <div
      id="rd-bar"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        background: bg,
        color: "#fff",
        fontSize: 10,
        fontFamily: "monospace",
        padding: "4px 8px",
        textAlign: "center",
        transition: "background 0.3s",
      }}
    >
      {text}
    </div>
  );
}
