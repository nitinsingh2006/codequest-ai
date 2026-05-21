import { db } from "@/lib/db";

// ─── ELO RATING SYSTEM ───────────────────────────────────────────────────────

const K_FACTOR = 32; // Standard K-factor
const K_FACTOR_NEW = 40; // Higher K for new players (< 30 games)

export function calculateEloChange(
  winnerRating: number,
  loserRating: number,
  winnerGames: number
): { winnerDelta: number; loserDelta: number } {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser = 1 - expectedWinner;

  const kWinner = winnerGames < 30 ? K_FACTOR_NEW : K_FACTOR;
  const kLoser = K_FACTOR;

  const winnerDelta = Math.round(kWinner * (1 - expectedWinner));
  const loserDelta = Math.round(kLoser * (0 - expectedLoser));

  return { winnerDelta, loserDelta };
}

export async function updateEloRatings(winnerId: string, loserId: string) {
  const [winner, loser] = await Promise.all([
    db.user.findUnique({ where: { id: winnerId }, select: { eloRating: true } }),
    db.user.findUnique({ where: { id: loserId }, select: { eloRating: true } }),
  ]);

  if (!winner || !loser) return;

  const winnerGames = await db.matchParticipant.count({ where: { userId: winnerId } });
  const { winnerDelta, loserDelta } = calculateEloChange(winner.eloRating, loser.eloRating, winnerGames);

  await Promise.all([
    db.user.update({ where: { id: winnerId }, data: { eloRating: { increment: winnerDelta } } }),
    db.user.update({ where: { id: loserId }, data: { eloRating: { increment: loserDelta } } }),
  ]);

  return { winnerDelta, loserDelta };
}

// ─── MATCH RESOLUTION ────────────────────────────────────────────────────────

export async function resolveMatch(matchId: string) {
  const participants = await db.matchParticipant.findMany({
    where: { matchId },
    orderBy: [{ score: "desc" }, { timeTaken: "asc" }],
  });

  if (participants.length < 2) return;

  // Winner = highest score, or fastest if tied
  const winner = participants[0];
  const loser = participants[1];

  if (winner.score > 0) {
    await db.matchParticipant.update({ where: { id: winner.id }, data: { isWinner: true } });
    await updateEloRatings(winner.userId, loser.userId);
  }

  await db.match.update({ where: { id: matchId }, data: { status: "COMPLETED", endedAt: new Date() } });
}

// ─── TOURNAMENT BRACKET GENERATION ───────────────────────────────────────────

export async function generateBracket(tournamentId: string) {
  const tournament = await db.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) return;

  // Get registered participants (from first round matches)
  const existingMatches = await db.match.findMany({
    where: { tournamentId },
    include: { participants: true },
  });

  const playerIds = Array.from(new Set(existingMatches.flatMap((m) => m.participants.map((p) => p.userId))));

  // Shuffle for random seeding
  const shuffled = playerIds.sort(() => Math.random() - 0.5);

  // Create bracket matches
  const rounds = Math.ceil(Math.log2(shuffled.length));
  const matchesNeeded = Math.pow(2, rounds - 1);

  for (let i = 0; i < matchesNeeded; i++) {
    const player1 = shuffled[i * 2];
    const player2 = shuffled[i * 2 + 1];

    const match = await db.match.create({
      data: {
        tournamentId,
        type: "TOURNAMENT_ROUND",
        status: player1 && player2 ? "WAITING" : "COMPLETED",
      },
    });

    if (player1) {
      await db.matchParticipant.create({ data: { matchId: match.id, userId: player1 } });
    }
    if (player2) {
      await db.matchParticipant.create({ data: { matchId: match.id, userId: player2 } });
    } else if (player1) {
      // Bye — auto-advance
      await db.matchParticipant.update({
        where: { matchId_userId: { matchId: match.id, userId: player1 } },
        data: { isWinner: true },
      });
    }
  }
}

// ─── MATCHMAKING LOGIC ───────────────────────────────────────────────────────

export interface MatchmakingResult {
  matched: boolean;
  matchId?: string;
  opponent?: { id: string; name: string; eloRating: number };
}

export async function createDuelMatch(player1Id: string, player2Id: string, questId?: string): Promise<string> {
  const match = await db.match.create({
    data: {
      type: "DUEL",
      status: "IN_PROGRESS",
      questId,
      startedAt: new Date(),
      participants: {
        create: [
          { userId: player1Id },
          { userId: player2Id },
        ],
      },
    },
  });

  return match.id;
}

export async function submitMatchCode(matchId: string, userId: string, code: string, score: number, timeTaken: number) {
  await db.matchParticipant.update({
    where: { matchId_userId: { matchId, userId } },
    data: { code, score, timeTaken },
  });

  // Check if both players submitted
  const participants = await db.matchParticipant.findMany({ where: { matchId } });
  const allSubmitted = participants.every((p) => p.code !== null);

  if (allSubmitted) {
    await resolveMatch(matchId);
  }
}

// ─── RANKING TIERS ───────────────────────────────────────────────────────────

export type RankTier = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond" | "Master" | "Grandmaster";

export function getRankTier(elo: number): { tier: RankTier; icon: string; color: string } {
  if (elo >= 2400) return { tier: "Grandmaster", icon: "👑", color: "#FF4500" };
  if (elo >= 2000) return { tier: "Master", icon: "💎", color: "#9B59B6" };
  if (elo >= 1600) return { tier: "Diamond", icon: "💠", color: "#3498DB" };
  if (elo >= 1400) return { tier: "Platinum", icon: "⚡", color: "#1ABC9C" };
  if (elo >= 1200) return { tier: "Gold", icon: "🥇", color: "#F1C40F" };
  if (elo >= 1000) return { tier: "Silver", icon: "🥈", color: "#BDC3C7" };
  return { tier: "Bronze", icon: "🥉", color: "#CD7F32" };
}
