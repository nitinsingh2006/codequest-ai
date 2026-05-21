"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Flame, Zap, Coins, Target, Crown, Swords, Calendar, TrendingUp } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { StatCard } from "@/components/ui/stat-card";
import { AnimatedXPBar } from "@/components/ui/xp-bar";

const ParticleBackground = dynamic(
  () => import("@/components/3d/particle-background").then((m) => ({ default: m.ParticleBackground })),
  { ssr: false }
);

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["user-stats"],
    queryFn: () => fetch("/api/user/stats").then((r) => r.json()),
  });

  const { data: daily } = useQuery({
    queryKey: ["daily"],
    queryFn: () => fetch("/api/daily").then((r) => r.json()),
  });

  if (!stats) return <DashboardSkeleton />;

  const xpForNext = (stats.level + 1) * (stats.level + 1) * 100;
  const xpInLevel = stats.xp - stats.level * stats.level * 100;

  return (
    <>
      <ParticleBackground />
      <div className="space-y-6 relative z-10">
        {/* Hero */}
        <div className="flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl md:text-4xl font-display font-bold">
              Welcome, <span className="gradient-text">{stats.name}</span>
            </h1>
            <p className="text-gray-400 mt-1 text-sm">Level {stats.level} • {stats.rank?.tier || "Bronze"} {stats.rank?.icon || "🥉"}</p>
          </motion.div>

          {/* Streak Fire */}
          {stats.streak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20"
            >
              <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
              <span className="font-display font-bold text-orange-300">{stats.streak}</span>
              <span className="text-xs text-gray-400">day streak</span>
            </motion.div>
          )}
        </div>

        {/* XP Bar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <AnimatedXPBar current={Math.max(xpInLevel, 0)} max={xpForNext} level={stats.level} />
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={<Zap className="w-5 h-5 text-xp" />} label="Total XP" value={stats.xp.toLocaleString()} />
          <StatCard icon={<Crown className="w-5 h-5 text-accent" />} label="Level" value={stats.level} />
          <StatCard icon={<Target className="w-5 h-5 text-primary" />} label="Quests" value={`${stats.completedQuests}/${stats.totalQuests}`} />
          <StatCard icon={<Coins className="w-5 h-5 text-yellow-400" />} label="Coins" value={stats.coins} />
        </div>

        {/* Daily Challenge + Quick Match */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Daily Challenge */}
          <motion.div
            className="card-cyber relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-accent/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">Daily Challenge</span>
            </div>
            {daily?.dailyQuest ? (
              <>
                <h3 className="font-semibold mb-1">{daily.dailyQuest.title}</h3>
                <p className="text-sm text-gray-400 mb-3">{daily.dailyQuest.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-xp font-mono">+{daily.dailyQuest.xpReward} XP</span>
                  <Link href={`/quest/${daily.dailyQuest.id}`} className="text-xs btn-cyber px-3 py-1.5">Play →</Link>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">Loading challenge...</p>
            )}
          </motion.div>

          {/* Quick Match */}
          <motion.div
            className="card-cyber relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-danger/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-center gap-2 mb-3">
              <Swords className="w-4 h-4 text-danger" />
              <span className="text-xs font-semibold uppercase tracking-wider text-danger">PvP Arena</span>
            </div>
            <h3 className="font-semibold mb-1">Quick Match</h3>
            <p className="text-sm text-gray-400 mb-3">Battle another coder in real-time</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 font-mono">ELO: {stats.eloRating}</span>
              <button className="text-xs btn-neon px-3 py-1.5">Find Match ⚔️</button>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <QuickAction href="/quests" icon="🗺️" title="Continue Quests" subtitle="Pick up where you left off" />
          <QuickAction href="/leaderboard" icon="🏆" title="Leaderboard" subtitle="Climb the ranks" />
          <QuickAction href="/profile" icon="📊" title="My Progress" subtitle="View stats & achievements" />
        </div>

        {/* Progress Bar */}
        <motion.div className="card-cyber" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Overall Progress</span>
            </div>
            <span className="text-xs text-gray-400 font-mono">
              {stats.totalQuests > 0 ? Math.round((stats.completedQuests / stats.totalQuests) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-surface-dark rounded-full h-2 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${stats.totalQuests > 0 ? (stats.completedQuests / stats.totalQuests) * 100 : 0}%` }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
            />
          </div>
        </motion.div>
      </div>
    </>
  );
}

function QuickAction({ href, icon, title, subtitle }: { href: string; icon: string; title: string; subtitle: string }) {
  return (
    <Link href={href}>
      <motion.div className="card-cyber flex items-center gap-3 cursor-pointer" whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
        <span className="text-2xl">{icon}</span>
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </motion.div>
    </Link>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 bg-surface-light rounded-xl w-64" />
      <div className="h-4 bg-surface-light rounded-full w-full" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-surface-light rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="h-40 bg-surface-light rounded-2xl" />
        <div className="h-40 bg-surface-light rounded-2xl" />
      </div>
    </div>
  );
}
