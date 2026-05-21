import { db } from "@/lib/db";

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const MODEL = process.env.OLLAMA_MODEL || "deepseek-coder:6.7b";

// ─── CORE OLLAMA CLIENT ──────────────────────────────────────────────────────

export async function queryOllama(prompt: string, maxTokens = 1024): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const res = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        prompt,
        stream: false,
        options: { temperature: 0.7, num_predict: maxTokens, top_p: 0.9 },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Ollama ${res.status}`);
    const data = await res.json();
    const output = data.response || data.thinking || "";
    return output.trim() || "I couldn't generate a response. Try again.";
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "unknown";
    if (msg.includes("abort")) return "AI response timed out. The model may be loading — try again in a moment.";
    return "AI mentor is offline. Check if Ollama is running (`ollama serve`).";
  }
}

// ─── VECTOR MEMORY SYSTEM ────────────────────────────────────────────────────

// Simple cosine similarity for local vector search
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) + 1e-8);
}

// Generate simple embedding via Ollama embeddings endpoint
export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, prompt: text }),
    });
    if (!res.ok) return hashEmbedding(text); // fallback
    const data = await res.json();
    return data.embedding;
  } catch {
    return hashEmbedding(text);
  }
}

// Deterministic fallback embedding when Ollama embeddings unavailable
function hashEmbedding(text: string): number[] {
  const dim = 64;
  const emb = new Array(dim).fill(0);
  for (let i = 0; i < text.length; i++) {
    emb[i % dim] += text.charCodeAt(i) / 255;
  }
  const mag = Math.sqrt(emb.reduce((s, v) => s + v * v, 0));
  return emb.map((v) => v / (mag + 1e-8));
}

// ─── ADAPTIVE LEARNING ENGINE ────────────────────────────────────────────────

export async function updateMemory(userId: string, concept: string, success: boolean) {
  const embedding = await getEmbedding(concept);

  await db.aIMemory.upsert({
    where: { userId_concept: { userId, concept } },
    update: {
      strength: success
        ? { increment: 0.1 }
        : { decrement: 0.15 },
      mistakes: success ? undefined : { increment: 1 },
      successes: success ? { increment: 1 } : undefined,
      lastSeen: new Date(),
      embedding,
    },
    create: {
      userId,
      concept,
      strength: success ? 0.6 : 0.35,
      mistakes: success ? 0 : 1,
      successes: success ? 1 : 0,
      embedding,
    },
  });
}

export async function getWeakConcepts(userId: string, limit = 5) {
  return db.aIMemory.findMany({
    where: { userId, strength: { lt: 0.5 } },
    orderBy: { strength: "asc" },
    take: limit,
  });
}

export async function findSimilarConcepts(userId: string, query: string, limit = 3) {
  const queryEmb = await getEmbedding(query);
  const memories = await db.aIMemory.findMany({ where: { userId } });

  return memories
    .map((m) => ({ ...m, similarity: cosineSimilarity(queryEmb, m.embedding) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

// ─── DIFFICULTY ADJUSTMENT ───────────────────────────────────────────────────

export async function getDifficultyLevel(userId: string): Promise<"easier" | "normal" | "harder"> {
  const recent = await db.submission.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { status: true },
  });

  if (recent.length < 3) return "normal";

  const passRate = recent.filter((s) => s.status === "PASSED").length / recent.length;

  if (passRate > 0.8) return "harder";
  if (passRate < 0.4) return "easier";
  return "normal";
}

// ─── PROGRESSIVE HINT SYSTEM ─────────────────────────────────────────────────

export async function getProgressiveHint(
  userId: string,
  questId: string,
  code: string,
  questTitle: string,
  questDescription: string,
  attemptCount: number
): Promise<string> {
  const weakConcepts = await getWeakConcepts(userId, 3);
  const weakStr = weakConcepts.map((c) => c.concept).join(", ");
  const difficulty = await getDifficultyLevel(userId);

  let hintLevel: string;
  if (attemptCount <= 1) hintLevel = "Give ONLY a directional nudge. No code. One sentence max.";
  else if (attemptCount <= 3) hintLevel = "Name the concept needed. Give a tiny pseudocode hint. No full solution.";
  else hintLevel = "Show a small code example (NOT the solution). Explain the pattern.";

  const prompt = `You are CodeQuest AI — an elite coding mentor inside a gaming universe. You're encouraging, concise, and never give away full solutions.

STUDENT PROFILE:
- Skill level: ${difficulty === "easier" ? "beginner (struggling)" : difficulty === "harder" ? "advanced" : "intermediate"}
- Weak areas: ${weakStr || "still assessing"}
- Attempt #${attemptCount} on this quest

QUEST: "${questTitle}"
DESCRIPTION: ${questDescription}

STUDENT'S CODE:
\`\`\`
${code.slice(0, 500)}
\`\`\`

INSTRUCTIONS: ${hintLevel}

RULES:
- Max 2-3 sentences
- Be encouraging ("You're close!" / "Good thinking!")
- Use simple language
- If their code is empty, suggest where to start
- Never reveal the full solution
- Mix Hindi+English naturally (Hinglish) if the student seems Indian`;

  return queryOllama(prompt, 300);
}

// ─── PROMPT BUILDERS ─────────────────────────────────────────────────────────

export function buildBugExplanationPrompt(code: string, error: string, language: string): string {
  return `You are CodeQuest AI — an elite debugging mentor. Explain errors simply and helpfully.

LANGUAGE: ${language}
CODE:
\`\`\`${language}
${code.slice(0, 800)}
\`\`\`

ERROR: ${error.slice(0, 300)}

RESPOND WITH:
1. What went wrong (1 sentence, simple language)
2. How to fix it (1 sentence with the fix)
3. A quick tip to avoid this in future (1 sentence)

Keep it under 4 lines total. Be encouraging.`;
}

export function buildCodeReviewPrompt(code: string, language: string): string {
  return `You are CodeQuest AI — a senior code reviewer. Give brief, actionable feedback.

LANGUAGE: ${language}
CODE:
\`\`\`${language}
${code.slice(0, 800)}
\`\`\`

Give exactly:
- 1 thing they did well (praise)
- 1-2 specific improvements (with brief code example if helpful)

Max 5 lines. Be constructive and encouraging.`;
}
