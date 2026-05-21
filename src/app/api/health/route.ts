import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redisHealthCheck } from "@/lib/cache";

export async function GET() {
  const checks: Record<string, { status: "ok" | "error"; latency?: number }> = {};

  // Database
  const dbStart = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = { status: "ok", latency: Date.now() - dbStart };
  } catch {
    checks.database = { status: "error" };
  }

  // Redis
  const redisStart = Date.now();
  const redisOk = await redisHealthCheck();
  checks.redis = { status: redisOk ? "ok" : "error", latency: Date.now() - redisStart };

  // Ollama
  const ollamaStart = Date.now();
  try {
    const res = await fetch(`${process.env.OLLAMA_URL || "http://localhost:11434"}/api/tags`, { signal: AbortSignal.timeout(3000) });
    checks.ollama = { status: res.ok ? "ok" : "error", latency: Date.now() - ollamaStart };
  } catch {
    checks.ollama = { status: "error" };
  }

  const allHealthy = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json(
    { status: allHealthy ? "healthy" : "degraded", checks, timestamp: new Date().toISOString() },
    { status: allHealthy ? 200 : 503 }
  );
}
