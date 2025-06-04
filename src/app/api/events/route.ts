import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const maxDistance = parseInt(searchParams.get('maxDistance') || '5'); // Default 5km radius
    
    // Build the query conditions
    const where: any = {
      isApproved: true,
      isFlagged: false,
      startDate: {
        gte: new Date().toISOString(), // Only show upcoming events
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
    if (category && category !== 'all') {
      where.category = category;
    }
    
    // Set up location filtering options
    const options: any = {
      where,
      include: {
        organizer: true,
        interests: true,
        votes: true,
        followers: true,
        photos: true,
      },
      orderBy: {
        urgency: 'desc', // Urgent events first
      },
    };

    // Add location filtering if coordinates are provided
    if (latitude && longitude) {
      options.userLocation = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
      };
      options.maxDistance = maxDistance;
    }
    
    // Fetch events with conditions
    const events = await db.event.findMany(options);
    
    // Parse JSON fields for frontend consumption
    const processedEvents = events.map(event => ({
      ...event,
      additionalImages: event.additionalImages ? JSON.parse(event.additionalImages) : [],
      ticketTiers: event.ticketTiers ? JSON.parse(event.ticketTiers) : null,
      startDate: new Date(event.startDate),
      endDate: event.endDate ? new Date(event.endDate) : null,
      registrationStart: event.registrationStart ? new Date(event.registrationStart) : null,
      registrationEnd: event.registrationEnd ? new Date(event.registrationEnd) : null,
    }));

    return NextResponse.json({ events: processedEvents });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { message: 'Error fetching events', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
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

    // Validate category
    const validCategories = [
      'Garage Sales',
      'Sports Matches', 
      'Community Classes',
      'Volunteer Opportunities',
      'Exhibitions',
      'Small Festivals',
      'Lost & Found'
    ];

    if (!validCategories.includes(data.category)) {
      return NextResponse.json(
        { message: 'Invalid event category' },
        { status: 400 }
      );
    }

    // Check if this is a Lost & Found event
    const isUrgent = data.category === 'Lost & Found';

    // Create the event
    const event = await db.event.create({
      data: {
        title: data.title,
        description: data.description,
        location: data.location,
        latitude: lat,
        longitude: lng,
        startDate: startDate.toISOString(),
        endDate: endDate ? endDate.toISOString() : null,
        category: data.category,
        isUrgent,
        imageUrl: data.imageUrl || null,
        additionalImages: data.additionalImages || [],
        isPaid: data.isPaid || false,
        ticketTiers: data.ticketTiers || null,
        registrationStart: data.registrationStart ? new Date(data.registrationStart).toISOString() : null,
        registrationEnd: data.registrationEnd ? new Date(data.registrationEnd).toISOString() : null,
        organizerId: user.id,
        isApproved: user.isVerifiedOrganizer || false, // Auto-approve for verified organizers
      }
    });

    // Add additional photos if provided
    if (data.additionalImages && Array.isArray(data.additionalImages)) {
      for (const imageUrl of data.additionalImages) {
        await db.eventPhoto.create({
          data: {
            eventId: event.id,
            imageUrl
          }
        });
      }
    }

    return NextResponse.json({ 
      event: {
        ...event,
        startDate: new Date(event.startDate),
        endDate: event.endDate ? new Date(event.endDate) : null,
        registrationStart: event.registrationStart ? new Date(event.registrationStart) : null,
        registrationEnd: event.registrationEnd ? new Date(event.registrationEnd) : null,
      }, 
      message: user.isVerifiedOrganizer ? 'Event created and published!' : 'Event created and pending approval!' 
    });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { message: 'Error creating event', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 