import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { queries } from "@/lib/db";
import {
  hashPassword,
  verifyTotpCode,
  createSession,
  buildSessionCookie,
  hasUsers,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (hasUsers()) {
    return NextResponse.json(
      { error: "Setup already completed" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { username, password, totpSecret, totpCode } = body;

  if (
    !username ||
    typeof username !== "string" ||
    username.length < 3 ||
    username.length > 32 ||
    !/^[a-zA-Z0-9_]+$/.test(username)
  ) {
    return NextResponse.json(
      {
        error:
          "Username must be 3-32 characters, alphanumeric and underscore only",
      },
      { status: 400 }
    );
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  if (totpSecret) {
    if (!totpCode || !verifyTotpCode(totpSecret, totpCode)) {
      return NextResponse.json(
        {
          error:
            "Invalid TOTP code. Scan the QR code again and enter the current code.",
        },
        { status: 400 }
      );
    }
  }

  const id = randomBytes(16).toString("hex");
  const passwordHash = await hashPassword(password);

  queries.createUser(id, username, passwordHash, totpSecret || null);

  const { token } = createSession(id);
  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", buildSessionCookie(token));
  return response;
}
