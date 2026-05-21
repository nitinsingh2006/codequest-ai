"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Lock, Check, Gift } from "lucide-react";

interface BattlePassTier {
  tier: number;
  reward: string;
  rewardIcon: string;
  unlocked: boolean;
  isPremium: boolean;
}

interface BattlePassUIProps {
  tiers: BattlePassTier[];
  currentTier: number;
  seasonName: string;
  daysLeft: number;
}

export function BattlePassUI({ tiers, currentTier, seasonName, daysLeft }: BattlePassUIProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold gradient-text">{seasonName}</h2>
          <p className="text-xs text-gray-400">{daysLeft} days remaining</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-accent font-semibold">Tier {currentTier}</p>
        </div>
      </div>

      {/* Tier track */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {tiers.map((tier, i) => (
          <motion.div
            key={tier.tier}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={cn(
              "flex-shrink-0 w-16 h-20 rounded-xl flex flex-col items-center justify-center gap-1 relative",
              tier.unlocked ? "glass-strong border-accent/40" : "glass",
              tier.isPremium && "border-xp/30"
            )}
          >
            {tier.isPremium && (
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[8px] bg-xp/20 text-xp px-1 rounded">
                PRO
              </div>
            )}
            <span className="text-lg">{tier.rewardIcon}</span>
            <span className="text-[9px] text-gray-400">{tier.reward}</span>
            {tier.unlocked ? (
              <Check className="absolute -bottom-1 w-3 h-3 text-accent" />
            ) : (
              <span className="text-[8px] text-gray-500">{tier.tier}</span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
