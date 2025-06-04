import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "You must be logged in to register for events" },
        { status: 401 }
      );
    }
    
    // Get the authenticated user
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
        { message: 'User is banned from registering for events' },
        { status: 403 }
      );
    }
    
    // Get request body
    const body = await req.json();
    const { eventId, userName, userEmail, userPhone, numberOfPeople, ticketTier } = body;
    
    // Validate required fields
    if (!eventId || !userName || !userEmail) {
      return NextResponse.json(
        { message: "Missing required fields: eventId, userName, userEmail" },
        { status: 400 }
      );
    }
    
    // Check if event exists and is approved
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: true,
      }
    });
    
    if (!event) {
      return NextResponse.json(
        { message: "Event not found" },
        { status: 404 }
      );
    }
    
    if (!event.isApproved) {
      return NextResponse.json(
        { message: "This event is not currently available for registration" },
        { status: 400 }
      );
    }

    if (event.isFlagged) {
      return NextResponse.json(
        { message: "This event is currently under review" },
        { status: 400 }
      );
    }
    
    // Check registration period
    const now = new Date();
    const registrationStart = event.registrationStart ? new Date(event.registrationStart) : null;
    const registrationEnd = event.registrationEnd ? new Date(event.registrationEnd) : null;
    
    if (registrationStart && now < registrationStart) {
      return NextResponse.json(
        { message: "Registration has not started yet" },
        { status: 400 }
      );
    }
    
    if (registrationEnd && now > registrationEnd) {
      return NextResponse.json(
        { message: "Registration has ended" },
        { status: 400 }
      );
    }

    // Check if event has passed
    const eventStart = new Date(event.startDate);
    if (now > eventStart) {
      return NextResponse.json(
        { message: "This event has already started" },
        { status: 400 }
      );
    }

    // For paid events, validate ticket tier
    if (event.isPaid && event.ticketTiers) {
      const tiers = JSON.parse(event.ticketTiers);
      if (!ticketTier || !tiers.find((tier: any) => tier.name === ticketTier)) {
        return NextResponse.json(
          { message: "Invalid ticket tier selected" },
          { status: 400 }
        );
      }
    }
    
    // Check if user is already registered
    const existingInterest = await db.interest.findUnique({
      where: {
        userId: user.id,
        eventId,
      },
    });
    
    if (existingInterest) {
      // Update the existing registration
      const updatedInterest = await db.interest.update({
        where: {
          userId: user.id,
          eventId,
        },
        data: {
          userName,
          userEmail,
          userPhone: userPhone || null,
          numberOfPeople: numberOfPeople || 1,
          ticketTier: ticketTier || null,
          paymentStatus: event.isPaid ? 'pending' : 'completed',
        }
      });

      return NextResponse.json({
        message: "Registration updated successfully",
        interest: updatedInterest,
        requiresPayment: event.isPaid
      });
    }
    
    // Create new interest/registration
    const interest = await db.interest.create({
      data: {
        userId: user.id,
        eventId,
        userName,
        userEmail,
        userPhone: userPhone || null,
        numberOfPeople: numberOfPeople || 1,
        ticketTier: ticketTier || null,
        paymentStatus: event.isPaid ? 'pending' : 'completed',
      },
    });
    
    // Create notification for the user
    await db.notification.create({
      data: {
        userId: user.id,
        eventId,
        type: "registration",
        content: `You have successfully registered for ${event.title}`,
      },
    });

    // Create notification for the organizer
    await db.notification.create({
      data: {
        userId: event.organizerId,
        eventId,
        type: "new_registration",
        content: `New registration for your event: ${event.title}`,
      },
    });
    
    return NextResponse.json({
      message: "Successfully registered for event",
      interest,
      requiresPayment: event.isPaid,
      event: {
        title: event.title,
        startDate: new Date(event.startDate),
        location: event.location,
      }
    });
  } catch (error) {
    console.error("Error during event registration:", error);
    return NextResponse.json(
      { message: "An error occurred during registration", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Authentication required" },
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

    const { searchParams } = new URL(req.url);
    const eventId = parseInt(searchParams.get('eventId') || '');

    if (isNaN(eventId)) {
      return NextResponse.json(
        { message: 'Invalid event ID' },
        { status: 400 }
      );
    }

    // Check if registration exists
    const existingInterest = await db.interest.findUnique({
      where: {
        userId: user.id,
        eventId,
      },
    });

    if (!existingInterest) {
      return NextResponse.json(
        { message: "You are not registered for this event" },
        { status: 404 }
      );
    }

    // Get event details for notification
    const event = await db.event.findUnique({
      where: { id: eventId }
    });

    // Delete the registration
    await db.interest.delete({
      where: {
        userId: user.id,
        eventId,
      },
    });

    // Create notification for the user
    if (event) {
      await db.notification.create({
        data: {
          userId: user.id,
          eventId,
          type: "unregistration",
          content: `You have unregistered from ${event.title}`,
        },
      });

      // Create notification for the organizer
      await db.notification.create({
        data: {
          userId: event.organizerId,
          eventId,
          type: "registration_cancelled",
          content: `A user has cancelled their registration for: ${event.title}`,
        },
      });
    }

    return NextResponse.json({
      message: "Successfully unregistered from event"
    });
  } catch (error) {
    console.error("Error during event unregistration:", error);
    return NextResponse.json(
      { message: "An error occurred during unregistration", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 