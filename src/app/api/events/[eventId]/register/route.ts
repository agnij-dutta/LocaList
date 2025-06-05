import { NextRequest, NextResponse } from "next/server";
import { eventRegistrationRepository, eventRepository } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

interface RouteParams {
  params: {
    eventId: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = parseInt(params.eventId);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    // Check if event exists
    const event = await eventRepository.findUnique({
      where: { id: params.eventId }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if user is trying to register for their own event
    if (event.organizerId === parseInt(currentUser.id)) {
      return NextResponse.json(
        { error: 'You cannot register for your own event' },
        { status: 400 }
      );
    }

    // Check if user is already registered
    const existingRegistration = await eventRegistrationRepository.findUnique({
      where: { eventId: eventId, userId: parseInt(currentUser.id) }
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'You are already registered for this event' },
        { status: 409 }
      );
    }

    // Create registration
    const registration = await eventRegistrationRepository.create({
      data: {
        eventId: eventId,
        userId: parseInt(currentUser.id)
      }
    });

    return NextResponse.json({ registration }, { status: 201 });
  } catch (error) {
    console.error('Error registering for event:', error);
    return NextResponse.json(
      { error: 'Failed to register for event' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = parseInt(params.eventId);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    // Check if user is registered
    const registration = await eventRegistrationRepository.findUnique({
      where: { eventId: eventId, userId: parseInt(currentUser.id) }
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'You are not registered for this event' },
        { status: 404 }
      );
    }

    // Delete registration
    await eventRegistrationRepository.delete({
      where: { eventId: eventId, userId: parseInt(currentUser.id) }
    });

    return NextResponse.json({ message: 'Successfully unregistered' });
  } catch (error) {
    console.error('Error unregistering from event:', error);
    return NextResponse.json(
      { error: 'Failed to unregister from event' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = parseInt(params.eventId);
    
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }
    
    // Check if event exists and user is the organizer
    const event = await eventRepository.findUnique({
      where: { id: params.eventId }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.organizerId !== parseInt(currentUser.id)) {
      return NextResponse.json(
        { error: 'You can only view registrations for your own events' },
        { status: 403 }
      );
    }

    // Get all registrations for this event
    const registrations = await eventRegistrationRepository.findMany({
      where: { eventId: eventId }
    });

    return NextResponse.json({ registrations });
  } catch (error) {
    console.error('Error fetching event registrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registrations' },
      { status: 500 }
    );
  }
} 