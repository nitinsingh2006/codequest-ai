import { NextRequest, NextResponse } from "next/server";
import { requireAuth, validateRequest, checkRateLimit, schemas } from "@/lib/api-validation";
import { executeCode, validateCode, runTestCases, TestCase } from "@/lib/execution-engine";
import { trackEvent } from "@/lib/analytics";

// POST /api/execute — run code against test cases or freeform
export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(req, 20, 60); // 20 executions/min
  if (rl) return rl.error;

  const authResult = await requireAuth();
  if ("error" in authResult) return authResult.error;
  const { userId } = authResult;

  const validation = await validateRequest(req, schemas.codeExecution);
  if ("error" in validation) return validation.error;
  const { code, language, stdin } = validation.data;

  // Validate code safety
  const safety = validateCode(code, language);
  if (!safety.valid) return NextResponse.json({ error: safety.error }, { status: 400 });

  const result = await executeCode(code, language, stdin);

  await trackEvent("code_executed", userId, { language }).catch(() => {});

  return NextResponse.json({
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
    executionTime: result.executionTime,
    timedOut: result.timedOut,
  });
}
