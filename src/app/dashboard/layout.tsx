"use client";

import { ParticleBackground } from "@/components/particle-background";
import { MobileNav } from "@/components/layout/mobile-nav";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

const pageTransition = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.98 },
  transition: {
    type: "spring" as const,
    stiffness: 260,
    damping: 28,
    mass: 0.8,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="relative h-full overflow-hidden">
      <ParticleBackground />
      <MobileNav />
      <div className="relative z-10 h-full min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            {...pageTransition}
            className="h-full min-h-0"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
