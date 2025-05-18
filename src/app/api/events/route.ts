import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    
    // Build the query conditions
    const where: any = {
      isApproved: true,
      startDate: {
        gte: new Date(), // Only show upcoming events
      },
    };
    
    // Add search condition if provided
    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          location: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }
    
    // Add category filter if provided
    if (category) {
      where.category = category;
    }
    
    // Fetch events with conditions
    const events = await db.event.findMany({
      where,
      include: {
        interests: true,
        organizer: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    });
    
    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { message: 'Error fetching events' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Handler for creating events will go here
  // This will be implemented after authentication
  return NextResponse.json(
    { message: "Not implemented yet" },
    { status: 501 }
  );
} 