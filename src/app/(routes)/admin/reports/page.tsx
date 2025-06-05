'use client';

import { useState, useEffect } from 'react';
import BaseLayout from '@/components/layouts/BaseLayout';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { FiFlag, FiCheck, FiX, FiEye, FiTrash2 } from 'react-icons/fi';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface Report {
  id: number;
  reportedById: number;
  contentType: string;
  contentId: number;
  reason: string;
  description?: string;
  status: string;
  createdAt: string;
  reviewedAt?: string;
  reporterName: string;
  reporterEmail: string;
  contentTitle?: string;
  contentAuthorName?: string;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter,
        contentType: contentTypeFilter,
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/admin/reports?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch reports');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [pagination.page, statusFilter, contentTypeFilter, sortBy, sortOrder]);

  const updateReportStatus = async (reportId: number, status: string, action?: string) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, action }),
      });

      if (response.ok) {
        fetchReports(); // Refresh the list
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update report');
      }
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Failed to update report');
    }
  };

  const deleteReport = async (reportId: number) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchReports(); // Refresh the list
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete report');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      reviewed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      dismissed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors] || statusColors.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getContentTypeBadge = (contentType: string) => {
    const typeColors = {
      event: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      issue: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[contentType as keyof typeof typeColors] || typeColors.event}`}>
        {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
      </span>
    );
  };

  return (
    <BaseLayout currentUser={{ isAdmin: true }}>
      <Container className="py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Flagged Content Reports</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Review and manage reported content and violations
              </p>
            </div>
            <Link href="/admin">
              <Button variant="outline">
                ← Back to Admin Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content Type
              </label>
              <select
                value={contentTypeFilter}
                onChange={(e) => setContentTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              >
                <option value="all">All Types</option>
                <option value="event">Events</option>
                <option value="issue">Issues</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="status-asc">Status A-Z</option>
                <option value="contentType-asc">Type A-Z</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                className="w-full"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">No reports found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Report Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Content
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Reporter
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {report.reason}
                          </div>
                          {report.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {report.description}
                            </div>
                          )}
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Reported {formatDate(report.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            {getContentTypeBadge(report.contentType)}
                          </div>
                          {report.contentTitle && (
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {report.contentTitle}
                            </div>
                          )}
                          {report.contentAuthorName && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              by {report.contentAuthorName}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {report.reporterName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {report.reporterEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(report.status)}
                        {report.reviewedAt && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Reviewed {formatDate(report.reviewedAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          {/* View Content */}
                          <Link 
                            href={`/${report.contentType}s/${report.contentId}`}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="View Content"
                          >
                            <FiEye className="w-4 h-4" />
                          </Link>

                          {/* Flag Content */}
                          <button
                            onClick={() => updateReportStatus(report.id, 'resolved', 'flag')}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Flag Content"
                          >
                            <FiFlag className="w-4 h-4" />
                          </button>

                          {/* Approve/Dismiss */}
                          {report.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateReportStatus(report.id, 'dismissed')}
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                title="Dismiss Report"
                              >
                                <FiCheck className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => updateReportStatus(report.id, 'resolved', 'flag')}
                                className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                                title="Resolve & Flag"
                              >
                                <FiX className="w-4 h-4" />
                              </button>
                            </>
                          )}

                          {/* Delete Report */}
                          <button
                            onClick={() => deleteReport(report.id)}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            title="Delete Report"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white dark:bg-slate-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing{' '}
                      <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{pagination.totalCount}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-600 dark:text-gray-300"
                      >
                        Previous
                      </button>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pagination.page === pageNum
                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-900 dark:border-indigo-400 dark:text-indigo-200'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 dark:bg-slate-800 dark:border-slate-600 dark:text-gray-300'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                        disabled={pagination.page === pagination.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-800 dark:border-slate-600 dark:text-gray-300"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{pagination.totalCount}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Reports</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">{reports.filter(r => r.status === 'pending').length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-green-600">{reports.filter(r => r.status === 'resolved').length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Resolved</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-gray-600">{reports.filter(r => r.status === 'dismissed').length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Dismissed</div>
          </div>
        </div>
      </Container>
    </BaseLayout>
  );
} 