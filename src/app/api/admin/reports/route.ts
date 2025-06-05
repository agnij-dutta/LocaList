import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

// GET /api/admin/reports - List all violation reports with pagination
export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAdmin();
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'all';
    const contentType = searchParams.get('contentType') || 'all';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const skip = (page - 1) * limit;
    const db = await getDb();
    
    // Build base query
    let query = `
      SELECT 
        vr.*,
        reporter.name as reporterName,
        reporter.email as reporterEmail,
        CASE 
          WHEN vr.contentType = 'event' THEN e.title
          WHEN vr.contentType = 'issue' THEN i.title
          ELSE NULL
        END as contentTitle,
        CASE 
          WHEN vr.contentType = 'event' THEN u_event.name
          WHEN vr.contentType = 'issue' THEN u_issue.name
          ELSE NULL
        END as contentAuthorName
      FROM violation_reports vr
      LEFT JOIN users reporter ON vr.reportedById = reporter.id
      LEFT JOIN events e ON vr.contentType = 'event' AND vr.contentId = e.id
      LEFT JOIN issues i ON vr.contentType = 'issue' AND vr.contentId = i.id
      LEFT JOIN users u_event ON e.organizerId = u_event.id
      LEFT JOIN users u_issue ON i.reporterId = u_issue.id
    `;
    
    const queryParams: any[] = [];
    const conditions: string[] = [];
    
    // Add status filter
    if (status !== 'all') {
      conditions.push('vr.status = ?');
      queryParams.push(status);
    }
    
    // Add content type filter
    if (contentType !== 'all') {
      conditions.push('vr.contentType = ?');
      queryParams.push(contentType);
    }
    
    // Add WHERE clause if conditions exist
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Add ORDER BY
    const validSortColumns = ['createdAt', 'status', 'contentType'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY vr.${sortColumn} ${sortDirection}`;
    
    // Add pagination
    query += ` LIMIT ${limit} OFFSET ${skip}`;
    
    // Get reports
    const reports = await db.all(query, ...queryParams);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM violation_reports vr';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    const totalResult = await db.get(countQuery, ...queryParams);
    const totalCount = totalResult.total;
    
    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    );
  }
} 