"use client";

import { useState } from 'react';
import Link from 'next/link';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardFooter, 
  CardTitle, 
  CardImage 
} from '@/components/ui/Card';
import { formatDate, formatCategory, truncateText } from '@/lib/utils';
import { FiCalendar, FiMapPin, FiTag, FiUsers } from 'react-icons/fi';
import Button from '@/components/ui/Button';

interface EventCardProps {
  event: {
    id: number;
    title: string;
    description: string;
    location: string;
    startDate: Date | string;
    category: string;
    imageUrl: string | null;
    interests: { id: number }[];
  };
  currentUserId?: string | number;
}

const defaultImage = '/images/event-placeholder.jpg';

export default function EventCard({ event, currentUserId }: EventCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);
  
  return (
    <Link 
      href={`/events/${event.id}`}
      className="block"
    >
      <Card 
        clickable 
        className="h-full transition-all duration-300 hover:shadow-xl"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <CardImage 
          src={event.imageUrl || defaultImage} 
          alt={event.title}
          height={180}
        />
        
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{event.title}</CardTitle>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
              {formatCategory(event.category)}
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            {truncateText(event.description, 100)}
          </p>
          
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <FiCalendar className="mr-1" />
            <span>{typeof event.startDate === 'string' ? formatDate(event.startDate) : formatDate(event.startDate)}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <FiMapPin className="mr-1" />
            <span>{event.location}</span>
          </div>
        </CardContent>
        
        <CardFooter className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 pt-0">
          <div className="flex items-center">
            <FiUsers className="mr-1" />
            <span>{event.interests.length} interested</span>
          </div>
          
          {isHovered && (
            <Button size="sm" variant="primary" className="ml-2">
              View Details
            </Button>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
} 