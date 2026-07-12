/**
 * lib/motion.ts
 * Framer Motion design tokens — Section 4.5
 * Import everywhere, never use ad hoc durations.
 */

export const duration = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
  deliberate: 0.6,
} as const;

/** iOS-like decelerate curve */
export const easeOutApple = [0.22, 1, 0.36, 1] as const;

/** Snappy spring for toasts, command palette, small elements */
export const springSnappy = {
  type: "spring" as const,
  stiffness: 400,
  damping: 32,
};

/** Soft spring for larger transitions, cards, panels */
export const springSoft = {
  type: "spring" as const,
  stiffness: 180,
  damping: 22,
};

/** Stagger children config */
export const staggerChildren = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04, // 40ms stagger per Section 4.6.2
    },
  },
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.base,
      ease: easeOutApple,
    },
  },
};
