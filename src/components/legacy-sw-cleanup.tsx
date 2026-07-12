"use client";

import { useEffect } from "react";

/**
 * One-shot cleanup for any leftover service workers from the old PWA.
 * Registers a kill-switch SW at root that immediately self-unregisters,
 * then clears the Cache API so old assets don't linger.
 */
export function LegacySWCleanup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // 1. Unregister every SW this scope owns
    navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const reg of regs) {
        reg.unregister();
      }
    });

    // 2. Nuke the Cache API
    if ("caches" in window) {
      caches.keys().then((keys) => {
        for (const key of keys) {
          caches.delete(key);
        }
      });
    }
  }, []);

  return null;
}
