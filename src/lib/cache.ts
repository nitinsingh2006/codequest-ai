import Redis from "ioredis";

// ─── REDIS CLIENT ────────────────────────────────────────────────────────────

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let redis: Redis | null = null;
let redisConnected = false;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 500, 3000)),
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    redis.on("connect", () => { redisConnected = true; });
    redis.on("error", () => { redisConnected = false; });
    redis.connect().catch(() => {});
  }
  return redis;
}

function isRedisReady(): boolean {
  return redisConnected && redis?.status === "ready";
}

// ─── CACHE OPERATIONS ────────────────────────────────────────────────────────

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!isRedisReady()) return null;
  try {
    const val = await getRedis().get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  if (!isRedisReady()) return;
  try {
    await getRedis().setex(key, ttlSeconds, JSON.stringify(value));
  } catch {}
}

export async function cacheDel(key: string): Promise<void> {
  if (!isRedisReady()) return;
  try { await getRedis().del(key); } catch {}
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  if (!isRedisReady()) return;
  try {
    const keys = await getRedis().keys(pattern);
    if (keys.length) await getRedis().del(...keys);
  } catch {}
}

// ─── RATE LIMITING (Redis-backed) ────────────────────────────────────────────

export async function rateLimitRedis(
  identifier: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  if (!isRedisReady()) return { allowed: true, remaining: maxRequests, resetIn: 0 };
  try {
    const r = getRedis();
    const key = `rl:${identifier}`;
    const current = await r.incr(key);

    if (current === 1) {
      await r.expire(key, windowSeconds);
    }

    const ttl = await r.ttl(key);

    return {
      allowed: current <= maxRequests,
      remaining: Math.max(0, maxRequests - current),
      resetIn: ttl > 0 ? ttl : windowSeconds,
    };
  } catch {
    return { allowed: true, remaining: maxRequests, resetIn: 0 };
  }
}

// ─── LEADERBOARD CACHE ───────────────────────────────────────────────────────

export async function getLeaderboardCached(limit = 50) {
  return cacheGet<unknown[]>(`leaderboard:top${limit}`);
}

export async function setLeaderboardCache(data: unknown[], limit = 50) {
  await cacheSet(`leaderboard:top${limit}`, data, 60); // 1 min TTL
}

export async function invalidateLeaderboard() {
  await cacheDelPattern("leaderboard:*");
}

// ─── SESSION CACHE ───────────────────────────────────────────────────────────

export async function cacheUserStats(userId: string, stats: unknown) {
  await cacheSet(`user:stats:${userId}`, stats, 120); // 2 min
}

export async function getCachedUserStats(userId: string) {
  return cacheGet(`user:stats:${userId}`);
}

export async function invalidateUserCache(userId: string) {
  await cacheDelPattern(`user:*:${userId}`);
}

// ─── MATCHMAKING QUEUE (Redis-backed for multi-instance) ─────────────────────

export async function addToMatchQueue(userId: string, eloRating: number) {
  const r = getRedis();
  await r.zadd("matchmaking:queue", eloRating, JSON.stringify({ userId, eloRating, joinedAt: Date.now() }));
}

export async function removeFromMatchQueue(userId: string) {
  const r = getRedis();
  const members = await r.zrange("matchmaking:queue", 0, -1);
  for (const m of members) {
    if (JSON.parse(m).userId === userId) {
      await r.zrem("matchmaking:queue", m);
      break;
    }
  }
}

export async function findMatchInQueue(eloRating: number, range: number): Promise<{ userId: string; eloRating: number } | null> {
  const r = getRedis();
  const candidates = await r.zrangebyscore("matchmaking:queue", eloRating - range, eloRating + range);
  if (!candidates.length) return null;
  const match = JSON.parse(candidates[0]);
  await r.zrem("matchmaking:queue", candidates[0]);
  return match;
}

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────

export async function redisHealthCheck(): Promise<boolean> {
  try {
    const pong = await getRedis().ping();
    return pong === "PONG";
  } catch {
    return false;
  }
}
