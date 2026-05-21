import { NextRequest, NextResponse } from "next/server";
import { requireAuth, checkRateLimit } from "@/lib/api-validation";
import { db } from "@/lib/db";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(3).max(30),
  tag: z.string().min(2).max(5).toUpperCase(),
  description: z.string().max(200).optional(),
});

// GET /api/clans — list clans or get user's clan
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;
  const { userId } = authResult;

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  if (action === "mine") {
    const membership = await db.clanMember.findUnique({
      where: { userId },
      include: { clan: { include: { members: { include: { user: { select: { id: true, name: true, level: true, xp: true } } } } } } },
    });
    return NextResponse.json(membership);
  }

  // List top clans
  const clans = await db.clan.findMany({
    orderBy: { totalXp: "desc" },
    take: 20,
    include: { _count: { select: { members: true } } },
  });

  return NextResponse.json(clans);
}

// POST /api/clans — create or join clan
export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(req, 5, 60);
  if (rl) return rl.error;

  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;
  const { userId } = authResult;

  const body = await req.json();
  const action = body.action;

  // Check if already in a clan
  const existing = await db.clanMember.findUnique({ where: { userId } });

  if (action === "create") {
    if (existing) return NextResponse.json({ error: "Already in a clan" }, { status: 400 });

    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

    const clan = await db.clan.create({
      data: {
        name: parsed.data.name,
        tag: parsed.data.tag,
        description: parsed.data.description,
        members: { create: { userId, role: "LEADER" } },
      },
    });

    return NextResponse.json(clan, { status: 201 });
  }

  if (action === "join") {
    if (existing) return NextResponse.json({ error: "Already in a clan" }, { status: 400 });

    const clanId = body.clanId;
    if (!clanId) return NextResponse.json({ error: "clanId required" }, { status: 400 });

    const clan = await db.clan.findUnique({ where: { id: clanId }, include: { _count: { select: { members: true } } } });
    if (!clan) return NextResponse.json({ error: "Clan not found" }, { status: 404 });
    if (clan._count.members >= clan.maxMembers) return NextResponse.json({ error: "Clan is full" }, { status: 400 });

    await db.clanMember.create({ data: { userId, clanId } });
    return NextResponse.json({ joined: true });
  }

  if (action === "leave") {
    if (!existing) return NextResponse.json({ error: "Not in a clan" }, { status: 400 });
    if (existing.role === "LEADER") {
      // Transfer leadership or disband
      const otherMembers = await db.clanMember.findMany({ where: { clanId: existing.clanId, userId: { not: userId } } });
      if (otherMembers.length > 0) {
        await db.clanMember.update({ where: { id: otherMembers[0].id }, data: { role: "LEADER" } });
      } else {
        await db.clan.delete({ where: { id: existing.clanId } });
        return NextResponse.json({ left: true, disbanded: true });
      }
    }
    await db.clanMember.delete({ where: { userId } });
    return NextResponse.json({ left: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
