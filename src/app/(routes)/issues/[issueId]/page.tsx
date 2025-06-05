import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { issueRepository } from '@/lib/db';
import Container from '@/components/ui/Container';
import BaseLayout from '@/components/layouts/BaseLayout';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { FiArrowLeft, FiMapPin, FiClock, FiUser, FiThumbsUp, FiFlag, FiEdit, FiTrash2 } from 'react-icons/fi';

interface PageProps {
  params: Promise<{ issueId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { issueId } = await params;
  
  try {
    const issue = await issueRepository.findUnique({
      where: { id: parseInt(issueId) }
    });

    return {
      title: issue ? `${issue.title} - LocaList` : 'Issue Not Found',
      description: issue?.description.substring(0, 160) || 'Community issue details',
    };
  } catch {
    return {
      title: 'Issue Not Found - LocaList',
      description: 'The requested issue could not be found.',
    };
  }
}

export default async function IssueDetailPage({ params }: PageProps) {
  const { issueId } = await params;
  const currentUser = await getCurrentUser();

  try {
    const issue = await issueRepository.findUnique({
      where: { id: parseInt(issueId) },
      include: {
        reporter: true,
        votes: true,
        photos: true,
        statusUpdates: true,
        followers: true,
      }
    });

    if (!issue) {
      notFound();
    }

    // Calculate voting stats
    const upvotes = issue.votes?.filter((vote: any) => vote.voteType === 'up').length || 0;
    const downvotes = issue.votes?.filter((vote: any) => vote.voteType === 'down').length || 0;
    const userVote = currentUser ? issue.votes?.find((vote: any) => vote.userId === currentUser.id) : null;

    // Get status color
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'Resolved': return 'bg-green-500';
        case 'In Progress': return 'bg-yellow-500';
        case 'Under Review': return 'bg-blue-500';
        default: return 'bg-red-500';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'Resolved': return '✅';
        case 'In Progress': return '🔄';
        case 'Under Review': return '👀';
        default: return '🔴';
      }
    };

    return (
      <BaseLayout currentUser={currentUser}>
        <Container className="py-8 md:py-12">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Link 
                href="/events?tab=issues"
                className="inline-flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 mb-4"
              >
                <FiArrowLeft className="w-4 h-4 mr-2" />
                Back to Issues
              </Link>
              
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {issue.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-white font-medium ${getStatusColor(issue.status)}`}>
                      {getStatusIcon(issue.status)} {issue.status}
                    </span>
                    <span className="flex items-center">
                      <FiMapPin className="w-4 h-4 mr-1" />
                      {issue.location}
                    </span>
                    <span className="flex items-center">
                      <FiClock className="w-4 h-4 mr-1" />
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <FiUser className="w-4 h-4 mr-1" />
                      {issue.isAnonymous ? 'Anonymous' : `Reported by: ${issue.reporter?.name || 'Unknown'}`}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {currentUser && (
                    <>
                      <Button
                        variant={userVote?.voteType === 'up' ? 'primary' : 'outline'}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <FiThumbsUp className="w-4 h-4" />
                        {upvotes}
                      </Button>
                      
                      <Button variant="outline" size="sm">
                        <FiFlag className="w-4 h-4 mr-2" />
                        Report Spam
                      </Button>

                      {(currentUser.isAdmin || currentUser.id === issue.reporterId) && (
                        <>
                          <Button variant="outline" size="sm">
                            <FiEdit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button variant="danger" size="sm">
                            <FiTrash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Issue Photos */}
                {issue.photos && issue.photos.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
                      {issue.photos.map((photo: any, index: number) => (
                        <div key={index} className="aspect-video bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                          <img
                            src={photo.url}
                            alt={`Issue photo ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Description
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {issue.description}
                  </p>
                </div>

                {/* Activity Timeline */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Activity
                  </h2>
                  <div className="space-y-4">
                    {/* Initial Report */}
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <span className="text-red-600 dark:text-red-400 text-sm">📝</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white font-medium">
                          {new Date(issue.createdAt).toLocaleDateString()} at {new Date(issue.createdAt).toLocaleTimeString()} - Reported by {issue.isAnonymous ? 'Anonymous' : 'user'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Issue reported and submitted for review
                        </p>
                      </div>
                    </div>

                    {/* Status Updates */}
                    {issue.statusUpdates && issue.statusUpdates.map((update: any, index: number) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400 text-sm">🔄</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900 dark:text-white font-medium">
                            {new Date(update.createdAt).toLocaleDateString()} at {new Date(update.createdAt).toLocaleTimeString()} - Status updated
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Status changed to "{update.status}"{update.comment && `: ${update.comment}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Location Map */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <FiMapPin className="w-5 h-5 mr-2" />
                    Location
                  </h3>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      📍 {issue.location}
                    </p>
                    
                    {/* Placeholder for map */}
                    <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <FiMapPin className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-500">
                          {issue.latitude && issue.longitude ? (
                            <>
                              Coordinates:<br />
                              {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}
                            </>
                          ) : (
                            'Location coordinates not available'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Issue Stats */}
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Issue Statistics
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Upvotes</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        ✅ {upvotes}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Category</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {issue.category}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Priority</span>
                      <span className={`font-semibold ${
                        issue.priority === 'High' ? 'text-red-600 dark:text-red-400' :
                        issue.priority === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-green-600 dark:text-green-400'
                      }`}>
                        {issue.priority || 'Medium'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Followers</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {issue.followers?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                {currentUser && (
                  <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Quick Actions
                    </h3>
                    <div className="space-y-3">
                      <Button className="w-full" size="sm">
                        Follow Issue
                      </Button>
                      <Button variant="outline" className="w-full" size="sm">
                        Share Issue
                      </Button>
                      <Link href="/issues/create">
                        <Button variant="outline" className="w-full" size="sm">
                          Report Similar Issue
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Container>
      </BaseLayout>
    );
  } catch (error) {
    console.error('Error fetching issue:', error);
    notFound();
  }
} 