"use client";

import { CommandPalette } from "@/components/command-palette";
import { ParticleBackground } from "@/components/particle-background";
import { MobileNav } from "@/components/layout/mobile-nav";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { duration, easeOutApple } from "@/lib/motion";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="relative h-full overflow-hidden">
      <ParticleBackground />
      <CommandPalette />
      <MobileNav />
      <div className="relative z-10 h-full min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: duration.fast, ease: easeOutApple }}
            className="h-full min-h-0"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
