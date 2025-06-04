import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    if (user.isBanned) {
      return NextResponse.json(
        { message: 'User is banned' },
        { status: 403 }
      );
    }

    const eventId = parseInt(params.eventId);
    
    if (isNaN(eventId)) {
      return NextResponse.json(
        { message: 'Invalid event ID' },
        { status: 400 }
      );
    }

    // Check if event exists
    const event = await db.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if user already voted
    const existingVote = await db.eventVote.findUnique({
      where: { eventId, userId: user.id }
    });

    if (existingVote) {
      // Remove vote (unlike)
      await db.eventVote.delete({
        where: { eventId, userId: user.id }
      });

      return NextResponse.json({ 
        message: 'Vote removed',
        voted: false 
      });
    } else {
      // Add vote (like)
      await db.eventVote.create({
        data: { eventId, userId: user.id }
      });

      return NextResponse.json({ 
        message: 'Vote added',
        voted: true 
      });
    }
  } catch (error) {
    console.error('Error handling vote:', error);
    return NextResponse.json(
      { message: 'Error handling vote', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 