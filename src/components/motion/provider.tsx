"use client";

import { MotionConfig } from "framer-motion";
import { useReducedMotion } from "framer-motion";

/**
 * Wraps the app in Framer Motion's MotionConfig.
 * IMPORTANT: reducedMotion="never" ensures elements with initial={{ opacity: 0 }}
 * always transition to animate={{ opacity: 1 }}. Setting it to "user" causes
 * invisible elements on mobile browsers that report prefers-reduced-motion: reduce.
 *
 * Individual components still respect prefers-reduced-motion via the
 * useReducedMotion() hook for non-essential flourishes (particles, etc.).
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="never">
      {children}
    </MotionConfig>
  );
}

/**
 * Hook re-export for convenience — components can use this to conditionally
 * skip heavy animations (e.g. particle effects, complex sequences).
 */
export { useReducedMotion };
