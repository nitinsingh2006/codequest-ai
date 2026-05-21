import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasPermission } from "@/lib/security";
import { getDailyActiveUsers, getRetentionMetrics, getQuestCompletionStats, getLanguagePopularity } from "@/lib/analytics";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (!user || !hasPermission(user.role, "admin")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const metric = searchParams.get("metric") || "overview";

  switch (metric) {
    case "dau":
      return NextResponse.json(await getDailyActiveUsers(30));
    case "retention":
      return NextResponse.json(await getRetentionMetrics());
    case "quests":
      return NextResponse.json(await getQuestCompletionStats());
    case "languages":
      return NextResponse.json(await getLanguagePopularity());
    default:
      const [retention, languages] = await Promise.all([getRetentionMetrics(), getLanguagePopularity()]);
      return NextResponse.json({ retention, languages });
  }
}
