import { NextRequest, NextResponse } from "next/server";
import {
  validateSession,
  renewSession,
  COOKIE_NAME,
  hasUsers,
} from "@/lib/auth";

export async function GET(request: NextRequest) {
  if (!hasUsers()) {
    return NextResponse.json({ authenticated: false, needsSetup: true });
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const user = validateSession(token);
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  renewSession(token);
  return NextResponse.json({
    authenticated: true,
    username: user.username,
  });
}
