"use client";

import { cn } from "@/lib/cn";
import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";

export interface CardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  variant?: "default" | "glass" | "interactive";
  children?: ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", children, ...props }, ref) => {
    const isInteractive = variant === "interactive";

    return (
      <motion.div
        ref={ref}
        whileHover={isInteractive ? { y: -2, scale: 1.01 } : undefined}
        whileTap={isInteractive ? { scale: 0.98 } : undefined}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={cn(
          "rounded-[var(--radius-md)] transition-shadow duration-200",
          {
            "bg-slate-900/50 border border-slate-700/50 shadow-lg": variant === "default",
            "bg-slate-900/50 border border-slate-700/50 backdrop-blur-sm": variant === "glass",
            "bg-slate-900/50 border border-slate-700/50 shadow-lg hover:shadow-xl hover:border-cyan-500/30 cursor-pointer":
              variant === "interactive",
          },
          className,
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);
Card.displayName = "Card";

export { Card };
