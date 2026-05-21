import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission, auditLog } from "@/lib/security";

// ─── ADMIN MIDDLEWARE ────────────────────────────────────────────────────────

async function requireAdmin(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 };

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!user || !hasPermission(user.role, "admin")) return { error: "Forbidden", status: 403 };

  return { userId: session.user.id };
}

// ─── GET /api/admin/stats ────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if ("error" in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  const [totalUsers, totalQuests, totalSubmissions, activeToday, passRate] = await Promise.all([
    db.user.count(),
    db.quest.count(),
    db.submission.count(),
    db.user.count({ where: { lastActiveAt: { gte: new Date(Date.now() - 86400000) } } }),
    db.submission.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const passed = passRate.find((p) => p.status === "PASSED")?._count || 0;
  const total = passRate.reduce((sum, p) => sum + p._count, 0);

  // Recent signups
  const recentUsers = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, name: true, email: true, createdAt: true, level: true, xp: true },
  });

  // AI usage
  const aiUsage = await db.aIHistory.count({ where: { createdAt: { gte: new Date(Date.now() - 86400000) } } });

  return NextResponse.json({
    overview: {
      totalUsers,
      totalQuests,
      totalSubmissions,
      activeToday,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      aiUsageToday: aiUsage,
    },
    recentUsers,
  });
}
