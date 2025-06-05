import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { eventRepository, violationReportRepository } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await Promise.resolve(params);
    const eventId = parseInt(resolvedParams.id);
    
    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: 'Invalid event ID' },
        { status: 400 }
      );
    }

    const { reason, description } = await request.json();
    
    if (!reason) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      );
    }

    // Check if event exists
    const event = await eventRepository.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if user has already reported this event
    const existingReports = await violationReportRepository.findMany({
      where: {
        contentType: 'event',
        contentId: eventId,
        reportedById: currentUser.id
      }
    });

    if (existingReports.length > 0) {
      return NextResponse.json(
        { error: 'You have already reported this event' },
        { status: 400 }
      );
    }

    // Create the report
    const report = await violationReportRepository.create({
      data: {
        contentType: 'event',
        contentId: eventId,
        reportedById: currentUser.id,
        reason: reason,
        description: description || null,
        status: 'pending'
      }
    });

    return NextResponse.json({
      message: 'Report submitted successfully',
      reportId: report.id
    });

  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 