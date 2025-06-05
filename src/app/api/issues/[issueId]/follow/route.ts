import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getDb } from '@/lib/db';

interface RouteParams {
  params: { issueId: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const db = await getDb();
    const issueId = parseInt(params.issueId);
    
    if (isNaN(issueId)) {
      return NextResponse.json(
        { error: 'Invalid issue ID' },
        { status: 400 }
      );
    }

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
        { error: 'You are banned from following issues' },
        { status: 403 }
      );
    }

    // Check if issue exists
    const issue = await db.get('SELECT * FROM issues WHERE id = ?', issueId);
    
    if (!issue) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      );
    }

    if (issue.isFlagged) {
      return NextResponse.json(
        { error: 'This issue is currently under review' },
        { status: 400 }
      );
    }

    // Check if already following
    const existingFollow = await db.get(
      'SELECT * FROM issue_followers WHERE issueId = ? AND userId = ?',
      [issueId, user.id]
    );

    if (existingFollow) {
      return NextResponse.json(
        { error: 'You are already following this issue' },
        { status: 409 }
      );
    }

    // Create follow relationship
    const now = new Date().toISOString();
    await db.run(
      'INSERT INTO issue_followers (issueId, userId, createdAt) VALUES (?, ?, ?)',
      [issueId, user.id, now]
    );

    return NextResponse.json(
      { 
        success: true,
        message: 'Successfully following issue' 
      }
    );

  } catch (error) {
    console.error('Error following issue:', error);
    return NextResponse.json(
      { error: 'Failed to follow issue' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const db = await getDb();
    const issueId = parseInt(params.issueId);
    
    if (isNaN(issueId)) {
      return NextResponse.json(
        { error: 'Invalid issue ID' },
        { status: 400 }
      );
    }

    // Get user
    const user = await db.get('SELECT * FROM users WHERE email = ?', session.user.email);
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if following
    const existingFollow = await db.get(
      'SELECT * FROM issue_followers WHERE issueId = ? AND userId = ?',
      [issueId, user.id]
    );

    if (!existingFollow) {
      return NextResponse.json(
        { error: 'You are not following this issue' },
        { status: 404 }
      );
    }

    // Remove follow relationship
    await db.run(
      'DELETE FROM issue_followers WHERE issueId = ? AND userId = ?',
      [issueId, user.id]
    );

    return NextResponse.json(
      { 
        success: true,
        message: 'Successfully unfollowed issue' 
      }
    );

  } catch (error) {
    console.error('Error unfollowing issue:', error);
    return NextResponse.json(
      { error: 'Failed to unfollow issue' },
      { status: 500 }
    );
  }
} 