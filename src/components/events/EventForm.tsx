"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FaUpload } from 'react-icons/fa';
import { FiMapPin } from 'react-icons/fi';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';

// Define the form schema
const eventFormSchema = z.object({
  title: z.string().min(3, "Event name must be at least 3 characters"),
  location: z.string().min(3, "Location is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  startDate: z.string().refine(val => {
    if (!val) return false;
    const selectedDate = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  }, "Start date cannot be in the past"),
  startTime: z.string().refine(val => !!val, "Start time is required"),
  endDate: z.string().optional().refine(val => {
    if (!val) return true; // Optional field
    const selectedDate = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  }, "End date cannot be in the past"),
  endTime: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  registrationStartDate: z.string().optional(),
  registrationStartTime: z.string().optional(),
  registrationEndDate: z.string().optional(),
  registrationEndTime: z.string().optional(),
}).refine(data => {
  // Validate end date is after start date
  if (data.endDate && data.startDate) {
    const startDateTime = new Date(`${data.startDate}T${data.startTime || '00:00'}`);
    const endDateTime = new Date(`${data.endDate}T${data.endTime || '23:59'}`);
    return endDateTime > startDateTime;
  }
  return true;
}, {
  message: "End date and time must be after start date and time",
  path: ["endDate"]
});

type EventFormValues = z.infer<typeof eventFormSchema>;

const CATEGORY_OPTIONS = [
  { value: 'Garage Sales', label: 'Garage Sales' },
  { value: 'Sports Matches', label: 'Sports Matches' },
  { value: 'Community Classes', label: 'Community Classes' },
  { value: 'Volunteer Opportunities', label: 'Volunteer Opportunities' },
  { value: 'Exhibitions', label: 'Exhibitions' },
  { value: 'Small Festivals', label: 'Small Festivals' },
  { value: 'Lost & Found', label: 'Lost & Found' },
];

interface EventFormProps {
  onSubmit: (data: FormData) => Promise<{ success: boolean; eventId?: number; error?: string }>;
  initialData?: EventFormValues;
  isSubmitting?: boolean;
}

