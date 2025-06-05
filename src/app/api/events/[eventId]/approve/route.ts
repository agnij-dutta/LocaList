import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { sendEventApprovalEmail } from "@/lib/email";

export async function PATCH(
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

    // Get the authenticated user and verify admin status
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { message: 'Admin access required' },
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

    // Find the event with organizer info
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: { organizer: true }
    });

    if (!event) {
      return NextResponse.json(
        { message: 'Event not found' },
        { status: 404 }
      );
    }

    // Update the event approval status
    const updatedEvent = await db.event.update({
      where: { id: eventId },
      data: { 
        isApproved: true,
        updatedAt: new Date().toISOString()
      }
    });

    // Send approval email notification to organizer
    try {
      await sendEventApprovalEmail(
        event.organizer.email,
        event.organizer.name,
        event.title
      );
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
      // Don't fail the approval if email fails
    }

    return NextResponse.json({ 
      event: updatedEvent, 
      message: 'Event approved successfully and organizer notified!' 
    });
  } catch (error) {
    console.error('Error approving event:', error);
    return NextResponse.json(
      { message: 'Error approving event', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 