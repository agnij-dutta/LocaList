import { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import BaseLayout from '@/components/layouts/BaseLayout';
import Container from '@/components/ui/Container';
import EventsGrid from '@/components/events/EventsGrid';

export const metadata: Metadata = {
  title: 'Explore Events - LocaList',
  description: 'Discover and join local events happening in your community',
};

interface EventsPageProps {
  searchParams: {
    search?: string;
    category?: string;
  };
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const currentUser = await getCurrentUser();
  const resolvedParams = await Promise.resolve(searchParams);
  const { search, category } = resolvedParams;
  
  // Build the query conditions
  const where: any = {
    isApproved: true,
    startDate: {
      gte: new Date(), // Only show upcoming events
    },
  };
  
  // Add search condition if provided
  if (search) {
    where.OR = [
      {
        title: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: search,
          mode: 'insensitive',
        },
      },
      {
        location: {
          contains: search,
          mode: 'insensitive',
        },
      },
    ];
  }
  
  // Add category filter if provided
  if (category) {
    where.category = category;
  }
  
  // Fetch events with conditions
  let events = [];
  
  try {
    events = await db.event.findMany({
      where,
      include: {
        interests: true,
        organizer: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    // Continue with empty events array
  }
  
  return (
    <BaseLayout currentUser={currentUser}>
      <Container className="py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Explore Events</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Discover exciting events happening in your community
          </p>
        </div>
        
        <EventsGrid events={events} currentUserId={currentUser?.id} />
      </Container>
    </BaseLayout>
  );
} 