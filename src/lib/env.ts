// Environment validation — imported in layout.tsx to fail fast on missing critical vars

const required = ["DATABASE_URL", "AUTH_SECRET"] as const;
const optional = ["REDIS_URL", "OLLAMA_URL", "JUDGE0_URL", "GITHUB_ID", "GOOGLE_ID"] as const;

export function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `❌ Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join("\n")}\n\nSee .env.example for reference.`
    );
  }

  // Warn about optional but recommended vars
  if (process.env.NODE_ENV === "development") {
    const missingOptional = optional.filter((key) => !process.env[key]);
    if (missingOptional.length > 0) {
      console.warn(`⚠️  Optional env vars not set: ${missingOptional.join(", ")}`);
    }
  }
}

// Run on import (server-side only)
if (typeof window === "undefined") {
  validateEnv();
}
