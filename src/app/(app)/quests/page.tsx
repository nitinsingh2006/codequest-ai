"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Lock, CheckCircle, Star, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function QuestsPage() {
  const { data: worlds } = useQuery({
    queryKey: ["worlds"],
    queryFn: () => fetch("/api/quests/generate?action=worlds").then((r) => r.json()),
  });

  const { data: quests } = useQuery({
    queryKey: ["quests"],
    queryFn: () => fetch("/api/quests").then((r) => r.json()),
  });

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold">Coding Worlds</h1>
        <p className="text-gray-400 mt-1">Choose your path and conquer each world</p>
      </motion.div>

      {/* World Cards */}
      {worlds && worlds.length > 0 ? (
        <div className="space-y-4">
          {worlds.map((world: any, i: number) => (
            <motion.div
              key={world.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <WorldCard world={world} />
            </motion.div>
          ))}
        </div>
      ) : (
        /* Fallback: flat quest list */
        <div className="space-y-3">
          {quests?.map((quest: any) => (
            <Link key={quest.id} href={`/quest/${quest.id}`}>
              <motion.div className="card-cyber flex items-center justify-between" whileHover={{ x: 4 }}>
                <div className="flex items-center gap-3">
                  <DifficultyBadge difficulty={quest.difficulty} />
                  <div>
                    <h3 className="font-semibold text-sm">{quest.title}</h3>
                    <p className="text-xs text-gray-500">{quest.language} • {quest.xpReward} XP</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </motion.div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function WorldCard({ world }: { world: any }) {
  const locked = !world.unlocked;
  const completed = world.progress === 100;

  const themeColors: Record<string, string> = {
    forest: "from-green-500/20 to-emerald-600/10 border-green-500/20",
    jungle: "from-yellow-500/20 to-amber-600/10 border-yellow-500/20",
    arena: "from-blue-500/20 to-indigo-600/10 border-blue-500/20",
    default: "from-primary/20 to-accent/10 border-primary/20",
  };

  const colors = themeColors[world.theme] || themeColors.default;

  return (
    <div className={`relative rounded-2xl border p-5 transition-all ${locked ? "opacity-50 border-white/5" : `bg-gradient-to-r ${colors}`}`}>
      {locked && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-dark/80 rounded-2xl z-10">
          <div className="text-center">
            <Lock className="w-6 h-6 text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Unlock at Level {world.unlockLevel}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl">
            {world.theme === "forest" ? "🌲" : world.theme === "jungle" ? "🌴" : world.theme === "arena" ? "⚔️" : "🌍"}
          </div>
          <div>
            <h3 className="font-display font-bold">{world.name}</h3>
            <p className="text-sm text-gray-400">{world.description}</p>
          </div>
        </div>

        {completed ? (
          <CheckCircle className="w-6 h-6 text-success" />
        ) : !locked ? (
          <Link href={`/quests?world=${world.id}`} className="text-xs btn-cyber px-3 py-1.5">
            Enter →
          </Link>
        ) : null}
      </div>

      {/* Progress bar */}
      {!locked && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{world.completedQuests}/{world.totalQuests} quests</span>
            <span>{world.progress}%</span>
          </div>
          <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${world.progress}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const config: Record<string, { color: string; stars: number }> = {
    BEGINNER: { color: "text-green-400", stars: 1 },
    EASY: { color: "text-blue-400", stars: 2 },
    MEDIUM: { color: "text-yellow-400", stars: 3 },
    HARD: { color: "text-orange-400", stars: 4 },
    BOSS: { color: "text-red-400", stars: 5 },
  };
  const { color, stars } = config[difficulty] || config.EASY;

  return (
    <div className={`flex ${color}`}>
      {Array.from({ length: stars }).map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
    </div>
  );
}
