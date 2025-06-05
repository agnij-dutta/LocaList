import { Metadata } from 'next';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import Container from '@/components/ui/Container';
import BaseLayout from '@/components/layouts/BaseLayout';
import EventsGrid from '@/components/events/EventsGrid';
import Button from '@/components/ui/Button';
import EventCard from '@/components/events/EventCard';
import EventFilters from '@/components/events/EventFilters';
import MapView from '@/components/maps/MapView';
import { eventRepository, issueRepository } from '@/lib/db';
import { FiList, FiMap } from 'react-icons/fi';

export const metadata: Metadata = {
  title: 'Explore - LocaList',
  description: 'Explore community events and issues',
};

// Helper function to get date range boundaries
function getDateRangeBoundaries(dateRange: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  switch (dateRange) {
    case 'today':
      return { start: today, end: tomorrow };
    case 'tomorrow':
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(tomorrow.getDate() + 1);
      return { start: tomorrow, end: dayAfterTomorrow };
    case 'this_week':
      const thisWeekStart = new Date(today);
      const dayOfWeek = today.getDay();
      thisWeekStart.setDate(today.getDate() - dayOfWeek);
      const thisWeekEnd = new Date(thisWeekStart);
      thisWeekEnd.setDate(thisWeekStart.getDate() + 7);
      return { start: thisWeekStart, end: thisWeekEnd };
    case 'this_weekend':
      const saturday = new Date(today);
      const daysUntilSaturday = (6 - today.getDay()) % 7;
      saturday.setDate(today.getDate() + daysUntilSaturday);
      const monday = new Date(saturday);
      monday.setDate(saturday.getDate() + 2);
      return { start: saturday, end: monday };
    case 'next_week':
      const nextWeekStart = new Date(today);
      const daysUntilNextWeek = 7 - today.getDay();
      nextWeekStart.setDate(today.getDate() + daysUntilNextWeek);
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekStart.getDate() + 7);
      return { start: nextWeekStart, end: nextWeekEnd };
    case 'this_month':
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      return { start: thisMonthStart, end: thisMonthEnd };
    case 'next_month':
      const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      const nextMonthEnd = new Date(today.getFullYear(), today.getMonth() + 2, 1);
      return { start: nextMonthStart, end: nextMonthEnd };
    default:
      return null;
  }
}

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

