import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, validateRequest, checkRateLimit, schemas } from "@/lib/api-validation";
import { validateCode } from "@/lib/execution-engine";
import { detectCheating, auditLog } from "@/lib/security";
import { updateStreak, checkAchievements, addClanXP, calculateLevel, getXPMultiplier } from "@/lib/gamification";
import { invalidateUserCache, invalidateLeaderboard } from "@/lib/cache";
import { trackEvent } from "@/lib/analytics";
import { recordLearningEvent } from "@/lib/ai-engine";

// XP formula: base reward + speed bonus
function calculateXP(baseXP: number, timeTaken?: number, multiplier = 1): number {
  let xp = baseXP;
  if (timeTaken && timeTaken < 300) {
    xp += Math.min(Math.floor((300 - timeTaken) / 10), 50);
  }
  return Math.round(xp * multiplier);
}

export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(req, 30, 60);
  if (rl) return rl.error;

  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;
  const { userId } = authResult;

  const validation = await validateRequest(req, schemas.submission);
  if ("error" in validation) return validation.error;
  const { questId, code, passed, timeTaken } = validation.data;

  const quest = await db.quest.findUnique({ where: { id: questId } });
  if (!quest) return NextResponse.json({ error: "Quest not found" }, { status: 404 });

  // Validate code safety
  const safety = validateCode(code, quest.language);
  if (!safety.valid) return NextResponse.json({ error: safety.error }, { status: 400 });

  // Anti-cheat
  const suspicious = await detectCheating(userId, questId);
  if (suspicious) {
    await auditLog("anti_cheat:flagged", `submission:${questId}`, userId);
    return NextResponse.json({ error: "Submission rate too high" }, { status: 429 });
  }

  // Check if already completed
  const alreadyPassed = await db.submission.findFirst({
    where: { userId, questId, status: "PASSED" },
  });

  const user = await db.user.findUnique({ where: { id: userId }, select: { prestige: true, xp: true, level: true } });
  const multiplier = getXPMultiplier(user?.prestige || 0);
  const xpEarned = passed && !alreadyPassed ? calculateXP(quest.xpReward, timeTaken, multiplier) : 0;
  const coinsEarned = passed && !alreadyPassed ? quest.coinReward : 0;

  const submission = await db.submission.create({
    data: { userId, questId, code, status: passed ? "PASSED" : "FAILED", xpEarned, timeTaken },
  });

  // Award XP/coins on first pass
  if (passed && !alreadyPassed) {
    const updated = await db.user.update({
      where: { id: userId },
      data: {
        xp: { increment: xpEarned },
        coins: { increment: coinsEarned },
        level: calculateLevel((user?.xp || 0) + xpEarned),
        lastActiveAt: new Date(),
      },
    });

    // Async side effects (non-blocking)
    Promise.all([
      updateStreak(userId),
      checkAchievements(userId),
      addClanXP(userId, Math.round(xpEarned * 0.1)),
      invalidateUserCache(userId),
      invalidateLeaderboard(),
      trackEvent("quest_completed", userId, { questId, xpEarned, timeTaken }),
      recordLearningEvent(userId, questId, [quest.language, quest.difficulty], true),
    ]).catch(() => {}); // Don't fail the response on side-effect errors
  } else if (!passed) {
    trackEvent("quest_failed", userId, { questId, timeTaken }).catch(() => {});
    recordLearningEvent(userId, questId, [quest.language], false).catch(() => {});
  }

  return NextResponse.json({
    id: submission.id,
    status: submission.status,
    xpEarned,
    coinsEarned,
    firstCompletion: !alreadyPassed && passed,
  });
}
