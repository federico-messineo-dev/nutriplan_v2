"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Users, LayoutDashboard, Utensils, Dumbbell, Settings } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/clients", label: "Clienti", icon: Users },
  { href: "/dashboard/plans", label: "Piani", icon: Utensils },
  { href: "/dashboard/workouts", label: "Allenamenti", icon: Dumbbell },
  { href: "/dashboard/settings", label: "Impostazioni", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-slate-900/50 border-r border-slate-700/50 backdrop-blur-sm p-4 gap-1">
      {/* Logo */}
      <div className="px-3 py-4 mb-4">
        <h1 className="font-display text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          NutriPlan
        </h1>
        <p className="font-meta text-slate-500 mt-0.5">Pro</p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5">
        {navItems.map((item) => {
          const isActive = item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-body transition-colors duration-200",
                isActive
                  ? "text-cyan-400 font-medium"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50",
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-slate-800/70 rounded-[var(--radius-sm)]"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <item.icon size={18} strokeWidth={isActive ? 2 : 1.5} className="relative z-10" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Trainer info */}
      <div className="mt-auto px-3 py-3 border-t border-slate-700/50">
        <p className="font-body text-sm text-slate-200 font-medium">Alberto Iocca</p>
        <p className="font-meta text-slate-500">NutriPlan Pro</p>
      </div>
    </aside>
  );
}
