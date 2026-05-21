import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { invalidateUserCache } from "@/lib/cache";

const updateSchema = z.object({
  name: z.string().min(2).max(50).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const updated = await db.user.update({
    where: { id: session.user.id },
    data: { ...(parsed.data.name && { name: parsed.data.name }) },
    select: { id: true, name: true },
  });

  await invalidateUserCache(session.user.id);
  return NextResponse.json(updated);
}