// Simple IssueCard component placeholder
function IssueCard({ issue, currentUserId }: { issue: any; currentUserId?: string | number }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {issue.title}
        </h3>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          issue.status === 'Resolved' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : issue.status === 'In Progress'
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {issue.status}
        </span>
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
        {issue.description}
      </p>
      
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>{issue.category}</span>
        <div className="flex items-center space-x-4">
          <span>👍 {issue.upvotes || 0}</span>
          <span>{new Date(issue.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}

interface PageProps {
  searchParams: Promise<{
    tab?: string;
    view?: string;
    search?: string;
    category?: string;
    dateRange?: string;
    distance?: string;
    latitude?: string;
    longitude?: string;
    status?: string;
  }>;
}

export default async function ExplorePage({ searchParams }: PageProps) {
  const currentUser = await getCurrentUser();
  
  const {
    tab = 'events',
    view = 'list',
    search = '',
    category = '',
    dateRange = '',
    distance = '',
    latitude,
    longitude,
    status = '',
  } = await searchParams;

  // Apply distance filtering if coordinates are provided
  let userLocation = undefined;
  if (latitude && longitude) {
    userLocation = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    };
  }

  const maxDistance = distance ? parseInt(distance) : undefined;

  try {
    let events: any[] = [];
    let issues: any[] = [];

    if (tab === 'events' || tab === 'all') {
      // Build the query conditions for events
      const eventWhere: any = {
    isApproved: true,
        isFlagged: false,
    startDate: {
      gte: new Date(), // Only show upcoming events
    },
  };
  
  // Add search condition if provided
  if (search) {
        eventWhere.OR = [
          { title: { contains: search } },
          { description: { contains: search } },
          { location: { contains: search } },
        ];
      }

      // Add category filter if provided
      if (category && category !== 'all' && category !== '') {
        eventWhere.category = category;
      }

      // Add date range filter if provided
      if (dateRange && dateRange !== '') {
        const dateRangeBoundaries = getDateRangeBoundaries(dateRange);
        if (dateRangeBoundaries) {
          eventWhere.startDate = {
            gte: dateRangeBoundaries.start,
            lt: dateRangeBoundaries.end,
          };
        }
      }

      events = await eventRepository.findMany({
        where: eventWhere,
        include: {
          organizer: true,
          interests: true,
          votes: true,
          followers: true,
          photos: true,
        },
        orderBy: {
          urgency: 'desc'
        },
        userLocation,
        maxDistance,
      });
    }

    if (tab === 'issues' || tab === 'all') {
      // Build the query conditions for issues
      const issueWhere: any = {
        isFlagged: false,
      };

      // Add search condition if provided
      if (search) {
        issueWhere.OR = [
          { title: { contains: search } },
          { description: { contains: search } },
          { location: { contains: search } },
        ];
      }

      // Add category filter if provided (for issues, this would be issue categories)
      if (category && category !== 'all' && category !== '') {
        issueWhere.category = category;
      }

      // Add status filter if provided
      if (status && status !== 'all' && status !== '') {
        issueWhere.status = status;
      }

      issues = await issueRepository.findMany({
        where: issueWhere,
      include: {
          reporter: true,
          photos: true,
          votes: true,
          followers: true,
          statusUpdates: true,
      },
      orderBy: {
          createdAt: 'desc'
      },
        userLocation,
        maxDistance,
    });
  }
  
  return (
    <BaseLayout currentUser={currentUser}>
        <Container className="py-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Explore Community
              </h1>
              <p className="text-muted-foreground text-lg">
                Discover events and track community issues in your area
              </p>
            </div>

            {/* Tab Navigation with View Toggle */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="border-b border-gray-200 dark:border-gray-700">
                  <nav className="-mb-px flex space-x-8">
                    <Link
                      href={`?tab=events&view=${view}${search ? `&search=${search}` : ''}${category ? `&category=${category}` : ''}${dateRange ? `&dateRange=${dateRange}` : ''}${distance ? `&distance=${distance}` : ''}${latitude ? `&latitude=${latitude}` : ''}${longitude ? `&longitude=${longitude}` : ''}`}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        tab === 'events'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Events
                    </Link>
                    <Link
                      href={`?tab=issues&view=${view}${search ? `&search=${search}` : ''}${category ? `&category=${category}` : ''}${status ? `&status=${status}` : ''}${distance ? `&distance=${distance}` : ''}${latitude ? `&latitude=${latitude}` : ''}${longitude ? `&longitude=${longitude}` : ''}`}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        tab === 'issues'
                          ? 'border-primary text-primary'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Issues
                    </Link>
                  </nav>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                  <Link
                    href={`?tab=${tab}&view=list${search ? `&search=${search}` : ''}${category ? `&category=${category}` : ''}${tab === 'issues' && status ? `&status=${status}` : ''}${dateRange ? `&dateRange=${dateRange}` : ''}${distance ? `&distance=${distance}` : ''}${latitude ? `&latitude=${latitude}` : ''}${longitude ? `&longitude=${longitude}` : ''}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      view === 'list'
                        ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <FiList className="h-4 w-4" />
                    List
                  </Link>
                  <Link
                    href={`?tab=${tab}&view=map${search ? `&search=${search}` : ''}${category ? `&category=${category}` : ''}${tab === 'issues' && status ? `&status=${status}` : ''}${dateRange ? `&dateRange=${dateRange}` : ''}${distance ? `&distance=${distance}` : ''}${latitude ? `&latitude=${latitude}` : ''}${longitude ? `&longitude=${longitude}` : ''}`}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      view === 'map'
                        ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <FiMap className="h-4 w-4" />
                    Map
                  </Link>
                </div>
              </div>
            </div>

            {/* Filters */}
            <EventFilters 
              userLocation={userLocation}
              className="mb-8"
            />

            {/* Results Summary */}
            <div className="mb-6">
              <p className="text-muted-foreground">
                {tab === 'events' && (
                  <>
                    {events.length === 0 
                      ? 'No events found matching your criteria'
                      : `Found ${events.length} event${events.length === 1 ? '' : 's'}`
                    }
                  </>
                )}
                {tab === 'issues' && (
                  <>
                    {issues.length === 0 
                      ? 'No issues found matching your criteria'
                      : `Found ${issues.length} issue${issues.length === 1 ? '' : 's'}`
                    }
                  </>
                )}
                {search && ` matching "${search}"`}
                {category && ` in ${category}`}
                {dateRange && ` for ${dateRange.replace('_', ' ')}`}
                {status && ` with status ${status}`}
                {distance && userLocation && ` within ${distance}km`}
            </p>
          </div>
          
            {/* Content based on active tab and view */}
            {view === 'map' ? (
              <MapView
                events={tab === 'events' ? events : []}
                issues={tab === 'issues' ? issues : []}
                userLocation={userLocation}
                className="h-[600px] w-full"
              />
            ) : (
              <>
                {/* List View Content */}
                {tab === 'events' && (
                  <>
                    {events.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="max-w-md mx-auto">
                          <h3 className="text-xl font-medium text-foreground mb-2">
                            No events found
                          </h3>
                          <p className="text-muted-foreground mb-6">
                            Try adjusting your search criteria or filters to find events.
                          </p>
                          {currentUser && (
                            <Link
                              href="/events/create"
                              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            >
                              Create an Event
                            </Link>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event) => (
                          <EventCard 
                            key={event.id} 
                            event={event} 
                            currentUserId={currentUser?.id}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {tab === 'issues' && (
                  <>
                    {issues.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="max-w-md mx-auto">
                          <h3 className="text-xl font-medium text-foreground mb-2">
                            No issues found
                          </h3>
                          <p className="text-muted-foreground mb-6">
                            Try adjusting your search criteria or filters to find issues.
                          </p>
          {currentUser && (
                            <Link
                              href="/issues/create"
                              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            >
                              Report an Issue
            </Link>
          )}
        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {issues.map((issue) => (
                          <IssueCard 
                            key={issue.id} 
                            issue={issue} 
                            currentUserId={currentUser?.id}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </Container>
      </BaseLayout>
    );
  } catch (error) {
    console.error('Error fetching data:', error);
    
    return (
      <BaseLayout currentUser={currentUser}>
        <Container className="py-8 md:py-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <h3 className="text-xl font-medium text-foreground mb-2">
                Something went wrong
              </h3>
              <p className="text-muted-foreground">
                We couldn't load the data. Please try again later.
              </p>
            </div>
          </div>
      </Container>
    </BaseLayout>
  );
  }
} 