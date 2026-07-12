"use client";

import { useEffect } from "react";

export function LegacySWCleanup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const run = async () => {
      // Unregister any active service worker (including our no-op one)
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) {
          await reg.unregister();
        }
      } catch {
        // ignore
      }

      // Clear all caches
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
