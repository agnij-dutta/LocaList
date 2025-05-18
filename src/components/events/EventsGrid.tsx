"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import EventCard from '@/components/events/EventCard';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { FiSearch } from 'react-icons/fi';

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: Date | string;
  category: string;
  imageUrl: string | null;
  interests: { id: number }[];
}

interface EventsGridProps {
  events: Event[];
  currentUserId?: string | number;
}

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'garage_sale', label: 'Garage Sales' },
  { value: 'sports', label: 'Sports Matches' },
  { value: 'class', label: 'Community Classes' },
  { value: 'volunteer', label: 'Volunteer Opportunities' },
  { value: 'exhibition', label: 'Exhibitions' },
  { value: 'festival', label: 'Festivals & Celebrations' },
];

export default function EventsGrid({ events, currentUserId }: EventsGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (category) params.set('category', category);
    
    const queryString = params.toString();
    router.push(`/events${queryString ? `?${queryString}` : ''}`);
  };
  
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:max-w-md"
            />
          </div>
          
          <div className="w-full md:w-48">
            <Select
              options={CATEGORY_OPTIONS}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            className="btn-primary flex items-center justify-center md:w-auto"
          >
            <FiSearch className="mr-2" />
            Search
          </button>
        </form>
      </div>
      
      {events.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No events found</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
} 