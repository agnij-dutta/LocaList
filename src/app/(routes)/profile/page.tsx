import { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import BaseLayout from '@/components/layouts/BaseLayout';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { FiCalendar, FiEdit, FiUser } from 'react-icons/fi';
import db from '@/lib/db';

export const metadata: Metadata = {
  title: 'My Profile - LocaList',
  description: 'View and edit your LocaList profile',
};

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    redirect('/login');
  }
  
  // Get user's registered events
  const registeredEvents = await db.event.findMany({
    where: {
      interests: {
        some: {
          userId: currentUser.id
        }
      },
      startDate: {
        gte: new Date(),
      }
    },
    orderBy: {
      startDate: 'asc'
    },
    take: 5
  });
  
  // Get user's created events
  const createdEvents = await db.event.findMany({
    where: {
      organizerId: currentUser.id
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  });
  
  return (
    <BaseLayout currentUser={currentUser}>
      <Container className="py-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                <div className="mb-4 md:mb-0">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                    {currentUser.name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300">{currentUser.email}</p>
                  {currentUser?.phone && (
                    <p className="text-gray-600 dark:text-gray-300">{currentUser.phone}</p>
                  )}
                </div>
                <Link href="/profile/edit">
                  <Button variant="outline" className="flex items-center gap-2">
                    <FiEdit size={16} />
                    Edit Profile
                  </Button>
                </Link>
              </div>
              
              {currentUser.isVerifiedOrganizer && (
                <div className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm px-3 py-1 rounded-full mb-6">
                  Verified Organizer
                </div>
              )}
              
              <div className="border-t dark:border-gray-700 pt-6">
                <p className="text-gray-600 dark:text-gray-300">
                  Member since {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Upcoming Events */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <FiCalendar className="mr-2" size={20} />
                Upcoming Events
              </h2>
              <Link href="/events">
                <Button variant="primary">View All</Button>
              </Link>
            </div>
            
            {registeredEvents.length === 0 ? (
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-6 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  You haven't registered for any upcoming events yet.
                </p>
                <Link href="/events">
                  <Button variant="primary" className="mt-4">
                    Explore Events
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {registeredEvents.map((event) => (
                  <Link 
                    key={event.id} 
                    href={`/events/${event.id}`}
                    className="block bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {event.title}
                    </h3>
                    <div className="text-gray-600 dark:text-gray-300 text-sm">
                      {new Date(event.startDate).toLocaleString()}
                    </div>
                    <div className="text-gray-600 dark:text-gray-300 text-sm truncate">
                      {event.location}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          {/* Events You Created */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <FiUser className="mr-2" size={20} />
                Events You Created
              </h2>
              <Link href="/events/create">
                <Button variant="primary">Create New</Button>
              </Link>
            </div>
            
            {createdEvents.length === 0 ? (
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-6 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  You haven't created any events yet.
                </p>
                <Link href="/events/create">
                  <Button variant="primary" className="mt-4">
                    Create Event
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {createdEvents.map((event) => (
                  <Link 
                    key={event.id} 
                    href={`/events/${event.id}`}
                    className="block bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {event.title}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        event.isApproved 
                          ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
                          : 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                      }`}>
                        {event.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    <div className="text-gray-600 dark:text-gray-300 text-sm">
                      {new Date(event.startDate).toLocaleString()}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </Container>
    </BaseLayout>
  );
} 