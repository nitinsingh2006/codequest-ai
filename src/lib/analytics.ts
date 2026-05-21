import { db } from "@/lib/db";

// ─── EVENT TRACKING ──────────────────────────────────────────────────────────

export type AnalyticsEventType =
  | "quest_started" | "quest_completed" | "quest_failed"
  | "ai_hint_used" | "ai_review_used"
  | "match_started" | "match_won" | "match_lost"
  | "achievement_unlocked" | "level_up" | "prestige"
  | "daily_login" | "streak_milestone"
  | "code_executed" | "submission_created";

export async function trackEvent(
  event: AnalyticsEventType,
  userId?: string,
  data?: Record<string, unknown>
) {
  await db.analyticsEvent.create({ data: { event, userId, data: data as any } });
}

// ─── ANALYTICS QUERIES ───────────────────────────────────────────────────────

export async function getDailyActiveUsers(days = 30): Promise<{ date: string; count: number }[]> {
  const since = new Date(Date.now() - days * 86400000);

  const events = await db.analyticsEvent.groupBy({
    by: ["createdAt"],
    where: { event: "daily_login", createdAt: { gte: since } },
    _count: { userId: true },
  });

  // Aggregate by day
  const byDay = new Map<string, Set<string>>();
  const rawEvents = await db.analyticsEvent.findMany({
    where: { event: "daily_login", createdAt: { gte: since } },
    select: { userId: true, createdAt: true },
  });

  for (const e of rawEvents) {
    if (!e.userId) continue;
    const day = e.createdAt.toISOString().split("T")[0];
    if (!byDay.has(day)) byDay.set(day, new Set());
    byDay.get(day)!.add(e.userId);
  }

  return Array.from(byDay.entries())
    .map(([date, users]) => ({ date, count: users.size }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getRetentionMetrics() {
  const now = new Date();
  const day1 = new Date(now.getTime() - 86400000);
  const day7 = new Date(now.getTime() - 7 * 86400000);
  const day30 = new Date(now.getTime() - 30 * 86400000);

  const [total, activeDay1, activeDay7, activeDay30] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { lastActiveAt: { gte: day1 } } }),
    db.user.count({ where: { lastActiveAt: { gte: day7 } } }),
    db.user.count({ where: { lastActiveAt: { gte: day30 } } }),
  ]);

  return {
    total,
    dau: activeDay1,
    wau: activeDay7,
    mau: activeDay30,
    d1Retention: total > 0 ? Math.round((activeDay1 / total) * 100) : 0,
    d7Retention: total > 0 ? Math.round((activeDay7 / total) * 100) : 0,
    d30Retention: total > 0 ? Math.round((activeDay30 / total) * 100) : 0,
  };
}

export async function getQuestCompletionStats() {
  const quests = await db.quest.findMany({
    select: { id: true, title: true, difficulty: true, language: true },
  });

  const submissions = await db.submission.groupBy({
    by: ["questId", "status"],
    _count: true,
  });

  return quests.map((q) => {
    const questSubs = submissions.filter((s) => s.questId === q.id);
    const passed = questSubs.find((s) => s.status === "PASSED")?._count || 0;
    const total = questSubs.reduce((sum, s) => sum + s._count, 0);
    return { ...q, attempts: total, completions: passed, passRate: total > 0 ? Math.round((passed / total) * 100) : 0 };
  });
}

export async function getLanguagePopularity() {
  const submissions = await db.submission.findMany({
    include: { quest: { select: { language: true } } },
    where: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
  });

  const counts = new Map<string, number>();
  for (const s of submissions) {
    const lang = s.quest.language;
    counts.set(lang, (counts.get(lang) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count);
}
