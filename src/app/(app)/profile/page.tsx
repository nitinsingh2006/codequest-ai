"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { User, Shield, Trophy, Flame, Zap, Crown } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

function getRankTier(elo: number) {
  if (elo >= 2400) return { tier: "Grandmaster", icon: "👑" };
  if (elo >= 2000) return { tier: "Master", icon: "💎" };
  if (elo >= 1600) return { tier: "Diamond", icon: "💠" };
  if (elo >= 1400) return { tier: "Platinum", icon: "⚡" };
  if (elo >= 1200) return { tier: "Gold", icon: "🥇" };
  if (elo >= 1000) return { tier: "Silver", icon: "🥈" };
  return { tier: "Bronze", icon: "🥉" };
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { data: stats } = useQuery({
    queryKey: ["user-stats"],
    queryFn: () => fetch("/api/user/stats").then((r) => r.json()),
  });

  const [name, setName] = useState("");

  const updateMutation = useMutation({
    mutationFn: (data: { name: string }) =>
      fetch("/api/user/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => {
      toast.success("Profile updated!");
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
    },
  });

  if (!stats) return <div className="animate-pulse h-64 bg-surface-light rounded-2xl" />;

  const rank = getRankTier(stats.eloRating);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold mb-2">Profile</h1>
        <p className="text-gray-400">Manage your hero identity</p>
      </motion.div>

      {/* Avatar & Stats */}
      <motion.div className="card-cyber flex items-center gap-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold shadow-[0_0_30px_rgba(108,99,255,0.3)]">
          {stats.name?.[0]?.toUpperCase() || "?"}
        </div>
        <div>
          <h2 className="text-xl font-bold">{stats.name}</h2>
          <p className="text-gray-400 text-sm">{stats.email}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">Level {stats.level}</span>
            <span className="text-xs px-2 py-1 rounded-full bg-accent/10 text-accent font-medium">{rank.icon} {rank.tier}</span>
            {stats.prestige > 0 && <span className="text-xs px-2 py-1 rounded-full bg-xp/10 text-xp font-medium">⭐ Prestige {stats.prestige}</span>}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox icon={<Zap className="w-4 h-4 text-xp" />} label="XP" value={stats.xp.toLocaleString()} />
        <StatBox icon={<Flame className="w-4 h-4 text-danger" />} label="Streak" value={`${stats.streak}d`} />
        <StatBox icon={<Trophy className="w-4 h-4 text-accent" />} label="Quests" value={stats.completedQuests} />
        <StatBox icon={<Crown className="w-4 h-4 text-primary" />} label="ELO" value={stats.eloRating} />
      </div>

      {/* Edit Name */}
      <motion.div className="card-cyber" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <h3 className="font-semibold mb-4 flex items-center gap-2"><User className="w-4 h-4" /> Edit Profile</h3>
        <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) updateMutation.mutate({ name }); }} className="flex gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={stats.name || "New name"}
            className="flex-1 bg-surface-dark border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors"
          />
          <button type="submit" className="btn-cyber px-6" disabled={updateMutation.isPending}>Save</button>
        </form>
      </motion.div>

      {/* Account Info */}
      <motion.div className="card-cyber" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Shield className="w-4 h-4" /> Account</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-gray-400">Role</span><span className="capitalize">{stats.role?.toLowerCase()}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Coins</span><span className="text-yellow-400">{stats.coins} 🪙</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Gems</span><span className="text-purple-400">{stats.gems} 💎</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Longest Streak</span><span>{stats.longestStreak} days</span></div>
        </div>
      </motion.div>
    </div>
  );
}

function StatBox({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="glass rounded-xl p-3 text-center">
      <div className="flex justify-center mb-1">{icon}</div>
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
