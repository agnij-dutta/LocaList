import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import db from '@/lib/db';
import BaseLayout from '@/components/layouts/BaseLayout';
import Container from '@/components/ui/Container';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { FiCheck, FiX, FiEdit, FiTrash2, FiFlag, FiUsers } from 'react-icons/fi';
import Button from '@/components/ui/Button';

// Define types for the data structure
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

export const metadata: Metadata = {
  title: 'Admin Dashboard - LocaList',
  description: 'Manage events and users',
};

export default async function AdminPage() {
  const currentUser = await requireAdmin();
  
  // Fetch pending events
  let pendingEvents: Event[] = [];
  
  try {
    pendingEvents = await db.event.findMany({
      where: {
        isApproved: false,
      },
      include: {
        organizer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    console.error('Error fetching pending events:', error);
  }
  
  // Fetch recent approved events
  let recentEvents: Event[] = [];
  
  try {
    recentEvents = await db.event.findMany({
      where: {
        isApproved: true,
      },
      include: {
        organizer: true,
        interests: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });
  } catch (error) {
    console.error('Error fetching recent events:', error);
  }
  
  return (
    <BaseLayout currentUser={currentUser}>
      <Container className="py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage events, users, and site content
          </p>
        </div>
        
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
                          <button className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
                            <FiCheck className="mr-1" /> Approve
                          </button>
                          <button className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700">
                            <FiX className="mr-1" /> Reject
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-medium">Organizer:</span> {event.organizer.name}
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
                            <div className="text-sm text-gray-500 dark:text-gray-400">{event.organizer.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-400">{formatDate(event.startDate)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500 dark:text-gray-400">{event.interests.length}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                <FiEdit className="h-4 w-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
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
      </Container>
    </BaseLayout>
  );
} 