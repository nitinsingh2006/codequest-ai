import { db } from "@/lib/db";

// ─── XP & LEVELING ──────────────────────────────────────────────────────────

// Level formula: XP needed = level^2 * 100
export function xpForLevel(level: number): number {
  return level * level * 100;
}

export function calculateLevel(totalXp: number): number {
  return Math.floor(Math.sqrt(totalXp / 100)) + 1;
}

// ─── PRESTIGE SYSTEM ─────────────────────────────────────────────────────────

const PRESTIGE_LEVEL = 50;
const PRESTIGE_BONUS_MULTIPLIER = 0.1; // +10% XP per prestige

export async function checkPrestige(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { level: true, prestige: true, xp: true } });
  if (!user || user.level < PRESTIGE_LEVEL) return null;

  // Reset level, keep prestige bonus
  const newPrestige = user.prestige + 1;
  await db.user.update({
    where: { id: userId },
    data: { prestige: newPrestige, level: 1, xp: 0, title: `Prestige ${newPrestige}` },
  });

  return newPrestige;
}

export function getXPMultiplier(prestige: number): number {
  return 1 + prestige * PRESTIGE_BONUS_MULTIPLIER;
}

// ─── STREAK SYSTEM ───────────────────────────────────────────────────────────

export async function updateStreak(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { lastActiveAt: true, streak: true, longestStreak: true },
  });
  if (!user) return;

  const now = new Date();
  const lastActive = new Date(user.lastActiveAt);
  const diffHours = (now.getTime() - lastActive.getTime()) / (1000 * 60 * 60);

  let newStreak = user.streak;
  if (diffHours >= 24 && diffHours < 48) {
    newStreak = user.streak + 1;
  } else if (diffHours >= 48) {
    newStreak = 1; // Reset
  }

  await db.user.update({
    where: { id: userId },
    data: {
      streak: newStreak,
      longestStreak: Math.max(newStreak, user.longestStreak),
      lastActiveAt: now,
    },
  });

  return newStreak;
}

// ─── DAILY REWARDS ───────────────────────────────────────────────────────────

const DAILY_REWARDS = [
  { day: 1, reward: { type: "coins", amount: 50 } },
  { day: 2, reward: { type: "coins", amount: 75 } },
  { day: 3, reward: { type: "xp", amount: 100 } },
  { day: 4, reward: { type: "coins", amount: 100 } },
  { day: 5, reward: { type: "gems", amount: 5 } },
  { day: 6, reward: { type: "xp", amount: 200 } },
  { day: 7, reward: { type: "gems", amount: 15 } },
];

export async function claimDailyReward(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { streak: true } });
  if (!user) return null;

  const day = ((user.streak - 1) % 7) + 1;
  const rewardDef = DAILY_REWARDS[day - 1];

  const existing = await db.dailyReward.findUnique({
    where: { userId_day: { userId, day } },
  });

  if (existing?.claimed) return null; // Already claimed today

  await db.dailyReward.upsert({
    where: { userId_day: { userId, day } },
    update: { claimed: true, claimedAt: new Date() },
    create: { userId, day, claimed: true, claimedAt: new Date(), reward: rewardDef.reward },
  });

  // Apply reward
  const update: Record<string, { increment: number }> = {};
  if (rewardDef.reward.type === "coins") update.coins = { increment: rewardDef.reward.amount };
  if (rewardDef.reward.type === "xp") update.xp = { increment: rewardDef.reward.amount };
  if (rewardDef.reward.type === "gems") update.gems = { increment: rewardDef.reward.amount };

  await db.user.update({ where: { id: userId }, data: update });

  return rewardDef.reward;
}

// ─── ACHIEVEMENT ENGINE ──────────────────────────────────────────────────────

export async function checkAchievements(userId: string) {
  const achievements = await db.achievement.findMany();
  const unlocked = await db.userAchievement.findMany({ where: { userId }, select: { achievementId: true } });
  const unlockedIds = new Set(unlocked.map((u) => u.achievementId));

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { xp: true, level: true, streak: true },
  });
  if (!user) return [];

  const completedQuests = await db.submission.count({ where: { userId, status: "PASSED" } });
  const bossesDefeated = await db.submission.count({
    where: { userId, status: "PASSED", quest: { isBoss: true } },
  });

  const newUnlocks: string[] = [];

  for (const achievement of achievements) {
    if (unlockedIds.has(achievement.id)) continue;

    const cond = achievement.condition as { type: string; value: number };
    let met = false;

    switch (cond.type) {
      case "quests_completed": met = completedQuests >= cond.value; break;
      case "streak": met = user.streak >= cond.value; break;
      case "boss_defeated": met = bossesDefeated >= cond.value; break;
      case "level": met = user.level >= cond.value; break;
      case "xp": met = user.xp >= cond.value; break;
    }

    if (met) {
      await db.userAchievement.create({ data: { userId, achievementId: achievement.id } });
      await db.user.update({ where: { id: userId }, data: { xp: { increment: achievement.xpReward } } });
      newUnlocks.push(achievement.id);
    }
  }

  return newUnlocks;
}

// ─── CLAN XP ─────────────────────────────────────────────────────────────────

export async function addClanXP(userId: string, xp: number) {
  const membership = await db.clanMember.findUnique({ where: { userId } });
  if (!membership) return;

  await db.clan.update({
    where: { id: membership.clanId },
    data: { totalXp: { increment: xp } },
  });
}
