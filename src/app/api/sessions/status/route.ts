import { NextResponse } from "next/server";
import { getStatusSnapshot } from "@/lib/status-monitor";

export async function GET() {
  return NextResponse.json({ statuses: getStatusSnapshot() });
}
