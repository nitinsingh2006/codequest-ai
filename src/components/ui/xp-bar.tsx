"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface XPBarProps {
  current: number;
  max: number;
  level: number;
  className?: string;
}

export function AnimatedXPBar({ current, max, level, className }: XPBarProps) {
  const percent = Math.min((current / max) * 100, 100);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center text-sm">
        <span className="font-display text-xs text-primary">LVL {level}</span>
        <span className="text-gray-400 font-mono text-xs">{current}/{max} XP</span>
      </div>
      <div className="relative h-3 bg-surface-dark rounded-full overflow-hidden neon-border">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-neon-purple to-accent"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        {/* Shimmer overlay */}
        <div className="absolute inset-0 shimmer-bg rounded-full pointer-events-none" />
      </div>
    </div>
  );
}
