'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { FiCheck, FiX, FiEdit, FiTrash2, FiUsers, FiFlag } from 'react-icons/fi';
import { formatDate } from '@/lib/utils';

interface User {
  id: number;
  name: string;
  email: string;
}

interface Interest {
  id: number;
  userId: number;
  eventId: number;
}

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate?: string;
  category: string;
  imageUrl?: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  organizerId: number;
  organizer: User;
  interests: Interest[];
}

interface AdminDashboardProps {
  pendingEvents: Event[];
  recentEvents: Event[];
}

export default function AdminDashboard({ pendingEvents: initialPendingEvents, recentEvents: initialRecentEvents }: AdminDashboardProps) {
  const [pendingEvents, setPendingEvents] = useState(initialPendingEvents);
  const [recentEvents, setRecentEvents] = useState(initialRecentEvents);
  const [loading, setLoading] = useState<string | null>(null);

  const handleApprove = async (eventId: number) => {
    setLoading(`approve-${eventId}`);
    try {
      const response = await fetch(`/api/events/${eventId}/approve`, {
        method: 'PATCH',
      });

      if (response.ok) {
        // Move event from pending to recent
        const approvedEvent = pendingEvents.find(e => e.id === eventId);
        if (approvedEvent) {
          setPendingEvents(prev => prev.filter(e => e.id !== eventId));
          setRecentEvents(prev => [{ ...approvedEvent, isApproved: true }, ...prev]);
        }
      } else {
        console.error('Failed to approve event');
      }
    } catch (error) {
      console.error('Error approving event:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (eventId: number) => {
    setLoading(`reject-${eventId}`);
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPendingEvents(prev => prev.filter(e => e.id !== eventId));
      } else {
        console.error('Failed to reject event');
      }
    } catch (error) {
      console.error('Error rejecting event:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleEdit = (eventId: number) => {
    // For now, redirect to event page or open modal
    window.open(`/events/${eventId}`, '_blank');
  };

  const handleDelete = async (eventId: number) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    setLoading(`delete-${eventId}`);
    try {
      const response = await fetch(`/api/admin/events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRecentEvents(prev => prev.filter(e => e.id !== eventId));
      } else {
        console.error('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Sidebar - Admin Menu */}
      <div className="lg:col-span-3">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Admin Actions</h2>
          <nav className="space-y-2">
            <a href="#pending-events" className="block px-4 py-2 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 font-medium">
              Pending Events
            </a>
            <a href="#recent-events" className="block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
              Recent Events
            </a>
            <a href="#users" className="block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
              Manage Users
            </a>
            <a href="#reports" className="block px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
              Flagged Content
            </a>
          </nav>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="lg:col-span-9">
        {/* Pending Events Section */}
        <section id="pending-events" className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pending Events</h2>
            <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-sm font-medium dark:bg-amber-900 dark:text-amber-200">
              {pendingEvents.length} Awaiting Approval
            </span>
          </div>
          
          {pendingEvents.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm text-center">
              <p className="text-gray-600 dark:text-gray-400">No pending events to approve</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingEvents.map((event: Event) => (
                <div key={event.id} className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{event.title}</h3>
                    <div className="flex space-x-2 mt-2 sm:mt-0">
                      <button 
                        onClick={() => handleApprove(event.id)}
                        disabled={loading === `approve-${event.id}`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        <FiCheck className="mr-1" /> 
                        {loading === `approve-${event.id}` ? 'Approving...' : 'Approve'}
                      </button>
                      <button 
                        onClick={() => handleReject(event.id)}
                        disabled={loading === `reject-${event.id}`}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                      >
                        <FiX className="mr-1" /> 
                        {loading === `reject-${event.id}` ? 'Rejecting...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium">Organizer:</span> {event.organizer?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium">Date:</span> {formatDate(event.startDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium">Location:</span> {event.location}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-medium">Submitted:</span> {formatDate(event.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Link href={`/events/${event.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        
        {/* Recent Events Section */}
        <section id="recent-events" className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recently Approved Events</h2>
          
          {recentEvents.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm text-center">
              <p className="text-gray-600 dark:text-gray-400">No approved events yet</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Event</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Organizer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Attendees</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {recentEvents.map((event: Event) => (
                    <tr key={event.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{event.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{event.organizer?.name || 'Unknown'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{formatDate(event.startDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">{event.interests.length}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleEdit(event.id)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Edit Event"
                          >
                            <FiEdit className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(event.id)}
                            disabled={loading === `delete-${event.id}`}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                            title="Delete Event"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        
        {/* Users Overview */}
        <section id="users" className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">User Management</h2>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              View and manage user accounts, verify organizers, or ban users who violate community guidelines.
            </p>
            <Link href="/admin/users">
              <Button variant="outline">
                <FiUsers className="mr-2" /> View All Users
              </Button>
            </Link>
          </div>
        </section>
        
        {/* Flagged Content */}
        <section id="reports" className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Flagged Content</h2>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Review content that has been flagged by users for inappropriate material or policy violations.
            </p>
            <Link href="/admin/reports">
              <Button variant="outline">
                <FiFlag className="mr-2" /> View Reports
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
} 