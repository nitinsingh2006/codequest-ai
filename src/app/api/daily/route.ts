import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-validation";
import { db } from "@/lib/db";
import { claimDailyReward, updateStreak } from "@/lib/gamification";
import { trackEvent } from "@/lib/analytics";

// GET /api/daily — get today's challenge and reward status
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;
  const { userId } = authResult;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { streak: true, longestStreak: true, lastActiveAt: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Check if streak is active today
  const lastActive = new Date(user.lastActiveAt);
  const now = new Date();
  const hoursSinceActive = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);
  const streakActive = hoursSinceActive < 48;

  // Get a daily quest (rotate based on day of year)
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const dailyQuest = await db.quest.findFirst({
    where: { difficulty: { in: ["EASY", "MEDIUM"] } },
    skip: dayOfYear % (await db.quest.count() || 1),
    select: { id: true, title: true, description: true, language: true, difficulty: true, xpReward: true },
  });

  return NextResponse.json({
    streak: user.streak,
    longestStreak: user.longestStreak,
    streakActive,
    dailyQuest,
    rewardDay: ((user.streak - 1) % 7) + 1,
  });
}

// POST /api/daily — claim daily reward
export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;
  const { userId } = authResult;

  await updateStreak(userId);
  const reward = await claimDailyReward(userId);

  if (!reward) {
    return NextResponse.json({ error: "Already claimed today" }, { status: 400 });
  }

  await trackEvent("daily_login", userId, { reward });
  return NextResponse.json({ reward, claimed: true });
}
