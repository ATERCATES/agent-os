import { NextResponse } from "next/server";
import { isCloudflaredInstalled, getTunnelsList } from "@/lib/tunnels";

export async function GET() {
  try {
    const [installed, tunnels] = await Promise.all([
      isCloudflaredInstalled(),
      Promise.resolve(getTunnelsList()),
    ]);
    return NextResponse.json({ installed, tunnels });
  } catch (error) {
    console.error("Error getting tunnels:", error);
    return NextResponse.json(
      { error: "Failed to get tunnels" },
      { status: 500 }
    );
  }
}
