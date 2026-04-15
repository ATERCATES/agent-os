import { NextRequest, NextResponse } from "next/server";
import { queries } from "@/lib/db";
import {
  verifyPassword,
  verifyTotpCode,
  createSession,
  buildSessionCookie,
  checkRateLimit,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Too many login attempts. Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateCheck.retryAfterSeconds) },
      }
    );
  }

  const body = await request.json();
  const { username, password, totpCode } = body;

  const INVALID = NextResponse.json(
    { error: "Invalid credentials" },
    { status: 401 }
  );

  if (!username || !password) return INVALID;

  const user = queries.getUserByUsername(username);
  if (!user) return INVALID;

  const validPassword = await verifyPassword(password, user.password_hash);
  if (!validPassword) return INVALID;

  if (user.totp_secret) {
    if (!totpCode) {
      return NextResponse.json({ requiresTotp: true });
    }
    if (!verifyTotpCode(user.totp_secret, totpCode)) {
      return INVALID;
    }
  }

  const { token } = createSession(user.id);
  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", buildSessionCookie(token));
  return response;
}
