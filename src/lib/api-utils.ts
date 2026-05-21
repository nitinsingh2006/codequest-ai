import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function getSession() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session;
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
