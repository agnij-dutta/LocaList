"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FiUpload, FiX, FiMapPin, FiAlertTriangle } from 'react-icons/fi';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';

// Define the form schema
const issueFormSchema = z.object({
  title: z.string().min(5, "Issue title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  category: z.string().min(1, "Category is required"),
  location: z.string().min(5, "Location description is required"),
  isAnonymous: z.boolean(),
});

type IssueFormValues = z.infer<typeof issueFormSchema>;

const CATEGORY_OPTIONS = [
  { value: 'Roads', label: 'Roads & Infrastructure' },
  { value: 'Lighting', label: 'Street Lighting' },
  { value: 'Water Supply', label: 'Water Supply & Drainage' },
  { value: 'Cleanliness', label: 'Cleanliness & Waste' },
  { value: 'Public Safety', label: 'Public Safety' },
  { value: 'Obstructions', label: 'Obstructions' },
];

interface IssueFormProps {
  onSubmit: (data: FormData) => Promise<{ success: boolean; issueId?: number; error?: string }>;
  initialData?: IssueFormValues;
  isSubmitting?: boolean;
}

export default function IssueForm({ onSubmit, initialData, isSubmitting: propSubmitting = false }: IssueFormProps) {
  const router = useRouter();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(propSubmitting);
  const [error, setError] = useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationCoords, setLocationCoords] = useState<{latitude: number; longitude: number} | null>(null);

  const defaultValues: IssueFormValues = {
    title: '',
    description: '',
    location: '',
    category: '',
    isAnonymous: false,
    ...initialData,
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IssueFormValues>({
    resolver: zodResolver(issueFormSchema),
    defaultValues,
  });

  const isAnonymous = watch('isAnonymous');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxFiles = 5;
    
    if (imageFiles.length + files.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} photos`);
      return;
    }

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    // Generate previews
    const newPreviews = [...imagePreviews];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === newFiles.length) {
          setImagePreviews(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

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

  const processForm = async (data: IssueFormValues) => {
    if (!locationCoords) {
      setError('Please get your current location or enter location manually');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    // Create form data
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value.toString());
      }
    });
    
    // Add coordinates
    formData.append('latitude', locationCoords.latitude.toString());
    formData.append('longitude', locationCoords.longitude.toString());
    
    // Add images
    imageFiles.forEach((file, index) => {
      formData.append(`image_${index}`, file);
    });
    
    try {
      const result = await onSubmit(formData);
      
      if (result.success && result.issueId) {
        // Navigate to the explore page with issues tab on success
        router.push('/events?tab=issues');
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

  return (
    <form onSubmit={handleSubmit(processForm)} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-md">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Issue Title *
          </label>
          <Input
            id="title"
            {...register('title')}
            placeholder="Brief description of the issue"
            error={errors.title?.message}
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category *
          </label>
          <Select
            id="category"
            {...register('category')}
            options={CATEGORY_OPTIONS}
            placeholder="Select issue category"
            error={errors.category?.message}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Detailed Description *
          </label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="Please provide a detailed description of the issue, including any relevant context"
            rows={5}
            error={errors.description?.message}
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Location *
          </label>
          <div className="flex gap-2">
            <Input
              id="location"
              {...register('location')}
              placeholder="Describe the exact location"
              error={errors.location?.message}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <FiMapPin className="h-4 w-4" />
              {isGettingLocation ? 'Getting...' : 'Get Location'}
            </Button>
          </div>
          {locationCoords && (
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              ✓ Location detected: {locationCoords.latitude.toFixed(4)}, {locationCoords.longitude.toFixed(4)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Photos (Optional - up to 5 photos)
          </label>
          
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img 
                    src={preview} 
                    alt={`Preview ${index + 1}`} 
                    className="w-full h-32 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border-2 border-gray-300 border-dashed rounded-md p-6">
            <div className="text-center">
              <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label
                  htmlFor="photos"
                  className="cursor-pointer bg-indigo-600 py-2 px-4 rounded-md font-medium text-white hover:bg-indigo-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                >
                  <span>Upload Photos</span>
                  <input
                    id="photos"
                    name="photos"
                    type="file"
                    className="sr-only"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 10MB each</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex">
            <FiAlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Reporting Guidelines
              </h3>
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                <ul className="list-disc list-inside space-y-1">
                  <li>Only report genuine community issues</li>
                  <li>Provide accurate location information</li>
                  <li>Include photos when possible for faster resolution</li>
                  <li>Be respectful in your description</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isAnonymous"
            {...register('isAnonymous')}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="isAnonymous" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Report anonymously (your name will not be shown)
          </label>
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
        <Button type="submit" disabled={isSubmitting || !locationCoords}>
          {isSubmitting ? 'Submitting...' : 'Report Issue'}
        </Button>
      </div>
    </form>
  );
} 