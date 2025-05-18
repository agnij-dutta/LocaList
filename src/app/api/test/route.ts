import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // Test database operations
    const users = await db.user.findMany();
    const events = await db.event.findMany();
    const interests = await db.interest.findMany({});
    
    return NextResponse.json({
      success: true,
      counts: {
        users: users.length,
        events: events.length,
        interests: interests.length
      }
    });
  } catch (error) {
    console.error("Database test error:", error);
    
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
} 