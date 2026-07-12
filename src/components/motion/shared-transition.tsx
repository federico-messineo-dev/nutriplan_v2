"use client";

import { motion, LayoutGroup } from "framer-motion";
import { springSoft } from "@/lib/motion";

export { LayoutGroup };

interface SharedTransitionProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function SharedTransition({ id, children, className }: SharedTransitionProps) {
  return (
    <motion.div
      layoutId={id}
      transition={springSoft}
      className={className}
    >
      {children}
    </motion.div>
  );
}
