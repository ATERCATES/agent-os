import { NextRequest, NextResponse } from "next/server";
import { queries } from "@/lib/db";

export async function GET() {
  try {
    const items = await queries.getAllHiddenItems();
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching hidden items:", error);
    return NextResponse.json(
      { error: "Failed to fetch hidden items" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { itemType, itemId } = await request.json();

    if (!itemType || !itemId) {
      return NextResponse.json(
        { error: "itemType and itemId are required" },
        { status: 400 }
      );
    }

    if (!["project", "session"].includes(itemType)) {
      return NextResponse.json(
        { error: "itemType must be 'project' or 'session'" },
        { status: 400 }
      );
    }

    await queries.hideItem(itemType, itemId);
    return NextResponse.json({ hidden: true });
  } catch (error) {
    console.error("Error hiding item:", error);
    return NextResponse.json({ error: "Failed to hide item" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { itemType, itemId } = await request.json();

    if (!itemType || !itemId) {
      return NextResponse.json(
        { error: "itemType and itemId are required" },
        { status: 400 }
      );
    }

    await queries.unhideItem(itemType, itemId);
    return NextResponse.json({ hidden: false });
  } catch (error) {
    console.error("Error unhiding item:", error);
    return NextResponse.json(
      { error: "Failed to unhide item" },
      { status: 500 }
    );
  }
}
