"use client";

import { ParticleBackground } from "@/components/particle-background";
import { MobileNav } from "@/components/layout/mobile-nav";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import { easeOutApple } from "@/lib/motion";

const pageTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.18, ease: easeOutApple },
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
