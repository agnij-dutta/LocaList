"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { FiFilter, FiX, FiSearch, FiMapPin, FiCalendar, FiTag } from 'react-icons/fi';
import Button from '@/components/ui/Button';

// Filter schema
const filterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  dateRange: z.string().optional(),
  distance: z.string().optional(),
});

type FilterValues = z.infer<typeof filterSchema>;

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'Garage Sales', label: 'Garage Sales' },
  { value: 'Sports Matches', label: 'Sports Matches' },
  { value: 'Community Classes', label: 'Community Classes' },
  { value: 'Volunteer Opportunities', label: 'Volunteer Opportunities' },
  { value: 'Exhibitions', label: 'Exhibitions' },
  { value: 'Small Festivals', label: 'Small Festivals' },
  { value: 'Lost & Found', label: 'Lost & Found' },
];

const DATE_RANGE_OPTIONS = [
  { value: '', label: 'Any Time' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_weekend', label: 'This Weekend' },
  { value: 'next_week', label: 'Next Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'next_month', label: 'Next Month' },
];

const DISTANCE_OPTIONS = [
  { value: '', label: 'Any Distance' },
  { value: '1', label: 'Within 1 km' },
  { value: '3', label: 'Within 3 km' },
  { value: '5', label: 'Within 5 km' },
  { value: '10', label: 'Within 10 km' },
  { value: '25', label: 'Within 25 km' },
  { value: '50', label: 'Within 50 km' },
];

interface EventFiltersProps {
  userLocation?: { latitude: number; longitude: number } | null;
  onFiltersChange?: (filters: FilterValues) => void;
  className?: string;
}

export default function EventFilters({ 
  userLocation, 
  onFiltersChange,
  className = '' 
}: EventFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FilterValues>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      dateRange: searchParams.get('dateRange') || '',
      distance: searchParams.get('distance') || '',
    },
  });

  // Watch all form values
  const watchedValues = watch();

  // Update active filters state
  useEffect(() => {
    const hasFilters = Object.values(watchedValues).some(value => value && value.trim() !== '');
    setHasActiveFilters(hasFilters);
  }, [watchedValues]);

  // Apply filters when form values change
  useEffect(() => {
    const subscription = watch((values) => {
      if (onFiltersChange) {
        onFiltersChange(values);
      }
      updateURL(values);
    });

    return () => subscription.unsubscribe();
  }, [watch, onFiltersChange]);

  const updateURL = (filters: FilterValues) => {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== '') {
        params.set(key, value);
      }
    });

    // Add location parameters if available
    if (userLocation) {
      params.set('latitude', userLocation.latitude.toString());
      params.set('longitude', userLocation.longitude.toString());
    }

    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;
    
    router.push(newUrl, { scroll: false });
  };

  const onSubmit = (data: FilterValues) => {
    // Form submission is handled by the watch effect
    setIsExpanded(false);
  };

  const clearAllFilters = () => {
    reset({
      search: '',
      category: '',
      dateRange: '',
      distance: '',
    });
    setIsExpanded(false);
  };

  const clearFilter = (filterName: keyof FilterValues) => {
    setValue(filterName, '');
  };

  return (
    <div className={`bg-card border rounded-lg shadow-sm ${className}`}>
      {/* Mobile Filter Toggle */}
      <div className="p-4 border-b md:hidden">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2"
        >
          <FiFilter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="bg-primary text-primary-foreground rounded-full text-xs px-2 py-1">
              Active
            </span>
          )}
        </Button>
      </div>

      {/* Filter Form */}
      <form 
        onSubmit={handleSubmit(onSubmit)}
        className={`${isExpanded || 'hidden md:block'}`}
      >
        <div className="p-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              {...register('search')}
              type="text"
              placeholder="Search events..."
              className="input-field pl-10"
            />
            {watchedValues.search && (
              <button
                type="button"
                onClick={() => clearFilter('search')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <FiX className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <FiTag className="h-4 w-4" />
                Category
              </label>
              <div className="relative">
                <select
                  {...register('category')}
                  className="input-field appearance-none cursor-pointer"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {watchedValues.category && (
                  <button
                    type="button"
                    onClick={() => clearFilter('category')}
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <FiCalendar className="h-4 w-4" />
                When
              </label>
              <div className="relative">
                <select
                  {...register('dateRange')}
                  className="input-field appearance-none cursor-pointer"
                >
                  {DATE_RANGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {watchedValues.dateRange && (
                  <button
                    type="button"
                    onClick={() => clearFilter('dateRange')}
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Distance Filter */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <FiMapPin className="h-4 w-4" />
                Distance
              </label>
              <div className="relative">
                <select
                  {...register('distance')}
                  className="input-field appearance-none cursor-pointer"
                  disabled={!userLocation}
                >
                  {DISTANCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {!userLocation && (
                  <div className="absolute inset-0 bg-muted/50 rounded flex items-center justify-center">
                    <span className="text-xs text-muted-foreground text-center px-2">
                      Enable location to filter by distance
                    </span>
                  </div>
                )}
                {watchedValues.distance && userLocation && (
                  <button
                    type="button"
                    onClick={() => clearFilter('distance')}
                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Active Filters:</span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearAllFilters}
                  className="text-muted-foreground hover:text-foreground h-auto p-1 text-sm"
                >
                  Clear All
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {watchedValues.search && (
                  <span className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-3 py-1 text-sm">
                    Search: "{watchedValues.search}"
                    <button
                      type="button"
                      onClick={() => clearFilter('search')}
                      className="hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <FiX className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {watchedValues.category && (
                  <span className="inline-flex items-center gap-1 bg-secondary/10 text-secondary-foreground rounded-full px-3 py-1 text-sm">
                    {CATEGORY_OPTIONS.find(opt => opt.value === watchedValues.category)?.label}
                    <button
                      type="button"
                      onClick={() => clearFilter('category')}
                      className="hover:bg-secondary/20 rounded-full p-0.5"
                    >
                      <FiX className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {watchedValues.dateRange && (
                  <span className="inline-flex items-center gap-1 bg-accent/10 text-accent-foreground rounded-full px-3 py-1 text-sm">
                    {DATE_RANGE_OPTIONS.find(opt => opt.value === watchedValues.dateRange)?.label}
                    <button
                      type="button"
                      onClick={() => clearFilter('dateRange')}
                      className="hover:bg-accent/20 rounded-full p-0.5"
                    >
                      <FiX className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {watchedValues.distance && userLocation && (
                  <span className="inline-flex items-center gap-1 bg-muted/10 text-muted-foreground rounded-full px-3 py-1 text-sm">
                    {DISTANCE_OPTIONS.find(opt => opt.value === watchedValues.distance)?.label}
                    <button
                      type="button"
                      onClick={() => clearFilter('distance')}
                      className="hover:bg-muted/20 rounded-full p-0.5"
                    >
                      <FiX className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
} 