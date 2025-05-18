import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

// GET: Check if a user is interested in an event
export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    // Get the current user from session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Convert eventId to number
    const eventId = parseInt(params.eventId);
    
    // Get user by email
    const user = await db.user.findUnique({
      where: { email: session.user.email! }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Find the interest
    const interests = await db.interest.findMany({
      where: {
        userId: user.id,
        eventId
      }
    });
    
    const isInterested = interests.length > 0;
    
    return NextResponse.json({
      isInterested,
      interest: isInterested ? interests[0] : null
    });
  } catch (error) {
    console.error("Error checking interest:", error);
    
    return NextResponse.json(
      { error: "Failed to check registration status" },
      { status: 500 }
    );
  }
}

// POST: Create a new interest (register for event)
export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    // Get the current user from session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Get request body
    const { numberOfPeople = 1 } = await req.json();
    
    // Convert eventId to number
    const eventId = parseInt(params.eventId);
    
    // Get user by email
    const user = await db.user.findUnique({
      where: { email: session.user.email! }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if event exists and is approved
    const event = await db.event.findUnique({
      where: { id: eventId }
    });
    
    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }
    
    if (!event.isApproved) {
      return NextResponse.json(
        { error: "This event is not yet approved" },
        { status: 400 }
      );
    }
    
    // Check if the user is already registered
    const existingInterest = await db.interest.findMany({
      where: {
        userId: user.id,
        eventId
      }
    });
    
    if (existingInterest.length > 0) {
      return NextResponse.json(
        { error: "You are already registered for this event" },
        { status: 400 }
      );
    }
    
    // Create interest
    const interest = await db.interest.create({
      data: {
        userId: user.id,
        eventId,
        numberOfPeople
      }
    });
    
    // Create notification for event organizer
    await db.notification.create({
      data: {
        content: `${user.name} has registered for your event: ${event.title}`,
        type: 'event_registration',
        userId: event.organizerId,
        eventId
      }
    });
    
    return NextResponse.json({ success: true, interest });
  } catch (error) {
    console.error("Error creating interest:", error);
    
    return NextResponse.json(
      { error: "Failed to register for event" },
      { status: 500 }
    );
  }
}

// PATCH: Update an existing interest
export async function PATCH(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    // Get the current user from session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Get request body
    const { numberOfPeople = 1 } = await req.json();
    
    // Convert eventId to number
    const eventId = parseInt(params.eventId);
    
    // Get user by email
    const user = await db.user.findUnique({
      where: { email: session.user.email! }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if the interest exists
    const existingInterests = await db.interest.findMany({
      where: {
        userId: user.id,
        eventId
      }
    });
    
    if (existingInterests.length === 0) {
      return NextResponse.json(
        { error: "You are not registered for this event" },
        { status: 404 }
      );
    }
    
    const existingInterest = existingInterests[0];
    
         // First delete the existing interest
     await db.interest.delete({
       where: {
         id: existingInterest.id
       }
     });
     
     // Then create a new one with updated data
     await db.interest.create({
       data: {
         userId: user.id,
         eventId,
         numberOfPeople
       }
     });
    
    return NextResponse.json({ 
      success: true,
      message: "Registration updated successfully" 
    });
  } catch (error) {
    console.error("Error updating interest:", error);
    
    return NextResponse.json(
      { error: "Failed to update registration" },
      { status: 500 }
    );
  }
}

// DELETE: Remove an interest (cancel registration)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    // Get the current user from session
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Convert eventId to number
    const eventId = parseInt(params.eventId);
    
    // Get user by email
    const user = await db.user.findUnique({
      where: { email: session.user.email! }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Delete the interest
    await db.interest.delete({
      where: {
        userId: user.id,
        eventId
      }
    });
    
    return NextResponse.json({ 
      success: true,
      message: "Registration canceled successfully" 
    });
  } catch (error) {
    console.error("Error deleting interest:", error);
    
    return NextResponse.json(
      { error: "Failed to cancel registration" },
      { status: 500 }
    );
  }
} 