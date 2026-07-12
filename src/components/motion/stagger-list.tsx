"use client";

import { motion } from "framer-motion";
import { staggerChildren, fadeInUp } from "@/lib/motion";

interface StaggerListProps {
  children: React.ReactNode;
  className?: string;
}

export function StaggerList({ children, className }: StaggerListProps) {
  return (
    <motion.div
      variants={staggerChildren}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={fadeInUp} className={`h-full ${className ?? ""}`}>
      {children}
    </motion.div>
  );
}
