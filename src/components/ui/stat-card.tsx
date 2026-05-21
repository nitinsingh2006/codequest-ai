"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  className?: string;
}

export function StatCard({ icon, label, value, trend, className }: StatCardProps) {
  return (
    <motion.div
      className={cn("card-cyber group", className)}
      whileHover={{ scale: 1.02, y: -2 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          {icon}
        </div>
        {trend && <span className="text-xs text-accent font-mono">{trend}</span>}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold font-display">{value}</p>
        <p className="text-sm text-gray-400 mt-1">{label}</p>
      </div>
    </motion.div>
  );
}
