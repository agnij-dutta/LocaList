'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { FiThumbsUp, FiFlag, FiShare2, FiHeart } from 'react-icons/fi';

interface IssueActionsProps {
  issueId: number;
  currentUserId?: number;
  initialUpvotes: number;
  initialFollowersCount: number;
  userVote?: { voteType: string } | null;
  isFollowing?: boolean;
}

export default function IssueActions({ 
  issueId, 
  currentUserId, 
  initialUpvotes, 
  initialFollowersCount,
  userVote,
  isFollowing: initialIsFollowing = false
}: IssueActionsProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [hasVoted, setHasVoted] = useState(!!userVote);
  const [loading, setLoading] = useState<string | null>(null);

  const handleVote = async () => {
    if (!currentUserId) return;
    
    setLoading('vote');
    try {
      const response = await fetch(`/api/issues/${issueId}/vote`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setHasVoted(data.voted);
        setUpvotes(prev => data.voted ? prev + 1 : prev - 1);
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId) return;
    
    setLoading('follow');
    try {
      const response = await fetch(`/api/issues/${issueId}/follow`, {
        method: isFollowing ? 'DELETE' : 'POST',
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('Error following issue:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Community Issue',
          text: 'Check out this community issue',
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
    
    const reason = prompt('Please provide a reason for reporting this issue:');
    if (!reason) return;

    setLoading('report');
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentType: 'issue',
          contentId: issueId,
          reason,
          description: reason,
        }),
      });

      if (response.ok) {
        alert('Issue reported successfully. Thank you for helping keep our community safe.');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to report issue');
      }
    } catch (error) {
      console.error('Error reporting issue:', error);
      alert('Failed to report issue');
    } finally {
      setLoading(null);
    }
  };

  if (!currentUserId) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled>
          <FiThumbsUp className="w-4 h-4 mr-2" />
          {upvotes}
        </Button>
        <span className="text-sm text-gray-500">Login to interact</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Vote Button */}
      <Button
        variant={hasVoted ? 'primary' : 'outline'}
        size="sm"
        className="flex items-center gap-2"
        onClick={handleVote}
        disabled={loading === 'vote'}
      >
        <FiThumbsUp className="w-4 h-4" />
        {upvotes}
      </Button>
      
      {/* Follow Button */}
      <Button
        variant={isFollowing ? 'primary' : 'outline'}
        size="sm"
        className="flex items-center gap-2"
        onClick={handleFollow}
        disabled={loading === 'follow'}
      >
        <FiHeart className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
        {isFollowing ? 'Unfollow' : 'Follow'} ({followersCount})
      </Button>

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