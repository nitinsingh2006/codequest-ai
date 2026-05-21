import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCachedUserStats, cacheUserStats } from "@/lib/cache";
import { getRankTier } from "@/lib/matchmaking";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Try cache
  const cached = await getCachedUserStats(session.user.id);
  if (cached) return NextResponse.json(cached);

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, image: true,
      xp: true, level: true, prestige: true,
      coins: true, gems: true,
      streak: true, longestStreak: true,
      eloRating: true, title: true, role: true,
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const [completedQuests, totalQuests, totalSubmissions] = await Promise.all([
    db.submission.count({ where: { userId: session.user.id, status: "PASSED" } }),
    db.quest.count(),
    db.submission.count({ where: { userId: session.user.id } }),
  ]);

  const stats = {
    ...user,
    completedQuests,
    totalQuests,
    totalSubmissions,
    rank: getRankTier(user.eloRating),
  };

  await cacheUserStats(session.user.id, stats);
  return NextResponse.json(stats);
}
