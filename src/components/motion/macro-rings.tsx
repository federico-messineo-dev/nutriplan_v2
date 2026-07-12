"use client";

import { motion } from "framer-motion";
import { springSoft } from "@/lib/motion";

interface MacroRingsProps {
  kcal: number;
  kcalTarget: number;
  protein: number;
  proteinTarget: number;
  carbs: number;
  carbsTarget: number;
  fat: number;
  fatTarget: number;
  size?: number;
}

function Ring({
  value,
  max,
  color,
  radius,
  strokeWidth,
}: {
  value: number;
  max: number;
  color: string;
  radius: number;
  strokeWidth: number;
}) {
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(value / max, 1);
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <motion.circle
      cx={radius + strokeWidth / 2}
      cy={radius + strokeWidth / 2}
      r={radius}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeDasharray={circumference}
      initial={{ strokeDashoffset: circumference }}
      animate={{ strokeDashoffset }}
      transition={{ ...springSoft, delay: 0.2 }}
      transform={`rotate(-90 ${radius + strokeWidth / 2} ${radius + strokeWidth / 2})`}
    />
  );
}

export function MacroRings({
  kcal,
  kcalTarget,
  protein,
  proteinTarget,
  carbs,
  carbsTarget,
  fat,
  fatTarget,
  size = 160,
}: MacroRingsProps) {
  const strokeWidth = 8;
  const gap = 4;
  const center = size / 2;

  const rings = [
    { value: kcal, max: kcalTarget, color: "#06b6d4", radius: center - strokeWidth / 2 },
    { value: protein, max: proteinTarget, color: "#22c55e", radius: center - strokeWidth / 2 - strokeWidth - gap },
    { value: carbs, max: carbsTarget, color: "#a855f7", radius: center - strokeWidth / 2 - 2 * (strokeWidth + gap) },
    { value: fat, max: fatTarget, color: "#94a3b8", radius: center - strokeWidth / 2 - 3 * (strokeWidth + gap) },
  ];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        {rings.map((ring, i) => (
          <Ring key={i} {...ring} strokeWidth={strokeWidth} />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl text-slate-100 font-bold">{kcal}</span>
        <span className="font-meta text-slate-500">/ {kcalTarget} kcal</span>
      </div>
    </div>
  );
}
