import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRateLimit } from "@/lib/api-validation";
import { db } from "@/lib/db";
import { createDuelMatch, submitMatchCode, getRankTier } from "@/lib/matchmaking";
import { trackEvent } from "@/lib/analytics";

// GET /api/matches — get user's match history
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;
  const { userId } = authResult;

  const matches = await db.matchParticipant.findMany({
    where: { userId },
    orderBy: { match: { createdAt: "desc" } },
    take: 20,
    include: {
      match: {
        include: {
          participants: { include: { user: { select: { id: true, name: true, eloRating: true } } } },
        },
      },
    },
  });

  return NextResponse.json(matches.map((m) => ({
    matchId: m.match.id,
    type: m.match.type,
    status: m.match.status,
    isWinner: m.isWinner,
    score: m.score,
    timeTaken: m.timeTaken,
    createdAt: m.match.createdAt,
    opponent: m.match.participants.find((p) => p.userId !== userId)?.user,
  })));
}

// POST /api/matches — submit match result
export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(req, 10, 60);
  if (rl) return rl.error;

  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;
  const { userId } = authResult;

  const { matchId, code, score, timeTaken } = await req.json();
  if (!matchId) return NextResponse.json({ error: "Missing matchId" }, { status: 400 });

  await submitMatchCode(matchId, userId, code || "", score || 0, timeTaken || 0);
  await trackEvent(score > 0 ? "match_won" : "match_lost", userId, { matchId });

  return NextResponse.json({ success: true });
}
