"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface TabNavigationProps {
  currentTab: string;
  currentView: string;
}

export default function TabNavigation({ currentTab, currentView }: TabNavigationProps) {
  const searchParams = useSearchParams();
  
  const search = searchParams.get('search') || '';
  const distance = searchParams.get('distance') || '';
  const latitude = searchParams.get('latitude') || '';
  const longitude = searchParams.get('longitude') || '';
  
  // Only keep tab-specific filters when switching
  const getEventsUrl = () => {
    const params = new URLSearchParams();
    params.set('tab', 'events');
    params.set('view', currentView);
    
    if (search) params.set('search', search);
    if (distance) params.set('distance', distance);
    if (latitude) params.set('latitude', latitude);
    if (longitude) params.set('longitude', longitude);
    
    // Keep event-specific filters if we're already on events tab
    if (currentTab === 'events') {
      const category = searchParams.get('category');
      const dateRange = searchParams.get('dateRange');
      if (category) params.set('category', category);
      if (dateRange) params.set('dateRange', dateRange);
    }
    
    return `?${params.toString()}`;
  };
  
  const getIssuesUrl = () => {
    const params = new URLSearchParams();
    params.set('tab', 'issues');
    params.set('view', currentView);
    
    if (search) params.set('search', search);
    if (distance) params.set('distance', distance);
    if (latitude) params.set('latitude', latitude);
    if (longitude) params.set('longitude', longitude);
    
    // Keep issue-specific filters if we're already on issues tab
    if (currentTab === 'issues') {
      const category = searchParams.get('category');
      const status = searchParams.get('status');
      if (category) params.set('category', category);
      if (status) params.set('status', status);
    }
    
    return `?${params.toString()}`;
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="-mb-px flex space-x-8">
        <Link
          href={getEventsUrl()}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            currentTab === 'events'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Events
        </Link>
        <Link
          href={getIssuesUrl()}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            currentTab === 'issues'
              ? 'border-primary text-primary'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Issues
        </Link>
      </nav>
    </div>
  );
} 