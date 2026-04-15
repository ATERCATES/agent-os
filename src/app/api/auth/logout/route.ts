import { NextRequest, NextResponse } from "next/server";
import { deleteSession, buildClearCookie, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (token) {
    deleteSession(token);
  }

  const response = NextResponse.json({ ok: true });
  response.headers.set("Set-Cookie", buildClearCookie());
  return response;
}
