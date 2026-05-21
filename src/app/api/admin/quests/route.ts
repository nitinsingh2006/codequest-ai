import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission, auditLog } from "@/lib/security";
import { z } from "zod";

async function requireModerator() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!user || !hasPermission(user.role, "moderator")) return null;
  return session.user.id;
}

const questSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  language: z.enum(["PYTHON", "JAVASCRIPT", "HTML_CSS", "C", "CPP", "JAVA", "REACT"]),
  difficulty: z.enum(["BEGINNER", "EASY", "MEDIUM", "HARD", "BOSS"]),
  xpReward: z.number().min(10).max(1000),
  coinReward: z.number().min(0).default(0),
  worldId: z.string(),
  starterCode: z.string(),
  solution: z.string(),
  testCases: z.array(z.object({ input: z.string(), expected: z.string(), hidden: z.boolean().optional() })),
  hints: z.array(z.string()).default([]),
  timeLimit: z.number().nullable().optional(),
  isBoss: z.boolean().default(false),
});

// POST /api/admin/quests — create quest
export async function POST(req: NextRequest) {
  const modId = await requireModerator();
  if (!modId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = questSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { testCases, hints, ...rest } = parsed.data;

  // Get next order number
  const lastQuest = await db.quest.findFirst({ where: { worldId: rest.worldId }, orderBy: { order: "desc" } });
  const order = (lastQuest?.order || 0) + 1;

  const quest = await db.quest.create({
    data: { ...rest, order, testCases, hints },
  });

  await auditLog("quest:create", `quest:${quest.id}`, modId);
  return NextResponse.json(quest, { status: 201 });
}

// GET /api/admin/quests — list all quests with stats
export async function GET(req: NextRequest) {
  const modId = await requireModerator();
  if (!modId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const worldId = searchParams.get("worldId") || undefined;
  const language = searchParams.get("language") || undefined;

  const quests = await db.quest.findMany({
    where: { ...(worldId && { worldId }), ...(language && { language: language as any }) },
    orderBy: [{ worldId: "asc" }, { order: "asc" }],
    include: {
      _count: { select: { submissions: true } },
      world: { select: { name: true } },
    },
  });

  return NextResponse.json(quests);
}
