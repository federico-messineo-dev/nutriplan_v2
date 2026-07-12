"use client";

import { useState, useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [bad, setBad] = useState(false);

  // Diagnostic: force-set the state after 2s on ANY device
  useEffect(() => {
    const t = setTimeout(() => setBad(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative h-full overflow-hidden">
      {/* diagnostic banner */}
      {bad && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-500 text-white text-center text-xs py-1 font-mono">
          LAYOUT DIAGNOSTIC: useEffect IS FIRING
        </div>
      )}
      <div className="relative z-10 h-full min-h-0">{children}</div>
    </div>
  );
}
