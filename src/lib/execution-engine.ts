import { Language } from "@prisma/client";

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number; // ms
  memoryUsed?: number; // bytes
  timedOut: boolean;
}

export interface TestCaseResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  executionTime: number;
  hidden: boolean;
}

export interface SubmissionResult {
  status: "PASSED" | "FAILED" | "ERROR" | "TIMEOUT";
  testResults: TestCaseResult[];
  totalTime: number;
  passedCount: number;
  totalCount: number;
  output: string;
}

export interface TestCase {
  input: string;
  expected: string;
  hidden?: boolean;
}

// ─── EXECUTION STRATEGY ──────────────────────────────────────────────────────

type ExecutionStrategy = "browser" | "judge0";

const JUDGE0_URL = process.env.JUDGE0_URL || "http://localhost:2358";
const JUDGE0_KEY = process.env.JUDGE0_API_KEY || "";
const EXECUTION_TIMEOUT = parseInt(process.env.EXECUTION_TIMEOUT_MS || "10000");
const MAX_CODE_SIZE = 50000; // 50KB

// Judge0 language IDs
const JUDGE0_LANG_IDS: Partial<Record<Language, number>> = {
  PYTHON: 71,
  JAVASCRIPT: 63,
  C: 50,
  CPP: 54,
  JAVA: 62,
};

function getStrategy(language: Language): ExecutionStrategy {
  if (language === "PYTHON" || language === "JAVASCRIPT" || language === "HTML_CSS" || language === "REACT") {
    return "browser";
  }
  return "judge0";
}

// ─── BROWSER EXECUTION (Python via Pyodide, JS via isolated eval) ────────────

// Server-side: we return instructions for client to execute
// Client-side execution is handled by hooks (usePyodide, useJSRunner)
// This function is for server-side test validation

export async function executeCode(
  code: string,
  language: Language,
  stdin: string = ""
): Promise<ExecutionResult> {
  const strategy = getStrategy(language);

  if (strategy === "judge0") {
    return executeViaJudge0(code, language, stdin);
  }

  // For browser-executed languages on server, use Judge0 as fallback
  // or return a marker that client should execute
  return executeViaJudge0(code, language, stdin);
}

// ─── JUDGE0 EXECUTION ────────────────────────────────────────────────────────

async function executeViaJudge0(
  code: string,
  language: Language,
  stdin: string
): Promise<ExecutionResult> {
  const langId = JUDGE0_LANG_IDS[language];
  if (!langId) {
    return { stdout: "", stderr: `Language ${language} not supported for server execution`, exitCode: 1, executionTime: 0, timedOut: false };
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (JUDGE0_KEY) headers["X-Auth-Token"] = JUDGE0_KEY;

  try {
    // Submit
    const submitRes = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        source_code: Buffer.from(code).toString("base64"),
        language_id: langId,
        stdin: Buffer.from(stdin).toString("base64"),
        cpu_time_limit: EXECUTION_TIMEOUT / 1000,
        memory_limit: 256000, // 256MB
        wall_time_limit: (EXECUTION_TIMEOUT / 1000) + 2,
      }),
    });

    if (!submitRes.ok) {
      return { stdout: "", stderr: `Judge0 error: ${submitRes.status}`, exitCode: 1, executionTime: 0, timedOut: false };
    }

    const result = await submitRes.json();

    const stdout = result.stdout ? Buffer.from(result.stdout, "base64").toString() : "";
    const stderr = result.stderr ? Buffer.from(result.stderr, "base64").toString() : "";
    const compileErr = result.compile_output ? Buffer.from(result.compile_output, "base64").toString() : "";

    // Status 5 = Time Limit Exceeded
    const timedOut = result.status?.id === 5;
    const exitCode = result.status?.id === 3 ? 0 : 1; // 3 = Accepted

    return {
      stdout: stdout.trimEnd(),
      stderr: (stderr + compileErr).trimEnd(),
      exitCode,
      executionTime: Math.round((result.time || 0) * 1000),
      memoryUsed: result.memory ? result.memory * 1024 : undefined,
      timedOut,
    };
  } catch (err) {
    return { stdout: "", stderr: `Execution service unavailable`, exitCode: 1, executionTime: 0, timedOut: false };
  }
}

// ─── TEST CASE RUNNER ────────────────────────────────────────────────────────

