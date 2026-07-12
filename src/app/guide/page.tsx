"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MacroRings } from "@/components/motion/macro-rings";
import { StaggerList, StaggerItem } from "@/components/motion/stagger-list";
import { motion } from "framer-motion";
import { springSoft, springSnappy, duration, easeOutApple } from "@/lib/motion";

export default function StyleGuidePage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto p-4 md:p-6 mobile-bottom-pad">
          <motion.h1
            initial={{ y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springSoft}
            className="font-display text-3xl text-slate-100 mb-8"
          >
            Style Guide
          </motion.h1>

          {/* === COLOR PALETTE === */}
          <section className="mb-12">
            <h2 className="font-display text-xl text-slate-100 mb-4">Palette</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {[
                { name: "slate-900", value: "bg-slate-900", text: "text-white", border: true },
                { name: "slate-800", value: "bg-slate-800", text: "text-white", border: true },
                { name: "slate-700", value: "bg-slate-700", text: "text-white", border: true },
                { name: "cyan-500", value: "bg-cyan-500", text: "text-white" },
                { name: "green-500", value: "bg-green-500", text: "text-white" },
                { name: "purple-500", value: "bg-purple-500", text: "text-white" },
                { name: "red-500", value: "bg-red-500", text: "text-white" },
                { name: "amber-500", value: "bg-amber-500", text: "text-white" },
              ].map((c) => (
                <div key={c.name}>
                  <div className={`h-16 rounded-[var(--radius-md)] ${c.value} ${c.border ? "border border-slate-700" : ""}`} />
                  <p className="font-mono text-xs text-slate-500 mt-1.5">{c.name}</p>
                </div>
              ))}
            </div>
          </section>

          {/* === TYPOGRAPHY === */}
          <section className="mb-12">
            <h2 className="font-display text-xl text-slate-100 mb-4">Typography</h2>
            <div className="space-y-4">
              <div>
                <p className="font-meta text-slate-500 mb-1">Display (Fraunces)</p>
                <p className="font-display text-4xl text-slate-100" style={{ fontFamily: "Fraunces, Georgia, serif" }}>Heading 1</p>
              </div>
              <div>
                <p className="font-meta text-slate-500 mb-1">Body (Geist)</p>
                <p className="font-body text-base text-slate-200">
                  The quick brown fox jumps over the lazy dog. 0123456789
                </p>
              </div>
              <div>
                <p className="font-meta text-slate-500 mb-1">Meta (Geist Mono)</p>
                <p className="font-meta">MACROS: P 42 · C 180 · F 60</p>
              </div>
            </div>
          </section>

          {/* === COMPONENTS === */}
          <section className="mb-12">
            <h2 className="font-display text-xl text-slate-100 mb-4">Components</h2>
            <div className="space-y-6">
              {/* Buttons */}
              <div>
                <p className="font-meta text-slate-500 mb-3">Buttons</p>
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="danger">Danger</Button>
                  <Button size="sm">Small</Button>
                  <Button size="lg">Large</Button>
                </div>
              </div>

              {/* Input */}
              <div>
                <p className="font-meta text-slate-500 mb-3">Input</p>
                <div className="max-w-sm">
                  <Input label="Nome cliente" placeholder="Es. Marco Bianchi" />
                </div>
              </div>

              {/* Cards */}
              <div>
                <p className="font-meta text-slate-500 mb-3">Cards</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <p className="font-body text-sm text-slate-200">Default card</p>
                  </Card>
                  <Card variant="glass" className="p-4">
                    <p className="font-body text-sm text-slate-200">Glass card</p>
                  </Card>
                  <Card variant="interactive" className="p-4">
                    <p className="font-body text-sm text-slate-200">Interactive card</p>
                  </Card>
                </div>
              </div>

              {/* Skeleton */}
              <div>
                <p className="font-meta text-slate-500 mb-3">Skeleton loading</p>
                <div className="max-w-sm space-y-2">
                  <Skeleton width="80%" height={20} />
                  <Skeleton width="60%" height={14} />
                  <Skeleton width="100%" height={14} />
                </div>
              </div>
            </div>
          </section>

          {/* === MACRO RINGS === */}
          <section className="mb-12">
            <h2 className="font-display text-xl text-slate-100 mb-4">Macro Rings</h2>
            <div className="flex items-center gap-8">
              <MacroRings
                kcal={2200}
                kcalTarget={2900}
                protein={150}
                proteinTarget={200}
                carbs={280}
                carbsTarget={340}
                fat={60}
                fatTarget={75}
              />
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-cyan-500" />
                  <span className="font-body text-slate-400">Kcal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="font-body text-slate-400">Proteine</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="font-body text-slate-400">Carboidrati</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-300" />
                  <span className="font-body text-slate-400">Grassi</span>
                </div>
              </div>
            </div>
          </section>

          {/* === STAGGER LIST === */}
          <section className="mb-12">
            <h2 className="font-display text-xl text-slate-100 mb-4">Stagger List Animation</h2>
            <StaggerList className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <StaggerItem key={i}>
                  <Card className="p-4 text-center">
                    <span className="font-display text-lg text-slate-100">{i}</span>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerList>
          </section>

          {/* === MOTION TOKENS === */}
          <section className="mb-12">
            <h2 className="font-display text-xl text-slate-100 mb-4">Motion Tokens</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "fast (0.15s)", delay: duration.fast },
                { label: "base (0.25s)", delay: duration.base },
                { label: "slow (0.4s)", delay: duration.slow },
                { label: "deliberate (0.6s)", delay: duration.deliberate },
              ].map((t) => (
                <motion.div
                  key={t.label}
                  initial={{ scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: t.delay, ease: easeOutApple }}
                  className="p-4 bg-slate-800/50 rounded-[var(--radius-md)] text-center border border-slate-700/30"
                >
                  <p className="font-mono text-xs text-slate-500">{t.label}</p>
                </motion.div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
