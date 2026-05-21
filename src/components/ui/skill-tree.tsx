"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Lock, Check } from "lucide-react";

interface SkillNodeData {
  id: string;
  name: string;
  icon: string;
  tier: number;
  unlocked: boolean;
  available: boolean;
}

interface SkillTreeProps {
  nodes: SkillNodeData[];
  onUnlock: (id: string) => void;
}

export function SkillTreeViz({ nodes, onUnlock }: SkillTreeProps) {
  const tiers = nodes.reduce<Record<number, SkillNodeData[]>>((acc, node) => {
    (acc[node.tier] ||= []).push(node);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(tiers)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([tier, tierNodes]) => (
          <div key={tier} className="flex justify-center gap-4 flex-wrap">
            {tierNodes.map((node, i) => (
              <motion.button
                key={node.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => node.available && !node.unlocked && onUnlock(node.id)}
                disabled={!node.available || node.unlocked}
                className={cn(
                  "relative w-20 h-20 rounded-xl flex flex-col items-center justify-center gap-1 transition-all duration-300",
                  node.unlocked && "glass-strong border-accent/50 shadow-[0_0_20px_rgba(0,245,212,0.2)]",
                  node.available && !node.unlocked && "glass border-primary/50 hover:scale-110 cursor-pointer hover:shadow-[0_0_30px_rgba(108,99,255,0.3)]",
                  !node.available && "glass opacity-40 cursor-not-allowed"
                )}
              >
                <span className="text-xl">{node.icon}</span>
                <span className="text-[10px] text-gray-400 truncate w-full text-center px-1">{node.name}</span>
                {node.unlocked && <Check className="absolute -top-1 -right-1 w-4 h-4 text-accent bg-surface rounded-full p-0.5" />}
                {!node.available && <Lock className="absolute -top-1 -right-1 w-3 h-3 text-gray-500" />}
              </motion.button>
            ))}
          </div>
        ))}
    </div>
  );
}
