import { NextRequest, NextResponse } from "next/server";
import { isCloudflaredInstalled, startTunnel, stopTunnel } from "@/lib/tunnels";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ port: string }> }
) {
  try {
    const { port: portStr } = await params;
    const port = parseInt(portStr, 10);
    if (isNaN(port) || port <= 0) {
      return NextResponse.json({ error: "Invalid port" }, { status: 400 });
    }

    const installed = await isCloudflaredInstalled();
    if (!installed) {
      return NextResponse.json(
        {
          error: "cloudflared is not installed",
          code: "CLOUDFLARED_NOT_FOUND",
        },
        { status: 400 }
      );
    }

    const result = await startTunnel(port);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error starting tunnel:", error);
    return NextResponse.json(
      { error: "Failed to start tunnel" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ port: string }> }
) {
  try {
    const { port: portStr } = await params;
    const port = parseInt(portStr, 10);
    if (isNaN(port) || port <= 0) {
      return NextResponse.json({ error: "Invalid port" }, { status: 400 });
    }

    await stopTunnel(port);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error stopping tunnel:", error);
    return NextResponse.json(
      { error: "Failed to stop tunnel" },
      { status: 500 }
    );
  }
}
