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
import LocationRequestBanner from '@/components/ui/LocationRequestBanner';
import { eventRepository, issueRepository } from '@/lib/db';
import { FiList, FiMap } from 'react-icons/fi';
import TabNavigation from '@/components/ui/TabNavigation';
import Pagination from '@/components/ui/Pagination';

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
    <Link href={`/issues/${issue.id}`} className="block">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
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
    </Link>
  );
}

interface PageProps {
  searchParams: {
    tab?: string;
    view?: string;
    search?: string;
    category?: string;
    dateRange?: string;
    distance?: string;
    latitude?: string;
    longitude?: string;
    status?: string;
    page?: string;
  };
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
    page = '1',
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
  const currentPage = parseInt(page);
  const itemsPerPage = 9;
  const offset = (currentPage - 1) * itemsPerPage;

  try {
    let events: any[] = [];
    let issues: any[] = [];
    let totalEvents = 0;
    let totalIssues = 0;

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

      // Get total count for pagination
      totalEvents = await eventRepository.count({
        where: eventWhere,
        userLocation,
        maxDistance,
      });

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
        take: itemsPerPage,
        skip: offset,
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

      // Get total count for pagination
      totalIssues = await issueRepository.count({
        where: issueWhere,
        userLocation,
        maxDistance,
      });

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
        take: itemsPerPage,
        skip: offset,
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
                <TabNavigation currentTab={tab} currentView={view} />

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
              currentTab={tab}
              userLocation={userLocation}
              className="mb-8"
            />

            {/* Location Request Notice */}
            {!userLocation && <LocationRequestBanner tab={tab} />}

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
              <div className="h-96 rounded-lg overflow-hidden">
                <MapView
                  events={tab === 'events' ? events : []}
                  issues={tab === 'issues' ? issues : []}
                  userLocation={userLocation}
                />
              </div>
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
                              Create Event
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

                    {/* Pagination for Events */}
                    {events.length > 0 && (
                      <Pagination 
                        currentPage={currentPage}
                        totalItems={totalEvents}
                        itemsPerPage={itemsPerPage}
                        baseUrl="/events"
                      />
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
                      <>
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <p className="text-muted-foreground">
                              Found {issues.length} issue{issues.length === 1 ? '' : 's'}
                            </p>
                          </div>
          {currentUser && (
                            <Link
                              href="/issues/create"
                              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                            >
                              + Report Issue
            </Link>
          )}
        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {issues.map((issue) => (
                            <IssueCard 
                              key={issue.id} 
                              issue={issue} 
                              currentUserId={currentUser?.id}
                            />
                          ))}
                        </div>

                        {/* Pagination for Issues */}
                        <Pagination 
                          currentPage={currentPage}
                          totalItems={totalIssues}
                          itemsPerPage={itemsPerPage}
                          baseUrl="/events"
                        />
                      </>
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