import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized } from "@/lib/api-utils";

// GET /api/quests - List all quests grouped by world
export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  const worlds = await db.world.findMany({
    orderBy: { order: "asc" },
    include: {
      quests: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          difficulty: true,
          xpReward: true,
          coinReward: true,
          order: true,
        },
      },
    },
  });

  // Get user's completed quests
  const completed = await db.submission.findMany({
    where: { userId: session.user.id, status: "PASSED" },
    select: { questId: true },
    distinct: ["questId"],
  });

  const completedIds = new Set(completed.map((s) => s.questId));

  const data = worlds.map((w) => ({
    ...w,
    quests: w.quests.map((q) => ({ ...q, completed: completedIds.has(q.id) })),
  }));

  return NextResponse.json(data);
}