export async function runTestCases(
  code: string,
  language: Language,
  testCases: TestCase[]
): Promise<SubmissionResult> {
  const results: TestCaseResult[] = [];
  let totalTime = 0;

  for (const tc of testCases) {
    const wrappedCode = wrapCodeWithInput(code, language, tc.input);
    const start = Date.now();
    const execResult = await executeCode(wrappedCode, language, tc.input);
    const elapsed = Date.now() - start;
    totalTime += elapsed;

    const actual = execResult.stdout.trim();
    const expected = tc.expected.trim();
    const passed = actual === expected;

    results.push({
      input: tc.input,
      expected,
      actual: execResult.timedOut ? "(Timed out)" : execResult.stderr ? execResult.stderr : actual,
      passed: passed && !execResult.timedOut && execResult.exitCode === 0,
      executionTime: execResult.executionTime || elapsed,
      hidden: tc.hidden || false,
    });

    // Stop on timeout
    if (execResult.timedOut) break;
  }

  const passedCount = results.filter((r) => r.passed).length;
  const allPassed = passedCount === testCases.length;
  const hasTimeout = results.some((r) => r.actual === "(Timed out)");
  const hasError = results.some((r) => !r.passed && r.actual.includes("Error"));

  return {
    status: allPassed ? "PASSED" : hasTimeout ? "TIMEOUT" : hasError ? "ERROR" : "FAILED",
    testResults: results,
    totalTime,
    passedCount,
    totalCount: testCases.length,
    output: results.map((r) => r.passed ? `✓ Test passed` : `✗ Expected: ${r.expected}, Got: ${r.actual}`).join("\n"),
  };
}

// ─── CODE WRAPPING (inject stdin for languages that need it) ─────────────────

function wrapCodeWithInput(code: string, language: Language, input: string): string {
  // For Python, we mock input() calls
  if (language === "PYTHON" && input) {
    const inputs = input.split("\n").map((i) => JSON.stringify(i)).join(", ");
    const inputMock = `import sys\nfrom io import StringIO\nsys.stdin = StringIO(${JSON.stringify(input + "\n")})\n`;
    return inputMock + code;
  }

  // For Java, wrap in class if not already
  if (language === "JAVA" && !code.includes("class ")) {
    return `import java.util.Scanner;\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    ${code}\n  }\n}`;
  }

  return code;
}

// ─── CODE VALIDATION ─────────────────────────────────────────────────────────

export function validateCode(code: string, language: Language): { valid: boolean; error?: string } {
  if (!code.trim()) return { valid: false, error: "Code cannot be empty" };
  if (code.length > MAX_CODE_SIZE) return { valid: false, error: `Code exceeds ${MAX_CODE_SIZE / 1000}KB limit` };

  // Language-specific dangerous patterns
  const dangerousPatterns: Partial<Record<Language, RegExp[]>> = {
    PYTHON: [/import\s+os/, /import\s+subprocess/, /__import__/, /import\s+socket/],
    JAVASCRIPT: [/require\s*\(\s*['"]child_process/, /require\s*\(\s*['"]fs/, /process\.exit/],
    C: [/system\s*\(/, /#include\s*<unistd\.h>/, /fork\s*\(/],
    CPP: [/system\s*\(/, /#include\s*<unistd\.h>/, /fork\s*\(/],
    JAVA: [/Runtime\.getRuntime/, /ProcessBuilder/, /System\.exit/],
  };

  const patterns = dangerousPatterns[language] || [];
  for (const pattern of patterns) {
    if (pattern.test(code)) {
      return { valid: false, error: `Blocked: ${pattern.source} is not allowed in sandbox` };
    }
  }

  return { valid: true };
}

// ─── CLIENT-SIDE JS EXECUTION (for browser) ─────────────────────────────────

export function createJSSandbox(code: string, input: string = ""): string {
  // Returns code that can be safely eval'd in a Web Worker
  return `
    const __inputs = ${JSON.stringify(input.split("\n"))};
    let __inputIdx = 0;
    const prompt = () => __inputs[__inputIdx++] || "";
    const readline = prompt;
    let __output = [];
    const console = { log: (...args) => __output.push(args.join(" ")), error: (...args) => __output.push("Error: " + args.join(" ")) };
    try {
      ${code}
    } catch(e) {
      __output.push("Error: " + e.message);
    }
    __output.join("\\n");
  `;
}
