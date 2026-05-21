import { Language, Difficulty } from "@prisma/client";
import { db } from "@/lib/db";
import { generateAdaptiveQuest } from "@/lib/ai-engine";

// ─── QUEST POOL SELECTION ────────────────────────────────────────────────────

export async function getNextQuest(userId: string, worldId: string) {
  // Find the user's last completed quest in this world
  const lastCompleted = await db.submission.findFirst({
    where: { userId, status: "PASSED", quest: { worldId } },
    orderBy: { quest: { order: "desc" } },
    select: { quest: { select: { order: true } } },
  });

  const nextOrder = (lastCompleted?.quest.order || 0) + 1;

  return db.quest.findFirst({
    where: { worldId, order: nextOrder },
  });
}

export async function getRecommendedQuests(userId: string, limit = 5) {
  // Get user's completed quests
  const completed = await db.submission.findMany({
    where: { userId, status: "PASSED" },
    select: { questId: true },
  });
  const completedIds = new Set(completed.map((c) => c.questId));

  // Get user level to determine appropriate difficulty
  const user = await db.user.findUnique({ where: { id: userId }, select: { level: true } });
  if (!user) return [];

  const difficulties: Difficulty[] = user.level <= 5
    ? ["BEGINNER", "EASY"]
    : user.level <= 15
    ? ["EASY", "MEDIUM"]
    : ["MEDIUM", "HARD"];

  const quests = await db.quest.findMany({
    where: { difficulty: { in: difficulties }, id: { notIn: Array.from(completedIds) } },
    take: limit,
    orderBy: { order: "asc" },
    include: { world: { select: { name: true, theme: true } } },
  });

  return quests;
}

// ─── DYNAMIC QUEST GENERATION ────────────────────────────────────────────────

export async function generateAndSaveQuest(userId: string, language: Language, worldId: string) {
  const generated = await generateAdaptiveQuest(userId, language);

  const lastQuest = await db.quest.findFirst({ where: { worldId }, orderBy: { order: "desc" } });

  const quest = await db.quest.create({
    data: {
      title: generated.title,
      description: generated.description,
      language: generated.language,
      difficulty: generated.difficulty,
      xpReward: generated.xpReward,
      starterCode: generated.starterCode,
      solution: generated.solution,
      testCases: generated.testCases,
      hints: generated.hints,
      worldId,
      order: (lastQuest?.order || 0) + 1,
    },
  });

  return quest;
}

// ─── WORLD MANAGEMENT ────────────────────────────────────────────────────────

export async function getWorldProgress(userId: string) {
  const worlds = await db.world.findMany({
    orderBy: { order: "asc" },
    include: { quests: { select: { id: true } } },
  });

  const completedQuests = await db.submission.findMany({
    where: { userId, status: "PASSED" },
    select: { questId: true },
  });
  const completedIds = new Set(completedQuests.map((c) => c.questId));

  const user = await db.user.findUnique({ where: { id: userId }, select: { level: true } });

  return worlds.map((world) => {
    const totalQuests = world.quests.length;
    const completed = world.quests.filter((q) => completedIds.has(q.id)).length;
    return {
      id: world.id,
      name: world.name,
      description: world.description,
      theme: world.theme,
      imageUrl: world.imageUrl,
      totalQuests,
      completedQuests: completed,
      progress: totalQuests > 0 ? Math.round((completed / totalQuests) * 100) : 0,
      unlocked: (user?.level || 1) >= world.unlockLevel,
      unlockLevel: world.unlockLevel,
    };
  });
}

// ─── BOSS FIGHT SYSTEM ───────────────────────────────────────────────────────

export async function getBossQuest(worldId: string) {
  return db.quest.findFirst({
    where: { worldId, isBoss: true },
  });
}

export async function canChallengeBoss(userId: string, worldId: string): Promise<boolean> {
  const world = await db.world.findUnique({ where: { id: worldId }, include: { quests: true } });
  if (!world) return false;

  const nonBossQuests = world.quests.filter((q) => !q.isBoss);
  const completed = await db.submission.count({
    where: { userId, status: "PASSED", questId: { in: nonBossQuests.map((q) => q.id) } },
  });

  // Must complete 80% of non-boss quests
  return completed >= Math.ceil(nonBossQuests.length * 0.8);
}
