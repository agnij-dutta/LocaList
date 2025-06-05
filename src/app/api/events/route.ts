import { NextRequest, NextResponse } from "next/server";
import { eventRepository, userRepository } from "@/lib/db";
import { getServerSession } from "next-auth";
import { sendAdminEventNotification } from "@/lib/email";

// Helper function to get date range boundaries
function getDateRangeBoundaries(dateRange: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  switch (dateRange) {
    case 'today':
      return {
        start: today,
        end: tomorrow
      };
    
    case 'tomorrow':
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(tomorrow.getDate() + 1);
      return {
        start: tomorrow,
        end: dayAfterTomorrow
      };
    
    case 'this_week':
      const thisWeekStart = new Date(today);
      const dayOfWeek = today.getDay();
      thisWeekStart.setDate(today.getDate() - dayOfWeek);
      const thisWeekEnd = new Date(thisWeekStart);
      thisWeekEnd.setDate(thisWeekStart.getDate() + 7);
      return {
        start: thisWeekStart,
        end: thisWeekEnd
      };
    
    case 'this_weekend':
      const saturday = new Date(today);
      const daysUntilSaturday = (6 - today.getDay()) % 7;
      saturday.setDate(today.getDate() + daysUntilSaturday);
      const monday = new Date(saturday);
      monday.setDate(saturday.getDate() + 2);
      return {
        start: saturday,
        end: monday
      };
    
    case 'next_week':
      const nextWeekStart = new Date(today);
      const daysUntilNextWeek = 7 - today.getDay();
      nextWeekStart.setDate(today.getDate() + daysUntilNextWeek);
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekStart.getDate() + 7);
      return {
        start: nextWeekStart,
        end: nextWeekEnd
      };
    
    case 'this_month':
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      return {
        start: thisMonthStart,
        end: thisMonthEnd
      };
    
    case 'next_month':
      const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 1);
      return {
        start: nextMonthStart,
        end: nextMonthEnd
      };
    
    default:
      return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const dateRange = searchParams.get('dateRange') || '';
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const maxDistance = parseInt(searchParams.get('distance') || '5'); // Default 5km radius
    
    // Build the query conditions
    const where: any = {
      isApproved: true,
      isFlagged: false,
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
          },
        },
        {
          description: {
            contains: search,
          },
        },
        {
          location: {
            contains: search,
          },
        },
      ];
    }
    
    // Add category filter if provided
    if (category && category !== 'all' && category !== '') {
      where.category = category;
    }
    
    // Add date range filter if provided
    if (dateRange && dateRange !== '') {
      const dateRangeBoundaries = getDateRangeBoundaries(dateRange);
      if (dateRangeBoundaries) {
        where.startDate = {
          gte: dateRangeBoundaries.start,
          lt: dateRangeBoundaries.end,
        };
      }
    }
    
    // Set up location filtering options
    let userLocation = undefined;
    if (latitude && longitude) {
      userLocation = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      };
    }

    // Fetch events with conditions using our custom repository
    let events = await eventRepository.findMany({
      where,
      include: {
        organizer: true,
        interests: true,
        votes: true,
        followers: true,
        photos: true,
      },
      orderBy: {
        urgency: 'desc'
      },
      userLocation,
      maxDistance: userLocation ? maxDistance : undefined,
    });
    
    // Parse JSON fields for frontend consumption
    const processedEvents = events.map((event: any) => ({
      ...event,
      additionalImages: event.additionalImages ? JSON.parse(event.additionalImages) : [],
      ticketTiers: event.ticketTiers ? JSON.parse(event.ticketTiers) : null,
      startDate: new Date(event.startDate),
      endDate: event.endDate ? new Date(event.endDate) : null,
      registrationStart: event.registrationStart ? new Date(event.registrationStart) : null,
      registrationEnd: event.registrationEnd ? new Date(event.registrationEnd) : null,
    }));
    
    return NextResponse.json({ 
      events: processedEvents,
      total: processedEvents.length,
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get the authenticated user
    const user = await userRepository.findUnique({
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
        { message: 'User is banned from creating events' },
        { status: 403 }
      );
    }

    const data = await req.json();
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'location', 'latitude', 'longitude', 'startDate', 'category'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { message: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate latitude and longitude
    const lat = parseFloat(data.latitude);
    const lng = parseFloat(data.longitude);
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { message: 'Invalid latitude or longitude' },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(data.startDate);
    const endDate = data.endDate ? new Date(data.endDate) : null;
    
    if (startDate < new Date()) {
      return NextResponse.json(
        { message: 'Event start date cannot be in the past' },
        { status: 400 }
      );
    }

    if (endDate && endDate <= startDate) {
      return NextResponse.json(
        { message: 'Event end date must be after start date' },
        { status: 400 }
      );
    }

    // Validate category against database
    const { eventCategoryRepository } = await import('@/lib/db');
    const categoryExists = await eventCategoryRepository.findUnique({
      where: { name: data.category }
    });

    if (!categoryExists || !categoryExists.isActive) {
      return NextResponse.json(
        { message: 'Invalid or inactive event category' },
        { status: 400 }
      );
    }

    // Check if this is a Lost & Found event
    const isUrgent = data.category === 'Lost & Found';

    // Create the event
    const event = await eventRepository.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        latitude: lat,
        longitude: lng,
        startDate: startDate,
        endDate: endDate,
        category: data.category,
        isUrgent,
        imageUrl: data.imageUrl || null,
        additionalImages: data.additionalImages || [],
        isPaid: data.isPaid || false,
        ticketTiers: data.ticketTiers || null,
        registrationStart: data.registrationStart ? new Date(data.registrationStart) : null,
        registrationEnd: data.registrationEnd ? new Date(data.registrationEnd) : null,
        organizerId: user.id,
        isApproved: false, // All events need admin approval
      }
    });

    // Send email notification to all admins
    try {
      const admins = await userRepository.findMany({
        where: { isAdmin: true }
      });

      for (const admin of admins) {
        await sendAdminEventNotification(
          admin.email,
          data.title,
          user.name,
          event.id
        );
      }
    } catch (emailError) {
      console.error('Error sending admin notifications:', emailError);
      // Don't fail the event creation if email fails
    }

    return NextResponse.json({ 
      event: {
        ...event,
        startDate: new Date(event.startDate),
        endDate: event.endDate ? new Date(event.endDate) : null,
        registrationStart: event.registrationStart ? new Date(event.registrationStart) : null,
        registrationEnd: event.registrationEnd ? new Date(event.registrationEnd) : null,
      }, 
      message: 'Event created and pending approval!' 
    });
  } catch (error) {
    console.error('Error creating event:', error);
  return NextResponse.json(
      { message: 'Error creating event', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
  );
  }
} 