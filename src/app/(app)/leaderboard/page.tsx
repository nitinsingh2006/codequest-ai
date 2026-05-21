"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trophy, Flame, Zap, Crown } from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface LeaderboardUser {
  id: string;
  name: string | null;
  xp: number;
  level: number;
  streak: number;
  prestige: number;
}

const rankIcons = ["🥇", "🥈", "🥉"];
const rankGlows = [
  "shadow-[0_0_30px_rgba(255,215,0,0.3)]",
  "shadow-[0_0_20px_rgba(192,192,192,0.2)]",
  "shadow-[0_0_20px_rgba(205,127,50,0.2)]",
];

export default function LeaderboardPage() {
  const { data: session } = useSession();
  const { data: users } = useQuery<LeaderboardUser[]>({
    queryKey: ["leaderboard"],
    queryFn: () => fetch("/api/leaderboard").then((r) => r.json()),
  });

  if (!users) return <LeaderboardSkeleton />;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold flex items-center gap-3">
          <Trophy className="w-8 h-8 text-xp" />
          <span className="gradient-text">Leaderboard</span>
        </h1>
        <p className="text-gray-400 mt-1">Top warriors in the realm</p>
      </motion.div>

      {/* Top 3 Podium */}
      {users.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 items-end">
          <PodiumCard user={users[1]} rank={2} />
          <PodiumCard user={users[0]} rank={1} />
          <PodiumCard user={users[2]} rank={3} />
        </div>
      )}

      {/* Full List */}
      <div className="space-y-2">
        {users.map((user, i) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className={cn(
              "flex items-center gap-4 p-4 rounded-2xl transition-all",
              user.id === session?.user?.id
                ? "glass-strong border-primary/40"
                : "glass hover:border-white/10"
            )}
          >
            <span className="w-10 text-center font-display font-bold text-lg">
              {i < 3 ? rankIcons[i] : <span className="text-gray-500">#{i + 1}</span>}
            </span>

            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center font-bold">
              {user.name?.[0]?.toUpperCase() || "?"}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">
                {user.name || "Anonymous"}
                {user.id === session?.user?.id && <span className="text-xs text-primary ml-2">(You)</span>}
                {user.prestige > 0 && <span className="text-xs text-xp ml-2">⭐ P{user.prestige}</span>}
              </p>
              <p className="text-xs text-gray-400">Level {user.level}</p>
            </div>

            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-xp font-mono">
                <Zap className="w-4 h-4" /> {user.xp.toLocaleString()}
              </span>
              {user.streak > 0 && (
                <span className="flex items-center gap-1 text-danger">
                  <Flame className="w-3 h-3" /> {user.streak}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PodiumCard({ user, rank }: { user: LeaderboardUser; rank: number }) {
  return (
    <motion.div
      className={cn("card-cyber text-center", rank === 1 && "scale-105", rankGlows[rank - 1])}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.15 }}
    >
      <div className="text-4xl mb-3">{rankIcons[rank - 1]}</div>
      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-xl font-bold mx-auto mb-2">
        {user.name?.[0]?.toUpperCase() || "?"}
      </div>
      <p className="font-semibold text-sm truncate">{user.name}</p>
      <p className="text-xp font-display font-bold mt-1">{user.xp.toLocaleString()}</p>
      <p className="text-xs text-gray-400">Level {user.level}</p>
    </motion.div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
      <div className="h-10 bg-surface-light rounded-xl w-48" />
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-44 bg-surface-light rounded-2xl" />)}
      </div>
      {[...Array(7)].map((_, i) => <div key={i} className="h-16 bg-surface-light rounded-2xl" />)}
    </div>
  );
}
