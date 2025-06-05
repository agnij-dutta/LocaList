import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const db = await getDb();
    
    // Get user
    const user = await db.get('SELECT * FROM users WHERE email = ?', session.user.email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.isBanned) {
      return NextResponse.json(
        { error: 'You are banned from reporting content' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { contentType, contentId, reason, description } = body;

    // Validate input
    if (!contentType || !contentId || !reason) {
      return NextResponse.json(
        { error: 'Content type, content ID, and reason are required' },
        { status: 400 }
      );
    }

    if (!['event', 'issue'].includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid content type. Must be "event" or "issue"' },
        { status: 400 }
      );
    }

    // Check if content exists
    const tableName = contentType === 'event' ? 'events' : 'issues';
    const content = await db.get(`SELECT * FROM ${tableName} WHERE id = ?`, contentId);
    
    if (!content) {
      return NextResponse.json(
        { error: `${contentType} not found` },
        { status: 404 }
      );
    }

    // Check if user already reported this content
    const existingReport = await db.get(
      'SELECT * FROM violation_reports WHERE reportedById = ? AND contentType = ? AND contentId = ?',
      [user.id, contentType, contentId]
    );

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this content' },
        { status: 409 }
      );
    }

    // Create report
    const now = new Date().toISOString();
    const result = await db.run(
      `INSERT INTO violation_reports (reportedById, contentType, contentId, reason, description, status, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user.id, contentType, contentId, reason, description || null, 'pending', now]
    );

    return NextResponse.json(
      { 
        success: true,
        reportId: result.lastID,
        message: 'Content reported successfully. Our team will review it.' 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
} 