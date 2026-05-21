import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getLeaderboardCached, setLeaderboardCache } from "@/lib/cache";
import { getRankTier } from "@/lib/matchmaking";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "xp"; // xp | elo | streak
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  // Try cache first
  const cacheKey = `${type}:${limit}`;
  const cached = await getLeaderboardCached(limit);
  if (cached) return NextResponse.json(cached);

  let orderBy: Record<string, string>;
  switch (type) {
    case "elo": orderBy = { eloRating: "desc" }; break;
    case "streak": orderBy = { streak: "desc" }; break;
    default: orderBy = { xp: "desc" };
  }

  const users = await db.user.findMany({
    orderBy,
    take: limit,
    select: {
      id: true,
      name: true,
      image: true,
      xp: true,
      level: true,
      prestige: true,
      eloRating: true,
      streak: true,
      title: true,
    },
  });

  const leaderboard = users.map((u, i) => ({
    rank: i + 1,
    ...u,
    tier: getRankTier(u.eloRating),
  }));

  // Cache for 60 seconds
  await setLeaderboardCache(leaderboard, limit);

  return NextResponse.json(leaderboard);
}
