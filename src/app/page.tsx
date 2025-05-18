import Link from 'next/link';
import { Metadata } from 'next';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import BaseLayout from '@/components/layouts/BaseLayout';
import Container from '@/components/ui/Container';
import EventCard from '@/components/events/EventCard';
import { FiArrowRight, FiCalendar, FiMapPin, FiUser } from 'react-icons/fi';
import Button from '@/components/ui/Button';
import seedDatabase from '@/lib/seed';

export const metadata: Metadata = {
  title: 'LocaList - Discover Local Events',
  description: 'Find and join local events in your community',
};

interface EventWithRelations {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: string;
  category: string;
  imageUrl: string | null;
  interests: { id: number }[];
  organizer: {
    id: number;
    name: string;
  };
}

export default async function HomePage() {
  const currentUser = await getCurrentUser();
  
  // Seed the database if needed (only in development)
  if (process.env.NODE_ENV !== 'production') {
    try {
      await seedDatabase();
    } catch (error) {
      console.error("Error seeding database:", error);
    }
  }
  
  // Get featured events (recent, approved events)
  let featuredEvents = [];
  
  try {
    featuredEvents = await db.event.findMany({
      where: {
        isApproved: true,
        startDate: {
          gte: new Date(),
        },
      },
      include: {
        interests: true,
        organizer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 6,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    // Continue with empty events array
  }
  
  return (
    <BaseLayout currentUser={currentUser || null}>
      {/* Hero Section */}
      <section className="bg-indigo-600 text-white py-20">
        <Container>
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 space-y-6 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                Discover Exciting Events In Your Community
              </h1>
              <p className="text-lg md:text-xl opacity-90">
                Find and join local events, meet people, and make the most of your neighborhood.
              </p>
              <div className="pt-4 flex flex-wrap gap-4">
                <Link href="/events">
                  <Button variant="secondary" size="lg" className="flex items-center gap-2">
                    <FiCalendar className="h-5 w-5" />
                    Explore Events
                  </Button>
                </Link>
                
                {!currentUser && (
                  <Link href="/register">
                    <Button variant="outline" size="lg" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/40">
                      <FiUser className="h-5 w-5" />
                      Create Account
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <img 
                src="/images/hero-image.jpg" 
                alt="People at a community event"
                className="rounded-lg shadow-xl max-w-full h-auto"
              />
            </div>
          </div>
        </Container>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-slate-900">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">How LocaList Works</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Connecting communities through local events has never been easier
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-4">
                <FiCalendar className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Find Events</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Browse through a variety of local events happening in your community.
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-4">
                <FiMapPin className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Join Easily</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Express your interest with just a click, no lengthy forms required.
              </p>
            </div>
            
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm text-center">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-4">
                <FiUser className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Create Events</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Organize your own events and share them with your local community.
              </p>
            </div>
          </div>
        </Container>
      </section>
      
      {/* Featured Events */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <Container>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Featured Events</h2>
            <Link
              href="/events"
              className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
            >
              View all events <FiArrowRight size={16} />
            </Link>
          </div>
          
          {featuredEvents.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-slate-900 rounded-xl">
              <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No events found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Be the first to create an event in your community!
              </p>
              
              {currentUser && (
                <Link href="/events/create">
                  <Button variant="primary">Create an Event</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredEvents.map((event: EventWithRelations) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  currentUserId={currentUser?.id}
                />
              ))}
            </div>
          )}
        </Container>
      </section>
    </BaseLayout>
  );
}
