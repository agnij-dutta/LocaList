import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getDb } from '@/lib/db';

// GET /api/admin/users - List all users with pagination
export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAdmin();
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || 'all';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const skip = (page - 1) * limit;
    const db = await getDb();
    
    // Build base query
    let query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.isEmailVerified,
        u.isAdmin,
        u.isVerifiedOrganizer,
        u.isBanned,
        u.createdAt,
        u.updatedAt,
        COUNT(DISTINCT e.id) as organizedEvents,
        COUNT(DISTINCT i.id) as reportedIssues,
        COUNT(DISTINCT er.id) as eventRegistrations
      FROM users u
      LEFT JOIN events e ON u.id = e.organizerId
      LEFT JOIN issues i ON u.id = i.reporterId
      LEFT JOIN event_registrations er ON u.id = er.userId
    `;
    
    const queryParams: any[] = [];
    const conditions: string[] = [];
    
    // Add search condition
    if (search) {
      conditions.push('(u.name LIKE ? OR u.email LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }
    
    // Add role filter
    if (role === 'admin') {
      conditions.push('u.isAdmin = 1');
    } else if (role === 'organizer') {
      conditions.push('u.isVerifiedOrganizer = 1');
    } else if (role === 'banned') {
      conditions.push('u.isBanned = 1');
    }
    
    // Add WHERE clause if conditions exist
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Add GROUP BY
    query += ' GROUP BY u.id';
    
    // Add ORDER BY
    const validSortColumns = ['createdAt', 'name', 'email'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY u.${sortColumn} ${sortDirection}`;
    
    // Add pagination
    query += ` LIMIT ${limit} OFFSET ${skip}`;
    
    // Get users
    const users = await db.all(query, ...queryParams);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(DISTINCT u.id) as total FROM users u';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    const totalResult = await db.get(countQuery, ...queryParams.slice(0, search ? 2 : 0));
    const totalCount = totalResult.total;
    
    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
} 