import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimitRedis } from "@/lib/cache";
import { rateLimit } from "@/lib/security";

// ─── REQUEST VALIDATION ──────────────────────────────────────────────────────

export async function validateRequest<T>(
  req: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      return { error: NextResponse.json({ error: "Validation failed", details: result.error.flatten() }, { status: 400 }) };
    }
    return { data: result.data };
  } catch {
    return { error: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }) };
  }
}

// ─── AUTH HELPER ─────────────────────────────────────────────────────────────

export async function requireAuth(): Promise<{ userId: string } | { error: NextResponse }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { userId: session.user.id };
}

// ─── RATE LIMIT HELPER ───────────────────────────────────────────────────────

export async function checkRateLimit(
  req: NextRequest,
  maxRequests = 60,
  windowSeconds = 60
): Promise<{ error: NextResponse } | null> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const key = `${ip}:${req.nextUrl.pathname}`;

  // Try Redis first, fallback to in-memory
  const result = await rateLimitRedis(key, maxRequests, windowSeconds);

  if (!result.allowed) {
    return {
      error: NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": String(result.resetIn), "X-RateLimit-Remaining": "0" } }
      ),
    };
  }

  return null;
}

// ─── COMMON SCHEMAS ──────────────────────────────────────────────────────────

export const schemas = {
  submission: z.object({
    questId: z.string().min(1),
    code: z.string().min(1).max(50000),
    passed: z.boolean(),
    timeTaken: z.number().min(0).max(86400),
  }),

  aiRequest: z.object({
    type: z.enum(["hint", "bug_explanation", "code_review", "pair_program", "interview", "roadmap"]),
    code: z.string().max(50000).optional(),
    questId: z.string().optional(),
    error: z.string().max(5000).optional(),
    language: z.string().optional(),
    topic: z.string().max(200).optional(),
  }),

  codeExecution: z.object({
    code: z.string().min(1).max(50000),
    language: z.enum(["PYTHON", "JAVASCRIPT", "HTML_CSS", "C", "CPP", "JAVA", "REACT"]),
    stdin: z.string().max(10000).default(""),
  }),

  matchAction: z.object({
    matchId: z.string(),
    code: z.string().max(50000).optional(),
    score: z.number().min(0).optional(),
    timeTaken: z.number().min(0).optional(),
  }),
};
