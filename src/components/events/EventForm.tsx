import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FaUpload } from 'react-icons/fa';

import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';

// Define the form schema
const eventFormSchema = z.object({
  title: z.string().min(3, "Event name must be at least 3 characters"),
  location: z.string().min(3, "Location is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  startDate: z.string().refine(val => !!val, "Start date is required"),
  startTime: z.string().refine(val => !!val, "Start time is required"),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  registrationStartDate: z.string().optional(),
  registrationStartTime: z.string().optional(),
  registrationEndDate: z.string().optional(),
  registrationEndTime: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

const CATEGORY_OPTIONS = [
  { value: 'sports', label: 'Sports' },
  { value: 'music', label: 'Music & Concerts' },
  { value: 'food', label: 'Food & Drink' },
  { value: 'arts', label: 'Arts & Culture' },
  { value: 'networking', label: 'Networking' },
  { value: 'education', label: 'Education' },
  { value: 'charity', label: 'Charity & Causes' },
  { value: 'other', label: 'Other' },
];

interface EventFormProps {
  onSubmit: (data: any) => Promise<void>;
  initialData?: EventFormValues;
  isSubmitting?: boolean;
}

export default function EventForm({ onSubmit, initialData, isSubmitting = false }: EventFormProps) {
  const router = useRouter();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const defaultValues: Partial<EventFormValues> = {
    title: '',
    location: '',
    description: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: format(new Date(), 'HH:mm'),
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
    // Combine date and time fields
    const formData = new FormData();
    
    Object.entries(data).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });
    
    if (imageFile) {
      formData.append('image', imageFile);
    }
    
    await onSubmit(formData);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setValue('category', e.target.value);
  };

  return (
    <form onSubmit={handleSubmit(processForm)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Location
          </label>
          <Input
            id="location"
            {...register('location')}
            placeholder="Enter location"
            error={errors.location?.message}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <Input
              type="date"
              id="startDate"
              {...register('startDate')}
              error={errors.startDate?.message}
            />
          </div>
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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

        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Photos
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              {imagePreview ? (
                <div className="mb-3">
                  <img src={imagePreview} alt="Preview" className="mx-auto h-32 object-cover rounded-md" />
                </div>
              ) : (
                <FaUpload className="mx-auto h-12 w-12 text-gray-400" />
              )}
              <div className="flex text-sm text-gray-600">
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
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">Registration Period</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="registrationStartDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Registration Start Date
              </label>
              <Input
                type="date"
                id="registrationStartDate"
                {...register('registrationStartDate')}
                error={errors.registrationStartDate?.message}
              />
            </div>
            <div>
              <label htmlFor="registrationStartTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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