import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { violationReportRepository, eventRepository, issueRepository } from '@/lib/db';

// GET /api/admin/reports/[reportId] - Get specific report details
export async function GET(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const currentUser = await requireAdmin();
    const reportId = parseInt(params.reportId);
    
    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      );
    }
    
    const report = await violationReportRepository.findUnique({
      where: { id: reportId }
    });
    
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ report });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/reports/[reportId] - Update report status and take action
export async function PATCH(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const currentUser = await requireAdmin();
    const reportId = parseInt(params.reportId);
    
    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { status, action } = body;
    
    // Validate status
    const validStatuses = ['pending', 'reviewed', 'resolved', 'dismissed'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }
    
    // Get the report first
    const report = await violationReportRepository.findUnique({
      where: { id: reportId }
    });
    
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }
    
    // Update report status
    const updateData: any = {};
    if (status) {
      updateData.status = status;
    }
    
    const updatedReport = await violationReportRepository.update({
      where: { id: reportId },
      data: updateData
    });
    
    // Take action on the reported content if specified
    if (action === 'flag') {
      if (report.contentType === 'event') {
        await eventRepository.update({
          where: { id: report.contentId },
          data: { isFlagged: true }
        });
      } else if (report.contentType === 'issue') {
        await issueRepository.update({
          where: { id: report.contentId },
          data: { isFlagged: true }
        });
      }
    } else if (action === 'unflag') {
      if (report.contentType === 'event') {
        await eventRepository.update({
          where: { id: report.contentId },
          data: { isFlagged: false }
        });
      } else if (report.contentType === 'issue') {
        await issueRepository.update({
          where: { id: report.contentId },
          data: { isFlagged: false }
        });
      }
    }
    
    return NextResponse.json({ 
      report: updatedReport,
      message: 'Report updated successfully'
    });
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/reports/[reportId] - Delete a report
export async function DELETE(
  request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const currentUser = await requireAdmin();
    const reportId = parseInt(params.reportId);
    
    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      );
    }
    
    // Check if report exists
    const report = await violationReportRepository.findUnique({
      where: { id: reportId }
    });
    
    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }
    
    // Delete the report
    await violationReportRepository.delete({
      where: { id: reportId }
    });
    
    return NextResponse.json({ 
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    );
  }
} 