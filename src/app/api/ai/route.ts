import { NextRequest, NextResponse } from "next/server";
import { requireAuth, validateRequest, checkRateLimit, schemas } from "@/lib/api-validation";
import { queryOllama, getProgressiveHint, buildBugExplanationPrompt, buildCodeReviewPrompt } from "@/lib/ai";
import { reviewCode, generateInterviewQuestion, pairProgrammerSuggest, debugCode, generatePersonalizedRoadmap } from "@/lib/ai-engine";
import { db } from "@/lib/db";
import { trackEvent } from "@/lib/analytics";
import { Language } from "@prisma/client";

export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(req, 20, 60); // 20 AI requests/min
  if (rl) return rl.error;

  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;
  const { userId } = authResult;

  const validation = await validateRequest(req, schemas.aiRequest);
  if ("error" in validation) return validation.error;
  const { type, code, questId, error, language, topic } = validation.data;

  let response = "";
  const lang = (language?.toUpperCase() || "PYTHON") as Language;

  switch (type) {
    case "hint": {
      if (!questId || !code) return NextResponse.json({ error: "Missing questId or code" }, { status: 400 });
      const quest = await db.quest.findUnique({ where: { id: questId } });
      if (!quest) return NextResponse.json({ error: "Quest not found" }, { status: 404 });

      const attempts = await db.submission.count({ where: { userId, questId } });
      response = await getProgressiveHint(userId, questId, code, quest.title, quest.description, attempts + 1);
      await trackEvent("ai_hint_used", userId, { questId });
      break;
    }

    case "bug_explanation": {
      if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });
      const result = await debugCode(code, error || "Unknown error", lang);
      response = `${result.explanation}\n\nFix:\n${result.fix}\n\nConcept to learn: ${result.concept}`;
      break;
    }

    case "code_review": {
      if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });
      const review = await reviewCode(code, lang);
      response = `Score: ${review.score}/100\n\n${review.praise}\n\n${review.suggestions.map((s) => `• ${s}`).join("\n")}`;
      if (review.issues.length) {
        response += `\n\nIssues:\n${review.issues.map((i) => `[${i.severity}] ${i.message}`).join("\n")}`;
      }
      await trackEvent("ai_review_used", userId);
      break;
    }

    case "pair_program": {
      if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });
      response = await pairProgrammerSuggest(code, 0, lang, topic || "general coding");
      break;
    }

    case "interview": {
      const question = await generateInterviewQuestion(topic || "arrays", "medium", lang);
      response = JSON.stringify(question);
      break;
    }

    case "roadmap": {
      const roadmap = await generatePersonalizedRoadmap(userId);
      response = JSON.stringify(roadmap);
      break;
    }

    default:
      return NextResponse.json({ error: "Unknown AI type" }, { status: 400 });
  }

  // Save to history
  await db.aIHistory.create({
    data: { userId, questId, prompt: `${type}: ${(code || "").slice(0, 200)}`, response: response.slice(0, 2000), type: mapAIType(type) },
  });

  return NextResponse.json({ response, type });
}

function mapAIType(type: string) {
  const map: Record<string, any> = {
    hint: "HINT",
    bug_explanation: "BUG_EXPLANATION",
    code_review: "CODE_REVIEW",
    pair_program: "RECOMMENDATION",
    interview: "ADAPTIVE_QUEST",
    roadmap: "RECOMMENDATION",
  };
  return map[type] || "RECOMMENDATION";
}
