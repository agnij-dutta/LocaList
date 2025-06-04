import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { FaMapMarkerAlt, FaCalendarAlt, FaUser, FaClock } from 'react-icons/fa';

import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import BaseLayout from '@/components/layouts/BaseLayout';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import RegisterForm from '@/components/events/RegisterForm';

export const generateMetadata = async ({ params }: { params: { id: string } }): Promise<Metadata> => {
  const resolvedParams = await Promise.resolve(params);
  const eventId = parseInt(resolvedParams.id);
  
  if (isNaN(eventId)) {
    return {
      title: 'Event Not Found - LocaList',
    };
  }
  
  try {
    const event = await db.event.findUnique({
      where: { id: eventId },
    });
    
    if (!event) {
      return {
        title: 'Event Not Found - LocaList',
      };
    }
    
    return {
      title: `${event.title} - LocaList`,
      description: event.description.slice(0, 160),
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Event Details - LocaList',
    };
  }
};

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const resolvedParams = await Promise.resolve(params);
  const eventId = parseInt(resolvedParams.id);
  const currentUser = await getCurrentUser();
  
  if (isNaN(eventId)) {
    notFound();
  }
  
  try {
    const event = await db.event.findUnique({
      where: { id: eventId },
      include: {
        organizer: true,
      },
    });
    
    if (!event) {
      notFound();
    }
    
    // Check if current user is registered for this event
    let isRegistered = false;
    let registration = null;
    
    if (currentUser) {
      const userInterest = await db.interest.findMany({
        where: {
          userId: currentUser.id,
          eventId: event.id,
        },
      });
      
      isRegistered = userInterest.length > 0;
      registration = userInterest[0];
    }
    
    // Format dates for display
    const formattedStartDate = format(new Date(event.startDate), 'EEEE, MMMM d, yyyy');
    const formattedStartTime = format(new Date(event.startDate), 'h:mm a');
    const formattedEndTime = event.endDate ? format(new Date(event.endDate), 'h:mm a') : null;
    
    // Check if registration is still open
    const now = new Date();
    const registrationStart = event.registrationStart ? new Date(event.registrationStart) : null;
    const registrationEnd = event.registrationEnd ? new Date(event.registrationEnd) : null;
    
    const registrationIsOpen = (!registrationStart || now >= registrationStart) && 
                              (!registrationEnd || now <= registrationEnd);
    
    return (
      <BaseLayout currentUser={currentUser}>
        <Container className="py-8 md:py-12">
          <Link href="/events" className="inline-flex items-center mb-6 text-blue-600 hover:underline">
            ← Back to Events
          </Link>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">{event.title}</h1>
                <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-300 mb-6">
                  <div className="flex items-center">
                    <FaMapMarkerAlt className="mr-2" />
                    <span>{event.location}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <FaCalendarAlt className="mr-2" />
                    <span>{formattedStartDate}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <FaClock className="mr-2" />
                    <span>
                      {formattedStartTime}
                      {formattedEndTime && ` - ${formattedEndTime}`}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <FaUser className="mr-2" />
                    <span>{event.organizer.name}</span>
                  </div>
                </div>
              </div>
              
              {event.imageUrl && (
                <div className="rounded-xl overflow-hidden">
                  <img 
                    src={event.imageUrl} 
                    alt={event.title} 
                    className="w-full object-cover h-64 md:h-80"
                  />
                </div>
              )}
              
              <div>
                <h2 className="text-xl font-semibold mb-3">About this event</h2>
                <div className="prose dark:prose-invert max-w-none">
                  <p>{event.description}</p>
                </div>
              </div>
              
              <div className="md:hidden mt-6">
                {isRegistered ? (
                  <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-green-800 dark:text-green-100">
                      You're registered!
                    </h3>
                    <p className="text-green-700 dark:text-green-200 mt-1">
                      You've registered for this event on{' '}
                      {registration && format(new Date(registration.createdAt), 'MMMM d, yyyy')}
                    </p>
                  </div>
                ) : (
                  currentUser ? (
                    registrationIsOpen ? (
                      <RegisterForm 
                        eventId={event.id} 
                        userId={parseInt(currentUser.id)} 
                        userName={currentUser.name || ''}
                        userEmail={currentUser.email || ''}
                      />
                    ) : (
                      <div className="bg-amber-50 dark:bg-amber-900 p-4 rounded-lg">
                        <h3 className="text-lg font-medium text-amber-800 dark:text-amber-100">
                          Registration {registrationStart && now < registrationStart ? 'not yet open' : 'closed'}
                        </h3>
                        <p className="text-amber-700 dark:text-amber-200 mt-1">
                          {registrationStart && now < registrationStart 
                            ? `Registration opens on ${format(registrationStart, 'MMMM d, yyyy')}` 
                            : 'The registration period for this event has ended'}
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                      <h3 className="text-lg font-medium text-blue-800 dark:text-blue-100">
                        Sign in to register
                      </h3>
                      <p className="text-blue-700 dark:text-blue-200 mt-1">
                        You need to sign in or create an account to register for this event.
                      </p>
                      <Link href="/login">
                        <Button className="mt-3">Sign In</Button>
                      </Link>
                    </div>
                  )
                )}
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sticky top-24">
                <h2 className="text-xl font-semibold mb-4">Registration</h2>
                
                {isRegistered ? (
                  <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-green-800 dark:text-green-100">
                      You're registered!
                    </h3>
                    <p className="text-green-700 dark:text-green-200 mt-1">
                      You've registered for this event on{' '}
                      {registration && format(new Date(registration.createdAt), 'MMMM d, yyyy')}
                    </p>
                  </div>
                ) : (
                  currentUser ? (
                    registrationIsOpen ? (
                      <RegisterForm 
                        eventId={event.id} 
                        userId={parseInt(currentUser.id)} 
                        userName={currentUser.name || ''}
                        userEmail={currentUser.email || ''}
                      />
                    ) : (
                      <div className="bg-amber-50 dark:bg-amber-900 p-4 rounded-lg">
                        <h3 className="text-lg font-medium text-amber-800 dark:text-amber-100">
                          Registration {registrationStart && now < registrationStart ? 'not yet open' : 'closed'}
                        </h3>
                        <p className="text-amber-700 dark:text-amber-200 mt-1">
                          {registrationStart && now < registrationStart 
                            ? `Registration opens on ${format(registrationStart, 'MMMM d, yyyy')}` 
                            : 'The registration period for this event has ended'}
                        </p>
                      </div>
                    )
                  ) : (
                    <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                      <h3 className="text-lg font-medium text-blue-800 dark:text-blue-100">
                        Sign in to register
                      </h3>
                      <p className="text-blue-700 dark:text-blue-200 mt-1">
                        You need to sign in or create an account to register for this event.
                      </p>
                      <Link href="/login">
                        <Button className="mt-3 w-full">Sign In</Button>
                      </Link>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </Container>
      </BaseLayout>
    );
  } catch (error) {
    console.error('Error fetching event details:', error);
    notFound();
  }
} 