"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { LayoutDashboard, Users, Utensils, Dumbbell, Settings } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Clienti", icon: Users },
  { href: "/dashboard/plans", label: "Piani", icon: Utensils },
  { href: "/dashboard/workouts", label: "Work", icon: Dumbbell },
  { href: "/dashboard/settings", label: "Impost.", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 border-t border-slate-700/50 backdrop-blur-lg rounded-t-3xl pb-[env(safe-area-inset-bottom,8px)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 w-16 h-16 rounded-lg transition-colors",
                isActive
                  ? "text-cyan-400"
                  : "text-slate-500 active:text-slate-300",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-active"
                  className="absolute inset-1 bg-cyan-500/10 rounded-lg"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <item.icon size={22} strokeWidth={isActive ? 2 : 1.5} className="relative z-10" />
              <span className="relative z-10 text-[11px] font-body leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
