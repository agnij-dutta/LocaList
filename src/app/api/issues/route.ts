import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const maxDistance = parseInt(searchParams.get('maxDistance') || '5'); // Default 5km radius
    
    // Build the query conditions
    const where: any = {
      isFlagged: false,
    };
    
    // Add category filter if provided
    if (category && category !== 'all') {
      where.category = category;
    }

    // Add status filter if provided
    if (status && status !== 'all') {
      where.status = status;
    }
    
    // Set up location filtering options
    const options: any = {
      where,
      include: {
        reporter: true,
        photos: true,
        votes: true,
        followers: true,
        statusUpdates: true,
      },
      orderBy: {
        upvotes: 'desc',
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
    
    // Fetch issues with conditions
    const issues = await db.issue.findMany(options);
    
    // Process the issues for frontend consumption
    const processedIssues = issues.map(issue => ({
      ...issue,
      createdAt: new Date(issue.createdAt),
      updatedAt: new Date(issue.updatedAt),
      reporter: issue.isAnonymous ? null : issue.reporter,
    }));

    return NextResponse.json({ issues: processedIssues });
  } catch (error) {
    console.error('Error fetching issues:', error);
    return NextResponse.json(
      { message: 'Error fetching issues', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'category', 'location', 'latitude', 'longitude'];
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

    // Validate category against database
    const { issueCategoryRepository } = await import('@/lib/db');
    const categoryExists = await issueCategoryRepository.findUnique({
      where: { name: data.category }
    });

    if (!categoryExists || !categoryExists.isActive) {
      return NextResponse.json(
        { message: 'Invalid or inactive issue category' },
        { status: 400 }
      );
    }

    let reporterId = null;

    // Get user info if not anonymous
    if (!data.isAnonymous) {
      const session = await getServerSession();
      
      if (session?.user?.email) {
        const user = await db.user.findUnique({
          where: { email: session.user.email }
        });

        if (user && !user.isBanned) {
          reporterId = user.id;
        }
      }
    }

    // Create the issue
    const issue = await db.issue.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        location: data.location,
        latitude: lat,
        longitude: lng,
        status: 'Reported',
        isAnonymous: data.isAnonymous || false,
        reporterId,
      }
    });

    // Add photos if provided
    if (data.photos && Array.isArray(data.photos)) {
      for (const photoUrl of data.photos) {
        await db.issuePhoto.create({
          data: {
            issueId: issue.id,
            imageUrl: photoUrl
          }
        });
      }
    }

    // Create initial status update
    await db.issueStatusUpdate.create({
      data: {
        issueId: issue.id,
        status: 'Reported',
        comment: 'Issue reported'
      }
    });

    return NextResponse.json({ 
      issue: {
        ...issue,
        createdAt: new Date(issue.createdAt),
        updatedAt: new Date(issue.updatedAt),
      }, 
      message: 'Issue reported successfully!' 
    });
  } catch (error) {
    console.error('Error creating issue:', error);
    return NextResponse.json(
      { message: 'Error creating issue', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 