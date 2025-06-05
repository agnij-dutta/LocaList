'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { FiFlag, FiShare2, FiUserPlus, FiUserMinus } from 'react-icons/fi';

interface EventActionsProps {
  eventId: number;
  currentUserId?: number;
  isRegistered?: boolean;
  canRegister?: boolean;
  eventTitle?: string;
}

export default function EventActions({ 
  eventId, 
  currentUserId, 
  isRegistered: initialIsRegistered = false,
  canRegister = true,
  eventTitle = 'Community Event'
}: EventActionsProps) {
  const [isRegistered, setIsRegistered] = useState(initialIsRegistered);
  const [loading, setLoading] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!currentUserId) return;
    
    setLoading('register');
    try {
      const response = await fetch(`/api/events/${eventId}/register`, {
        method: isRegistered ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          userName: 'User', // This should come from user data
          userEmail: 'user@example.com', // This should come from user data
          numberOfPeople: 1,
        }),
      });

      if (response.ok) {
        setIsRegistered(!isRegistered);
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to register for event');
      }
    } catch (error) {
      console.error('Error registering for event:', error);
      alert('Failed to register for event');
    } finally {
      setLoading(null);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: eventTitle,
          text: `Check out this event: ${eventTitle}`,
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying URL
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  const handleReport = async () => {
    if (!currentUserId) return;
    
    const reason = prompt('Please provide a reason for reporting this event:');
    if (!reason) return;

    setLoading('report');
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType: 'event',
          contentId: eventId,
          reason,
          description: reason,
        }),
      });

      if (response.ok) {
        alert('Event reported successfully. Thank you for helping keep our community safe.');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to report event');
      }
    } catch (error) {
      console.error('Error reporting event:', error);
      alert('Failed to report event');
    } finally {
      setLoading(null);
    }
  };

  if (!currentUserId) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled>
          <FiUserPlus className="w-4 h-4 mr-2" />
          Register
        </Button>
        <span className="text-sm text-gray-500">Login to interact</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Register Button */}
      {canRegister && (
        <Button
          variant={isRegistered ? 'danger' : 'primary'}
          size="sm"
          className="flex items-center gap-2"
          onClick={handleRegister}
          disabled={loading === 'register'}
        >
          {isRegistered ? <FiUserMinus className="w-4 h-4" /> : <FiUserPlus className="w-4 h-4" />}
          {isRegistered ? 'Unregister' : 'Register'}
        </Button>
      )}

      {/* Share Button */}
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={handleShare}
      >
        <FiShare2 className="w-4 h-4" />
        Share
      </Button>
      
      {/* Report Button */}
      <Button
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
        onClick={handleReport}
        disabled={loading === 'report'}
      >
        <FiFlag className="w-4 h-4" />
        Report
      </Button>
    </div>
  );
} 