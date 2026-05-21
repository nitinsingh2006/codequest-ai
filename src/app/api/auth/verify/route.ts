import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

// POST /api/auth/verify — verify email token
export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const record = await db.verificationToken.findUnique({ where: { token } });
  if (!record) return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  if (record.expires < new Date()) {
    await db.verificationToken.delete({ where: { token } });
    return NextResponse.json({ error: "Token expired" }, { status: 400 });
  }

  // Mark user as verified
  await db.user.update({
    where: { email: record.identifier },
    data: { emailVerified: new Date() },
  });

  await db.verificationToken.delete({ where: { token } });
  return NextResponse.json({ verified: true });
}

// GET /api/auth/verify?email=... — resend verification
export async function GET(req: NextRequest) {
  const email = new URL(req.url).searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const user = await db.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ error: "Already verified" }, { status: 400 });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  await db.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  // TODO: Send email via Resend/SendGrid when configured
  // await sendVerificationEmail(email, token);

  return NextResponse.json({ sent: true, message: "Verification email sent (configure SMTP to enable)" });
}
