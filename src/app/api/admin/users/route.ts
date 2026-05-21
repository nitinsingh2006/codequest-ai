import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission, auditLog } from "@/lib/security";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!user || !hasPermission(user.role, "admin")) return null;
  return session.user.id;
}

// GET /api/admin/users — list users with pagination
export async function GET(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || undefined;

  const where = {
    ...(search && { OR: [{ name: { contains: search } }, { email: { contains: search } }] }),
    ...(role && { role: role as any }),
  };

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, role: true, level: true, xp: true, eloRating: true, createdAt: true, lastActiveAt: true, streak: true },
    }),
    db.user.count({ where }),
  ]);

  return NextResponse.json({ users, total, page, totalPages: Math.ceil(total / limit) });
}

// PATCH /api/admin/users — update user role/ban
const updateSchema = z.object({
  userId: z.string(),
  action: z.enum(["promote", "demote", "ban", "unban", "resetXP"]),
});

export async function PATCH(req: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { userId, action } = parsed.data;

  switch (action) {
    case "promote":
      await db.user.update({ where: { id: userId }, data: { role: "MODERATOR" } });
      break;
    case "demote":
      await db.user.update({ where: { id: userId }, data: { role: "STUDENT" } });
      break;
    case "resetXP":
      await db.user.update({ where: { id: userId }, data: { xp: 0, level: 1 } });
      break;
  }

  await auditLog(`admin:${action}`, `user:${userId}`, adminId);
  return NextResponse.json({ success: true });
}
