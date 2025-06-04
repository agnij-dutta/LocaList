import Link from 'next/link';
import { Metadata } from 'next';
import db from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import BaseLayout from '@/components/layouts/BaseLayout';
import Container from '@/components/ui/Container';
import EventCard from '@/components/events/EventCard';
import { 
  FiArrowRight, 
  FiCalendar, 
  FiMapPin, 
  FiUser, 
  FiAlertTriangle,
  FiUsers,
  FiBell,
  FiShield,
  FiHeart,
  FiTrendingUp
} from 'react-icons/fi';
import Button from '@/components/ui/Button';

export const metadata: Metadata = {
  title: 'Community Pulse - Connect, Report, Engage',
  description: 'Your location-aware platform for community interaction, events, and issue reporting',
};

interface EventWithRelations {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: string;
  category: string;
  imageUrl: string | null;
  isUrgent: boolean;
  upvotes: number;
  interests: { id: number }[];
  organizer: {
    id: number;
    name: string;
    isVerifiedOrganizer: boolean;
  };
}

interface IssueWithRelations {
  id: number;
  title: string;
  description: string;
  location: string;
  category: string;
  status: string;
  upvotes: number;
  createdAt: string;
  isAnonymous: boolean;
  reporter?: {
    id: number;
    name: string;
  };
}

