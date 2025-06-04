"use client";

interface AdminNotificationBadgeProps {
  isAdmin: boolean;
  count?: number;
  className?: string;
}

export default function AdminNotificationBadge({ isAdmin, count = 0, className = "" }: AdminNotificationBadgeProps) {
  // Only render if user is admin and there's a count
  if (!isAdmin || count === 0) {
    return null;
  }

  return (
    <> </>
  );
} 