import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getServerSession } from "next-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { issueId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: 'Authentication required' },
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

    if (user.isBanned) {
      return NextResponse.json(
        { message: 'User is banned' },
        { status: 403 }
      );
    }

    const issueId = parseInt(params.issueId);
    
    if (isNaN(issueId)) {
      return NextResponse.json(
        { message: 'Invalid issue ID' },
        { status: 400 }
      );
    }

    // Check if issue exists
    const issue = await db.issue.findUnique({
      where: { id: issueId }
    });

    if (!issue) {
      return NextResponse.json(
        { message: 'Issue not found' },
        { status: 404 }
      );
    }

    if (issue.isFlagged) {
      return NextResponse.json(
        { message: 'This issue is currently under review' },
        { status: 400 }
      );
    }

    // Check if user already voted
    const existingVote = await db.issueVote.findUnique({
      where: { issueId, userId: user.id }
    });

    if (existingVote) {
      // Remove vote (unlike)
      await db.issueVote.delete({
        where: { issueId, userId: user.id }
      });

      return NextResponse.json({ 
        message: 'Vote removed',
        voted: false 
      });
    } else {
      // Add vote (like)
      await db.issueVote.create({
        data: { issueId, userId: user.id }
      });

      return NextResponse.json({ 
        message: 'Vote added',
        voted: true 
      });
    }
  } catch (error) {
    console.error('Error handling vote:', error);
    return NextResponse.json(
      { message: 'Error handling vote', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 