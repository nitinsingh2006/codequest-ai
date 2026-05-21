import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession, unauthorized } from "@/lib/api-utils";

// GET /api/quests/[id] - Get single quest with starter code
export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return unauthorized();

  const quest = await db.quest.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      description: true,
      language: true,
      difficulty: true,
      xpReward: true,
      coinReward: true,
      starterCode: true,
      testCases: true,
      hints: true,
    },
  });

  if (!quest) {
    return NextResponse.json({ error: "Quest not found" }, { status: 404 });
  }

  return NextResponse.json(quest);
}
