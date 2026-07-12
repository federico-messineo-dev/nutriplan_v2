"use client";

import { useEffect } from "react";

/**
 * Kill-switch per il vecchio service worker della PWA precedente.
 * 1. Registra il kill-switch SW in public/sw.js (forza sostituzione immediata)
 * 2. Sdoganatura di tutti i registrations attuali
 * 3. Nuke della Cache API
 */
export function LegacySWCleanup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const run = async () => {
      // 1. Forza registrazione del kill-switch (sostituisce subito il vecchio SW)
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        // Se c'è un worker in attesa di attivazione (waiting), forzalo subito
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" });
        }
      } catch {
        // Fallback: se la registrazione fallisce, prova almeno a deregistrare
      }

      // 2. Sdoganatura di tutti i registration attuali
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          reg.unregister();
        }
      } catch {
        // ignore
      }

      // 3. Nuke della Cache API
      if ("caches" in window) {
        try {
          const keys = await caches.keys();
          for (const key of keys) {
            caches.delete(key);
          }
        } catch {
          // ignore
        }
      }
    };

    run();
  }, []);

  return null;
}
