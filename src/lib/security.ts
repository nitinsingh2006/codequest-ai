import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/api-utils";

// ─── RATE LIMITER (in-memory, swap to Redis in production) ───────────────────

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000");
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100");

export function rateLimit(identifier: string, maxReqs = MAX_REQUESTS): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: maxReqs - 1 };
  }

  entry.count++;
  if (entry.count > maxReqs) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: maxReqs - entry.count };
}

export function rateLimitResponse() {
  return NextResponse.json(
    { error: "Too many requests. Please slow down." },
    { status: 429, headers: { "Retry-After": "60" } }
  );
}

// ─── BRUTE-FORCE PROTECTION ──────────────────────────────────────────────────

const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export function checkLoginAttempt(identifier: string): { allowed: boolean; remainingAttempts: number; lockedUntil?: number } {
  const now = Date.now();
  const entry = loginAttempts.get(identifier);

  if (!entry) return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS };

  if (entry.lockedUntil > now) {
    return { allowed: false, remainingAttempts: 0, lockedUntil: entry.lockedUntil };
  }

  // Reset if lockout expired
  if (entry.lockedUntil > 0 && entry.lockedUntil <= now) {
    loginAttempts.delete(identifier);
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS };
  }

  return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS - entry.count };
}

export function recordFailedLogin(identifier: string): void {
  const entry = loginAttempts.get(identifier) || { count: 0, lockedUntil: 0 };
  entry.count++;

  if (entry.count >= MAX_LOGIN_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION;
  }

  loginAttempts.set(identifier, entry);
}

export function clearLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier);
}

// ─── SECURITY HEADERS ────────────────────────────────────────────────────────

export const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' http://localhost:* ws://localhost:*;",
};

// ─── INPUT SANITIZATION ──────────────────────────────────────────────────────

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Strip HTML tags
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim();
}

// ─── RBAC ────────────────────────────────────────────────────────────────────

type Permission = "admin" | "moderator" | "student";

const rolePermissions: Record<string, Permission[]> = {
  ADMIN: ["admin", "moderator", "student"],
  MODERATOR: ["moderator", "student"],
  STUDENT: ["student"],
};

export function hasPermission(userRole: string, required: Permission): boolean {
  return rolePermissions[userRole]?.includes(required) ?? false;
}

// ─── AUDIT LOGGING ───────────────────────────────────────────────────────────

export async function auditLog(action: string, resource: string, userId?: string, details?: object, ip?: string) {
  await db.auditLog.create({
    data: { action, resource, userId, details: details as any, ip },
  });
}

// ─── ANTI-CHEAT: CODE EXECUTION SANDBOX RULES ────────────────────────────────

const BANNED_PATTERNS = [
  /import\s+os/,
  /import\s+subprocess/,
  /import\s+sys/,
  /exec\s*\(/,
  /eval\s*\(/,
  /__import__/,
  /open\s*\(/,
  /import\s+socket/,
  /import\s+requests/,
];

export function validateCodeSafety(code: string): { safe: boolean; reason?: string } {
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(code)) {
      return { safe: false, reason: `Blocked: ${pattern.source} is not allowed in sandbox` };
    }
  }

  // Max code length
  if (code.length > 10000) {
    return { safe: false, reason: "Code exceeds maximum length (10KB)" };
  }

  return { safe: true };
}

// ─── SUBMISSION ANTI-CHEAT ───────────────────────────────────────────────────

export async function detectCheating(userId: string, questId: string): Promise<boolean> {
  // Check for impossibly fast submissions
  const recentSubmissions = await db.submission.findMany({
    where: { userId, questId, createdAt: { gte: new Date(Date.now() - 5000) } },
  });

  // More than 3 submissions in 5 seconds = suspicious
  return recentSubmissions.length > 3;
}
