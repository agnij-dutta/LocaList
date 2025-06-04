'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import { 
  FiAlertTriangle, 
  FiMapPin, 
  FiFilter, 
  FiPlus,
  FiTrendingUp,
  FiClock,
  FiUser,
  FiEye,
  FiMap,
  FiList
} from 'react-icons/fi';

interface Issue {
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
  photos?: Array<{
    id: number;
    imageUrl: string;
  }>;
  votes?: Array<{
    id: number;
    userId: number;
  }>;
  statusUpdates?: Array<{
    id: number;
    status: string;
    comment?: string;
    createdAt: string;
  }>;
}

const ISSUE_CATEGORIES = [
  'Roads',
  'Lighting',
  'Water Supply',
  'Cleanliness',
  'Public Safety',
  'Obstructions'
];

const ISSUE_STATUSES = [
  'Reported',
  'In Progress',
  'Resolved'
];

export default function IssuesPage() {
  const searchParams = useSearchParams();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<{latitude: number; longitude: number} | null>(null);
  const [maxDistance, setMaxDistance] = useState(5);

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [selectedCategory, selectedStatus, userLocation, maxDistance]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }

      if (userLocation) {
        params.append('latitude', userLocation.latitude.toString());
        params.append('longitude', userLocation.longitude.toString());
        params.append('maxDistance', maxDistance.toString());
      }

      const response = await fetch(`/api/issues?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        setIssues(data.issues || []);
      } else {
        console.error('Failed to fetch issues');
        setIssues([]);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Reported':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Roads': 'bg-red-100 text-red-800',
      'Lighting': 'bg-yellow-100 text-yellow-800',
      'Water Supply': 'bg-blue-100 text-blue-800',
      'Cleanliness': 'bg-green-100 text-green-800',
      'Public Safety': 'bg-purple-100 text-purple-800',
      'Obstructions': 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Container className="py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-2">
              <FiAlertTriangle className="h-8 w-8 text-red-600" />
              Community Issues
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Report and track community issues in your neighborhood
            </p>
          </div>
          
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            {/* View Mode Toggle */}
            <div className="flex bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-l-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                <FiList className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`p-2 rounded-r-lg transition-colors ${
                  viewMode === 'map'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                <FiMap className="h-5 w-5" />
              </button>
            </div>

            <Link href="/issues/create">
              <Button variant="primary" className="flex items-center gap-2">
                <FiPlus className="h-5 w-5" />
                Report Issue
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <FiFilter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Categories</option>
                {ISSUE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Statuses</option>
                {ISSUE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Distance Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Distance (km)
              </label>
              <select
                value={maxDistance}
                onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                className="w-full p-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              >
                <option value={1}>1 km</option>
                <option value={3}>3 km</option>
                <option value={5}>5 km</option>
              </select>
            </div>

            {/* Location Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <div className={`p-2 rounded-lg text-sm ${
                userLocation 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
              }`}>
                {userLocation ? (
                  <div className="flex items-center gap-1">
                    <FiMapPin className="h-4 w-4" />
                    Location detected
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <FiMapPin className="h-4 w-4" />
                    Detecting location...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Issues List/Map */}
        {viewMode === 'list' ? (
          <div>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Loading issues...</p>
              </div>
            ) : issues.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-slate-600">
                <FiAlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
                  No issues found
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {userLocation 
                    ? "No issues match your current filters." 
                    : "Enable location access to see nearby issues."}
                </p>
                <Link href="/issues/create">
                  <Button variant="primary">Report the First Issue</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border dark:border-slate-700 hover:shadow-md transition-shadow overflow-hidden"
                  >
                    {/* Issue Header */}
                    <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getStatusColor(issue.status)}`}>
                            {issue.status}
                          </span>
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getCategoryColor(issue.category)}`}>
                            {issue.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <FiTrendingUp className="h-4 w-4" />
                          <span className="text-sm font-medium">{issue.upvotes}</span>
                        </div>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                        {issue.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <FiMapPin className="h-3 w-3" />
                          {issue.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <FiClock className="h-3 w-3" />
                          {formatDate(issue.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Issue Content */}
                    <div className="p-4">
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
                        {issue.description}
                      </p>

                      {/* Issue Photos */}
                      {issue.photos && issue.photos.length > 0 && (
                        <div className="flex gap-2 mb-4 overflow-x-auto">
                          {issue.photos.slice(0, 3).map((photo) => (
                            <img
                              key={photo.id}
                              src={photo.imageUrl}
                              alt="Issue photo"
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                          ))}
                          {issue.photos.length > 3 && (
                            <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                +{issue.photos.length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Issue Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <FiUser className="h-3 w-3" />
                          {issue.isAnonymous ? 'Anonymous' : issue.reporter?.name}
                        </div>
                        
                        <Link href={`/issues/${issue.id}`}>
                          <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium flex items-center gap-1">
                            <FiEye className="h-4 w-4" />
                            View Details
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Map View Placeholder
          <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 p-8 text-center">
            <FiMap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
              Map View Coming Soon
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Interactive map view with issue markers will be available soon.
            </p>
            <button
              onClick={() => setViewMode('list')}
              className="text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Switch to List View
            </button>
          </div>
        )}
      </Container>
    </div>
  );
} 