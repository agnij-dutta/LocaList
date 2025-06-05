"use client";

import Link from 'next/link';
import { FiInfo } from 'react-icons/fi';

interface TabNotificationProps {
  currentTab: string;
  hasFilters: boolean;
  searchTerm?: string;
}

export default function TabNotification({ currentTab, hasFilters, searchTerm }: TabNotificationProps) {
  if (!hasFilters && !searchTerm) return null;

  const oppositeTab = currentTab === 'events' ? 'issues' : 'events';
  const currentTabLabel = currentTab === 'events' ? 'Events' : 'Issues';
  const oppositeTabLabel = oppositeTab === 'events' ? 'Events' : 'Issues';

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <FiInfo className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            You're currently viewing <strong>{currentTabLabel}</strong>.
            {searchTerm && (
              <> Looking for "{searchTerm}" in issues instead?</>
            )}
            {!searchTerm && hasFilters && (
              <> Want to search {oppositeTabLabel.toLowerCase()} instead?</>
            )}
          </p>
          <Link
            href={`?tab=${oppositeTab}&view=list${searchTerm ? `&search=${searchTerm}` : ''}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mt-2"
          >
            Switch to {oppositeTabLabel}
          </Link>
        </div>
      </div>
    </div>
  );
} 