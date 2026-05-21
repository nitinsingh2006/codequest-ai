"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Zap, Star, Trophy } from "lucide-react";

export function XPPopup({ amount, show }: { amount: number; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{ opacity: 1, y: -60, scale: 1 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="flex items-center gap-2 bg-xp/20 border border-xp/50 rounded-full px-4 py-2 shadow-[0_0_30px_rgba(255,215,0,0.3)]">
            <Zap className="w-5 h-5 text-xp" />
            <span className="font-display font-bold text-xp text-lg">+{amount} XP</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function LevelUpOverlay({ level, show, onClose }: { level: number; show: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-black/80 flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", damping: 15 }}
            className="text-center space-y-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-xp to-accent flex items-center justify-center shadow-[0_0_60px_rgba(255,215,0,0.5)]"
            >
              <Star className="w-12 h-12 text-surface-dark" />
            </motion.div>
            <h2 className="font-display text-3xl font-bold text-xp text-glow">LEVEL UP!</h2>
            <p className="text-5xl font-display font-black gradient-text">{level}</p>
            <p className="text-gray-400 text-sm">Tap to continue</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function AchievementToast({ name, icon, rarity }: { name: string; icon: string; rarity: string }) {
  const rarityColors: Record<string, string> = {
    COMMON: "border-gray-500/30",
    RARE: "border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]",
    EPIC: "border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.2)]",
    LEGENDARY: "border-xp/30 shadow-[0_0_30px_rgba(255,215,0,0.3)]",
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className={cn("glass-strong p-4 flex items-center gap-3 min-w-[280px]", rarityColors[rarity])}
    >
      <div className="text-2xl">{icon}</div>
      <div>
        <p className="text-xs text-accent font-semibold uppercase">Achievement Unlocked</p>
        <p className="font-semibold">{name}</p>
        <p className="text-xs text-gray-400 capitalize">{rarity.toLowerCase()}</p>
      </div>
    </motion.div>
  );
}

export function StreakCelebration({ streak, show }: { streak: number; show: boolean }) {
  if (!show) return null;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="fixed top-20 right-4 z-50 pointer-events-none"
    >
      <div className="glass-strong p-4 flex items-center gap-3 border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
        <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: 2, duration: 0.4 }} className="text-2xl">🔥</motion.span>
        <div>
          <p className="text-xs text-orange-400 font-semibold uppercase">Streak!</p>
          <p className="font-display font-bold">{streak} days</p>
        </div>
      </div>
    </motion.div>
  );
}

export function QuestCompleteOverlay({ xp, show, onClose }: { xp: number; show: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-black/70 flex items-center justify-center backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 12 }}
            className="text-center space-y-4 p-8"
          >
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="text-6xl">
              ✨
            </motion.div>
            <h2 className="font-display text-2xl font-bold text-success">Quest Complete!</h2>
            <div className="flex items-center justify-center gap-2">
              <Zap className="w-6 h-6 text-xp" />
              <span className="font-display text-3xl font-black text-xp">+{xp} XP</span>
            </div>
            <p className="text-gray-400 text-sm">Tap to continue</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
