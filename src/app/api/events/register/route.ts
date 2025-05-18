import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { message: "You must be logged in to register for events" },
        { status: 401 }
      );
    }
    
    // Get request body
    const body = await req.json();
    const { eventId, userId, numberOfPeople = 1 } = body;
    
    // Validate user ID against session
    if (session.user.id.toString() !== userId.toString()) {
      return NextResponse.json(
        { message: "Unauthorized action" },
        { status: 403 }
      );
    }
    
    // Check if event exists and is approved
    const event = await db.event.findUnique({
      where: { id: eventId },
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
    
    // Check if user is already registered
    const existingInterest = await db.interest.findMany({
      where: {
        userId,
        eventId,
      },
    });
    
    if (existingInterest.length > 0) {
      // Update the registration
      await db.interest.delete({
        where: {
          id: existingInterest[0].id,
        },
      });
    }
    
    // Create new interest/registration
    const interest = await db.interest.create({
      data: {
        userId,
        eventId,
        numberOfPeople,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
    });
    
    // Create notification for the user
    await db.notification.create({
      data: {
        userId,
        eventId,
        type: "registration",
        content: `You have successfully registered for ${event.title}`,
      },
    });
    
    return NextResponse.json({
      message: "Successfully registered for event",
      interest,
    });
  } catch (error) {
    console.error("Error during event registration:", error);
    return NextResponse.json(
      { message: "An error occurred during registration" },
      { status: 500 }
    );
  }
} 