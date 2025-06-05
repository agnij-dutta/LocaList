'use client';

import { useState, useEffect } from 'react';
import BaseLayout from '@/components/layouts/BaseLayout';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { FiSearch, FiEdit2, FiTrash2, FiUserCheck, FiUserX, FiShield, FiUser } from 'react-icons/fi';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  isEmailVerified: boolean;
  isAdmin: boolean;
  isVerifiedOrganizer: boolean;
  isBanned: boolean;
  createdAt: string;
  updatedAt: string;
  organizedEvents: number;
  reportedIssues: number;
  eventRegistrations: number;
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        role: roleFilter,
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, search, roleFilter, sortBy, sortOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const updateUserRole = async (userId: number, field: string, value: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        fetchUsers(); // Refresh the list
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  const deleteUser = async (userId: number, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchUsers(); // Refresh the list
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const getRoleBadges = (user: User) => {
    const badges = [];
    
    if (user.isAdmin) {
      badges.push(
        <span key="admin" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <FiShield className="w-3 h-3 mr-1" />
          Admin
        </span>
      );
    }
    
    if (user.isVerifiedOrganizer) {
      badges.push(
        <span key="organizer" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
          <FiUserCheck className="w-3 h-3 mr-1" />
          Verified Organizer
        </span>
      );
    }
    
    if (user.isBanned) {
      badges.push(
        <span key="banned" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          <FiUserX className="w-3 h-3 mr-1" />
          Banned
        </span>
      );
    }
    
    if (badges.length === 0) {
      badges.push(
        <span key="user" className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <FiUser className="w-3 h-3 mr-1" />
          User
        </span>
      );
    }
    
    return badges;
  };

  return (
    <BaseLayout currentUser={{ id: '1', isAdmin: true, isVerifiedOrganizer: false }}>
      <Container className="py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
              <p className="text-gray-600 dark:text-gray-300">
                Manage user accounts, roles, and permissions
              </p>
            </div>
            <Link href="/admin">
              <Button variant="outline">
                ← Back to Admin Dashboard
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 transition-colors"
                >
                  <FiSearch className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
              >
                <option value="all">All Users</option>
                <option value="admin">Admins</option>
                <option value="organizer">Verified Organizers</option>
                <option value="banned">Banned Users</option>
              </select>
            </div>

            <div>
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
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="email-asc">Email A-Z</option>
                <option value="email-desc">Email Z-A</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Roles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {getRoleBadges(user)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div>Events: {user.organizedEvents}</div>
                        <div>Issues: {user.reportedIssues}</div>
                        <div>Registrations: {user.eventRegistrations}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {/* Admin Toggle */}
                          <button
                            onClick={() => updateUserRole(user.id, 'isAdmin', !user.isAdmin)}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              user.isAdmin
                                ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                            title={user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                          >
                            {user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                          </button>

                          {/* Organizer Toggle */}
                          <button
                            onClick={() => updateUserRole(user.id, 'isVerifiedOrganizer', !user.isVerifiedOrganizer)}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              user.isVerifiedOrganizer
                                ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
                            }`}
                            title={user.isVerifiedOrganizer ? 'Remove Organizer' : 'Verify Organizer'}
                          >
                            {user.isVerifiedOrganizer ? 'Unverify' : 'Verify'}
                          </button>

                          {/* Ban Toggle */}
                          <button
                            onClick={() => updateUserRole(user.id, 'isBanned', !user.isBanned)}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              user.isBanned
                                ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200'
                                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}
                            title={user.isBanned ? 'Unban User' : 'Ban User'}
                          >
                            {user.isBanned ? 'Unban' : 'Ban'}
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => deleteUser(user.id, user.name)}
                            className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200"
                            title="Delete User"
                          >
                            <FiTrash2 className="w-3 h-3" />
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
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-red-600">{users.filter(u => u.isAdmin).length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Admins</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{users.filter(u => u.isVerifiedOrganizer).length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Verified Organizers</div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
            <div className="text-2xl font-bold text-gray-600">{users.filter(u => u.isBanned).length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Banned Users</div>
          </div>
        </div>
      </Container>
    </BaseLayout>
  );
} 