export default async function HomePage() {
  const currentUser = await getCurrentUser();
  
  // Get featured events (recent, approved events)
  let featuredEvents = [];
  let featuredIssues = [];
  
  try {
    // Test database connection by attempting to create it
    const dbTest = await db.event.findMany({
      where: {
        isApproved: true,
        isFlagged: false,
        startDate: {
          gte: new Date().toISOString(),
        },
      },
      include: {
        interests: true,
        organizer: true,
      },
      orderBy: {
        urgency: 'desc',
      },
      take: 6,
    });
    featuredEvents = dbTest;

    // Get recent community issues
    const dbIssues = await db.issue.findMany({
      where: {
        isFlagged: false,
      },
      include: {
        reporter: true,
      },
      orderBy: {
        upvotes: 'desc',
      },
      take: 4,
    });
    featuredIssues = dbIssues;

  } catch (error) {
    console.error("Database connection error:", error);
    // Continue with empty arrays
  }
  
  return (
    <BaseLayout currentUser={currentUser || null}>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 text-white py-20">
        <Container>
          <div className="flex flex-col lg:flex-row items-center">
            <div className="lg:w-1/2 space-y-6 mb-10 lg:mb-0">
              <div className="inline-flex items-center bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
                <FiMapPin className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Location-Aware Community Platform</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Connect, Report, 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400"> Engage</span>
              </h1>
              <p className="text-lg md:text-xl opacity-90 leading-relaxed">
                Join Community Pulse - where neighbors connect through local events, 
                report community issues, and build stronger neighborhoods together.
              </p>
              <div className="pt-4 flex flex-wrap gap-4">
                <Link href="/events">
                  <Button variant="secondary" size="lg" className="flex items-center gap-2 bg-white text-indigo-600 hover:bg-gray-100">
                    <FiCalendar className="h-5 w-5" />
                    Explore Events
                  </Button>
                </Link>
                
                <Link href="/issues">
                  <Button variant="outline" size="lg" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/40">
                    <FiAlertTriangle className="h-5 w-5" />
                    Report Issues
                  </Button>
                </Link>
              </div>
            </div>
            <div className="lg:w-1/2 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg blur-lg opacity-30"></div>
                <div className="relative bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/20 rounded-lg p-4 text-center">
                      <FiUsers className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-2xl font-bold">5km</div>
                      <div className="text-sm opacity-80">Radius</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-4 text-center">
                      <FiCalendar className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-2xl font-bold">Local</div>
                      <div className="text-sm opacity-80">Events</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-4 text-center">
                      <FiAlertTriangle className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-2xl font-bold">Issue</div>
                      <div className="text-sm opacity-80">Reports</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-4 text-center">
                      <FiHeart className="h-8 w-8 mx-auto mb-2" />
                      <div className="text-2xl font-bold">Safe</div>
                      <div className="text-sm opacity-80">Community</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-gray-50 dark:bg-slate-900">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">Platform Features</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Community Pulse brings together event discovery, issue reporting, and community engagement 
              in one location-aware platform designed for modern neighborhoods.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border dark:border-slate-700">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                <FiCalendar className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Local Events</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Discover garage sales, sports matches, community classes, and local festivals within your 3-5km radius.
              </p>
            </div>
            
            <div className="group bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border dark:border-slate-700">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                <FiAlertTriangle className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Issue Reporting</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Report potholes, lighting issues, water problems, and safety concerns with photo evidence and status tracking.
              </p>
            </div>
            
            <div className="group bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border dark:border-slate-700">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                <FiTrendingUp className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Community Voting</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Upvote important issues and popular events to help prioritize community needs and interests.
              </p>
            </div>
            
            <div className="group bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border dark:border-slate-700">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                <FiMapPin className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Location-Aware</h3>
              <p className="text-gray-600 dark:text-gray-300">
                GPS-based filtering ensures you only see events and issues relevant to your immediate neighborhood.
              </p>
            </div>
            
            <div className="group bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border dark:border-slate-700">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                <FiBell className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Smart Notifications</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get reminders for events you're attending and updates on issues you're following or reported.
              </p>
            </div>
            
            <div className="group bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border dark:border-slate-700">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                <FiShield className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Safety & Moderation</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Community guidelines enforcement, content moderation, and verified organizer system for trust.
              </p>
            </div>
          </div>
        </Container>
      </section>
      
      {/* Featured Events & Issues */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Featured Events */}
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FiCalendar className="h-8 w-8 text-indigo-600" />
                  Featured Events
                </h2>
                <Link
                  href="/events"
                  className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline font-medium"
                >
                  View all <FiArrowRight size={16} />
                </Link>
              </div>
              
              {featuredEvents.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600">
                  <FiCalendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No events yet</h3>
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
                <div className="space-y-4">
                  {featuredEvents.slice(0, 3).map((event: EventWithRelations) => (
                    <div key={event.id} className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {event.isUrgent && (
                            <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                              URGENT
                            </span>
                          )}
                          <span className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2 py-1 rounded-full">
                            {event.category}
                          </span>
                          {event.organizer.isVerifiedOrganizer && (
                            <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <FiHeart className="h-4 w-4" />
                          <span className="text-sm">{event.upvotes}</span>
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{event.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{event.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <FiMapPin className="h-3 w-3" />
                          {event.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <FiUsers className="h-3 w-3" />
                          {event.interests.length} interested
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Featured Issues */}
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FiAlertTriangle className="h-8 w-8 text-red-600" />
                  Community Issues
                </h2>
                <Link
                  href="/issues"
                  className="text-red-600 dark:text-red-400 flex items-center gap-1 hover:underline font-medium"
                >
                  View all <FiArrowRight size={16} />
                </Link>
              </div>
              
              {featuredIssues.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-slate-600">
                  <FiAlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No issues reported</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Help improve your community by reporting issues!
                  </p>
                  
                  <Link href="/issues/create">
                    <Button variant="secondary">Report an Issue</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {featuredIssues.slice(0, 3).map((issue: IssueWithRelations) => (
                    <div key={issue.id} className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                            issue.status === 'Reported' ? 'bg-yellow-100 text-yellow-800' :
                            issue.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {issue.status}
                          </span>
                          <span className="bg-gray-200 text-gray-800 text-xs font-medium px-2 py-1 rounded-full">
                            {issue.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <FiTrendingUp className="h-4 w-4" />
                          <span className="text-sm">{issue.upvotes}</span>
                        </div>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{issue.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{issue.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <FiMapPin className="h-3 w-3" />
                          {issue.location}
                        </div>
                        <div>
                          {issue.isAnonymous ? 'Anonymous' : issue.reporter?.name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-indigo-600 text-white">
        <Container>
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">Ready to Connect with Your Community?</h2>
            <p className="text-lg opacity-90 mb-8">
              Join Community Pulse today and start making a difference in your neighborhood. 
              Whether you're organizing events or reporting issues, every action builds a stronger community.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {!currentUser ? (
                <>
                  <Link href="/register">
                    <Button variant="secondary" size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">
                      Get Started
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                      Sign In
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/events/create">
                    <Button variant="secondary" size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">
                      Create Event
                    </Button>
                  </Link>
                  <Link href="/issues/create">
                    <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                      Report Issue
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </Container>
      </section>
    </BaseLayout>
  );
}