export default function EventForm({ onSubmit, initialData, isSubmitting: propSubmitting = false }: EventFormProps) {
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(propSubmitting);
  const [error, setError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{latitude: number; longitude: number} | null>(null);

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = format(new Date(), 'yyyy-MM-dd');
  const currentTime = format(new Date(), 'HH:mm');

  const defaultValues: Partial<EventFormValues> = {
    title: '',
    location: '',
    description: '',
    startDate: today,
    startTime: currentTime,
    category: '',
    ...initialData,
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues,
  });

  const watchStartDate = watch('startDate');
  const watchStartTime = watch('startTime');

  // Reverse geocoding function
  const reverseGeocode = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=YOUR_API_KEY&limit=1&no_annotations=1&language=en`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          const components = result.components;
          
          // Build a readable address
          const parts = [];
          if (components.road) parts.push(components.road);
          if (components.neighbourhood) parts.push(components.neighbourhood);
          if (components.suburb) parts.push(components.suburb);
          if (components.city || components.town || components.village) {
            parts.push(components.city || components.town || components.village);
          }
          if (components.state) parts.push(components.state);
          
          return parts.join(', ') || result.formatted;
        }
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
    
    // Fallback to coordinates if reverse geocoding fails
    return `Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  };

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setError(null);

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocationCoords(coords);
        
        try {
          // Get readable location name
          const locationName = await reverseGeocode(coords.latitude, coords.longitude);
          setValue('location', locationName);
        } catch (error) {
          // Fallback to coordinates
          setValue('location', `Location: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
        }
        
        setIsGettingLocation(false);
      },
      (error) => {
        setError('Unable to get your location. Please enter location manually.');
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processForm = async (data: EventFormValues) => {
    if (!locationCoords) {
      setError('Please get your current location or enter location manually');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    // Additional validation for current date and time
    const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
    const now = new Date();
    
    if (startDateTime <= now) {
      setError('Event start date and time must be in the future');
      setIsSubmitting(false);
      return;
    }
    
    // Create form data
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });

    // Add coordinates
    formData.append('latitude', locationCoords.latitude.toString());
    formData.append('longitude', locationCoords.longitude.toString());
    
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    try {
      const result = await onSubmit(formData);
      
      if (result.success && result.eventId) {
        // Navigate to the event page on success
        router.push(`/events/${result.eventId}`);
      } else if (result.error) {
        setError(result.error);
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue('category', e.target.value);
  };

  return (
    <form onSubmit={handleSubmit(processForm)} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-md">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-foreground mb-1">
            Event Name
          </label>
          <Input
            id="title"
            {...register('title')}
            placeholder="Enter event name"
            error={errors.title?.message}
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">
            Location
          </label>
          <div className="flex gap-2">
            <Input
              id="location"
              {...register('location')}
              placeholder="Enter location or use GPS"
              error={errors.location?.message}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={getCurrentLocation}
              isLoading={isGettingLocation}
              className="px-4 py-2 whitespace-nowrap"
            >
              <FiMapPin className="w-4 h-4 mr-2" />
              {isGettingLocation ? 'Getting...' : 'Use GPS'}
            </Button>
          </div>
          {locationCoords && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              ✓ Location coordinates captured: {locationCoords.latitude.toFixed(4)}, {locationCoords.longitude.toFixed(4)}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
            Description
          </label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Enter event description"
            rows={4}
            error={errors.description?.message}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-foreground mb-1">
              Start Date
            </label>
            <Input
              type="date"
              id="startDate"
              {...register('startDate')}
              min={today}
              error={errors.startDate?.message}
            />
          </div>
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-foreground mb-1">
              Start Time
            </label>
            <Input
              type="time"
              id="startTime"
              {...register('startTime')}
              error={errors.startTime?.message}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-foreground mb-1">
              End Date (Optional)
            </label>
            <Input
              type="date"
              id="endDate"
              {...register('endDate')}
              min={watchStartDate || today}
              error={errors.endDate?.message}
            />
          </div>
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-foreground mb-1">
              End Time (Optional)
            </label>
            <Input
              type="time"
              id="endTime"
              {...register('endTime')}
              error={errors.endTime?.message}
            />
          </div>
        </div>

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-foreground mb-1">
            Photos
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-border border-dashed rounded-md">
            <div className="space-y-1 text-center">
              {imagePreview ? (
                <div className="mb-3">
                  <img src={imagePreview} alt="Preview" className="mx-auto h-32 object-cover rounded-md" />
                </div>
              ) : (
                <FaUpload className="mx-auto h-12 w-12 text-muted-foreground" />
              )}
              <div className="flex text-sm text-muted-foreground">
                <label
                  htmlFor="image-upload"
                  className="relative cursor-pointer bg-purple-600 py-2 px-4 rounded-md font-medium text-white hover:bg-purple-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-purple-500"
                >
                  <span>Upload Photos</span>
                  <input
                    id="image-upload"
                    name="image-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-foreground mb-1">
            Category
          </label>
          <Select
            id="category"
            {...register('category')}
            options={CATEGORY_OPTIONS}
            placeholder="Select a category"
            error={errors.category?.message}
          />
        </div>

        <div>
          <h3 className="text-lg font-medium text-foreground mb-2">Registration Period (Optional)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="registrationStartDate" className="block text-sm font-medium text-foreground mb-1">
                Registration Start Date
              </label>
              <Input
                type="date"
                id="registrationStartDate"
                {...register('registrationStartDate')}
                min={today}
                error={errors.registrationStartDate?.message}
              />
            </div>
            <div>
              <label htmlFor="registrationStartTime" className="block text-sm font-medium text-foreground mb-1">
                Registration Start Time
              </label>
              <Input
                type="time"
                id="registrationStartTime"
                {...register('registrationStartTime')}
                error={errors.registrationStartTime?.message}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="registrationEndDate" className="block text-sm font-medium text-foreground mb-1">
                Registration End Date
              </label>
              <Input
                type="date"
                id="registrationEndDate"
                {...register('registrationEndDate')}
                min={today}
                error={errors.registrationEndDate?.message}
              />
            </div>
            <div>
              <label htmlFor="registrationEndTime" className="block text-sm font-medium text-foreground mb-1">
                Registration End Time
              </label>
              <Input
                type="time"
                id="registrationEndTime"
                {...register('registrationEndTime')}
                error={errors.registrationEndTime?.message}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Event'}
        </Button>
      </div>
    </form>
  );
} 