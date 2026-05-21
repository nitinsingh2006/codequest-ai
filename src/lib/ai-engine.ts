import { Language, Difficulty } from "@prisma/client";
import { db } from "@/lib/db";
import { queryOllama, getWeakConcepts, getDifficultyLevel, getEmbedding } from "@/lib/ai";
import { LANGUAGES, DIFFICULTY_CONFIG } from "@/lib/languages";

// ─── AI QUEST GENERATOR ──────────────────────────────────────────────────────

export interface GeneratedQuest {
  title: string;
  description: string;
  starterCode: string;
  solution: string;
  testCases: { input: string; expected: string; hidden?: boolean }[];
  hints: string[];
  difficulty: Difficulty;
  language: Language;
  xpReward: number;
  concepts: string[];
}

export async function generateAdaptiveQuest(userId: string, language: Language): Promise<GeneratedQuest> {
  const weakConcepts = await getWeakConcepts(userId, 5);
  const difficulty = await getDifficultyLevel(userId);
  const langConfig = LANGUAGES[language];

  const targetDifficulty: Difficulty = difficulty === "easier" ? "EASY" : difficulty === "harder" ? "HARD" : "MEDIUM";
  const config = DIFFICULTY_CONFIG[targetDifficulty];

  const weakTopics = weakConcepts.map((c) => c.concept).join(", ") || "general fundamentals";

  const prompt = `Generate a coding challenge in ${langConfig.name}.
Target difficulty: ${targetDifficulty}
Focus on these weak areas: ${weakTopics}

Respond in EXACTLY this JSON format (no markdown, no explanation):
{
  "title": "short creative title",
  "description": "clear problem description (2-3 sentences)",
  "starterCode": "starter code with function signature",
  "solution": "complete working solution",
  "testCases": [{"input": "test input", "expected": "expected output"}, {"input": "test2", "expected": "output2"}],
  "hints": ["hint1", "hint2"],
  "concepts": ["concept1", "concept2"]
}`;

  const response = await queryOllama(prompt, 2048);

  try {
    const parsed = JSON.parse(response.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
    return {
      ...parsed,
      difficulty: targetDifficulty,
      language,
      xpReward: config.xpBase,
    };
  } catch {
    // Fallback quest if AI fails to generate valid JSON
    return {
      title: `${langConfig.name} Practice`,
      description: `Write a function that solves the given problem in ${langConfig.name}.`,
      starterCode: langConfig.starterTemplate,
      solution: langConfig.helloWorld,
      testCases: [{ input: "", expected: "Hello, World!" }],
      hints: ["Think about the basic syntax", "Check your output format"],
      difficulty: targetDifficulty,
      language,
      xpReward: config.xpBase,
      concepts: ["basics"],
    };
  }
}

// ─── AI CODE REVIEW ENGINE ───────────────────────────────────────────────────

export interface CodeReviewResult {
  score: number; // 0-100
  issues: { severity: "info" | "warning" | "error"; message: string; line?: number }[];
  suggestions: string[];
  praise: string;
}

export async function reviewCode(code: string, language: Language): Promise<CodeReviewResult> {
  const prompt = `Review this ${LANGUAGES[language].name} code. Rate it 0-100 and provide feedback.

\`\`\`${LANGUAGES[language].monacoId}
${code}
\`\`\`

Respond in JSON format:
{"score": 75, "issues": [{"severity": "warning", "message": "issue description"}], "suggestions": ["suggestion1"], "praise": "what they did well"}`;

  const response = await queryOllama(prompt, 1024);

  try {
    return JSON.parse(response.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
  } catch {
    return { score: 70, issues: [], suggestions: ["Keep practicing!"], praise: "Good effort!" };
  }
}

// ─── AI INTERVIEW MODE ───────────────────────────────────────────────────────

export interface InterviewQuestion {
  question: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  followUp: string;
  expectedApproach: string;
}

export async function generateInterviewQuestion(
  topic: string,
  difficulty: "easy" | "medium" | "hard",
  language: Language
): Promise<InterviewQuestion> {
  const prompt = `Generate a ${difficulty} coding interview question about "${topic}" for ${LANGUAGES[language].name}.

Respond in JSON:
{"question": "the question", "difficulty": "${difficulty}", "topic": "${topic}", "followUp": "a follow-up question", "expectedApproach": "brief expected approach"}`;

  const response = await queryOllama(prompt, 1024);

  try {
    return JSON.parse(response.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
  } catch {
    return {
      question: `Implement a solution for a ${topic} problem in ${LANGUAGES[language].name}.`,
      difficulty,
      topic,
      followUp: "What is the time complexity?",
      expectedApproach: "Use appropriate data structures and algorithms.",
    };
  }
}

// ─── AI PAIR PROGRAMMER ──────────────────────────────────────────────────────

export async function pairProgrammerSuggest(
  code: string,
  cursorLine: number,
  language: Language,
  context: string
): Promise<string> {
  const lines = code.split("\n");
  const surroundingCode = lines.slice(Math.max(0, cursorLine - 5), cursorLine + 5).join("\n");

  const prompt = `You are a pair programmer. The developer is writing ${LANGUAGES[language].name} code.
Context: ${context}
Current code around cursor (line ${cursorLine}):
\`\`\`
${surroundingCode}
\`\`\`

Suggest the next 1-3 lines of code. Only output the code, no explanation.`;

  return queryOllama(prompt, 256);
}

// ─── AI DEBUGGING ASSISTANT ──────────────────────────────────────────────────

export async function debugCode(
  code: string,
  error: string,
  language: Language
): Promise<{ explanation: string; fix: string; concept: string }> {
  const prompt = `Debug this ${LANGUAGES[language].name} code.

Code:
\`\`\`
${code}
\`\`\`

Error: ${error}

Respond in JSON: {"explanation": "what went wrong (1-2 sentences)", "fix": "corrected code snippet", "concept": "the concept they need to learn"}`;

  const response = await queryOllama(prompt, 1024);

  try {
    return JSON.parse(response.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
  } catch {
    return { explanation: "There seems to be a syntax or logic error.", fix: code, concept: "debugging" };
  }
}

// ─── AI ROADMAP GENERATOR ────────────────────────────────────────────────────

export async function generatePersonalizedRoadmap(userId: string): Promise<{
  currentLevel: string;
  nextSteps: { topic: string; reason: string; priority: "high" | "medium" | "low" }[];
  estimatedWeeks: number;
}> {
  const weakConcepts = await getWeakConcepts(userId, 10);
  const submissions = await db.submission.findMany({
    where: { userId },
    include: { quest: { select: { language: true, difficulty: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const languages = Array.from(new Set(submissions.map((s) => s.quest.language)));
  const passRate = submissions.filter((s) => s.status === "PASSED").length / Math.max(submissions.length, 1);

  const prompt = `Based on this student profile, generate a personalized learning roadmap.

Languages used: ${languages.join(", ")}
Pass rate: ${Math.round(passRate * 100)}%
Weak areas: ${weakConcepts.map((c) => `${c.concept} (strength: ${c.strength.toFixed(2)})`).join(", ")}

Respond in JSON:
{"currentLevel": "beginner/intermediate/advanced", "nextSteps": [{"topic": "topic", "reason": "why", "priority": "high"}], "estimatedWeeks": 4}`;

  const response = await queryOllama(prompt, 1024);

  try {
    return JSON.parse(response.replace(/```json?\n?/g, "").replace(/```/g, "").trim());
  } catch {
    return {
      currentLevel: passRate > 0.7 ? "intermediate" : "beginner",
      nextSteps: weakConcepts.slice(0, 5).map((c) => ({
        topic: c.concept,
        reason: `Strength is only ${Math.round(c.strength * 100)}%`,
        priority: c.strength < 0.3 ? "high" as const : "medium" as const,
      })),
      estimatedWeeks: 4,
    };
  }
}

// ─── AI MEMORY: TRACK LEARNING PROGRESS ──────────────────────────────────────

export async function recordLearningEvent(
  userId: string,
  questId: string,
  concepts: string[],
  passed: boolean
) {
  for (const concept of concepts) {
    const embedding = await getEmbedding(concept);
    await db.aIMemory.upsert({
      where: { userId_concept: { userId, concept } },
      update: {
        strength: passed ? { increment: 0.08 } : { decrement: 0.12 },
        mistakes: passed ? undefined : { increment: 1 },
        successes: passed ? { increment: 1 } : undefined,
        lastSeen: new Date(),
        embedding,
      },
      create: { userId, concept, strength: passed ? 0.55 : 0.3, embedding },
    });
  }

  // Log to AI history
  await db.aIHistory.create({
    data: {
      userId,
      questId,
      prompt: `Learning event: ${concepts.join(", ")}`,
      response: passed ? "Passed" : "Failed",
      type: "RECOMMENDATION",
    },
  });
}
