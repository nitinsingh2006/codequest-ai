import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRateLimit } from "@/lib/api-validation";
import { generateAndSaveQuest, getRecommendedQuests, getWorldProgress } from "@/lib/quest-engine";
import { Language } from "@prisma/client";

// GET /api/quests/generate — get recommended or generate new quest
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;
  const { userId } = authResult;

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "recommend";

  if (action === "worlds") {
    const progress = await getWorldProgress(userId);
    return NextResponse.json(progress);
  }

  const recommended = await getRecommendedQuests(userId, 5);
  return NextResponse.json(recommended);
}

// POST /api/quests/generate — generate adaptive quest via AI
export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(req, 5, 300); // 5 generations per 5 min
  if (rl) return rl.error;

  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;
  const { userId } = authResult;

  const { language, worldId } = await req.json();
  if (!language || !worldId) return NextResponse.json({ error: "Missing language or worldId" }, { status: 400 });

  const quest = await generateAndSaveQuest(userId, language as Language, worldId);
  return NextResponse.json(quest, { status: 201 });
}
