"use client";

import { MotionConfig } from "framer-motion";
import { useReducedMotion } from "framer-motion";

/**
 * Wraps the app in Framer Motion's MotionConfig with reduced-motion support.
 * All motion components inside will automatically collapse to instant transitions
 * when the user has prefers-reduced-motion enabled.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  );
}

/**
 * Hook re-export for convenience — components can use this to conditionally
 * skip heavy animations (e.g. particle effects, complex sequences).
 */
export { useReducedMotion };
