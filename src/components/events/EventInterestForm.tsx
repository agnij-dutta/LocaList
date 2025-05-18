import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Button from '@/components/ui/Button';
import axios from 'axios';
import { User } from '@/types/db';

// Create a validation schema
const interestSchema = z.object({
  numberOfPeople: z
    .number()
    .min(1, "At least one person must attend")
    .max(10, "Maximum 10 people allowed per registration"),
});

type InterestFormData = z.infer<typeof interestSchema>;

interface EventInterestFormProps {
  eventId: number;
  currentUser: User;
  onSuccess?: () => void;
  initialInterest?: { id: number; numberOfPeople: number } | null;
}

export default function EventInterestForm({
  eventId,
  currentUser,
  onSuccess,
  initialInterest
}: EventInterestFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InterestFormData>({
    resolver: zodResolver(interestSchema),
    defaultValues: {
      numberOfPeople: initialInterest?.numberOfPeople || 1,
    },
  });
  
  const onSubmit = async (data: InterestFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (initialInterest) {
        // Update existing interest
        await axios.patch(`/api/events/${eventId}/interest`, {
          numberOfPeople: data.numberOfPeople,
        });
        setSuccess("Your registration has been updated!");
      } else {
        // Create new interest
        await axios.post(`/api/events/${eventId}/interest`, {
          numberOfPeople: data.numberOfPeople,
        });
        setSuccess("You're registered for this event!");
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error registering interest:", error);
      setError("Failed to register. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancelInterest = async () => {
    if (!initialInterest) return;
    
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      await axios.delete(`/api/events/${eventId}/interest`);
      setSuccess("Your registration has been canceled.");
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error canceling interest:", error);
      setError("Failed to cancel registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
      <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">
        {initialInterest ? 'Update Registration' : 'Register for this Event'}
      </h3>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label 
            htmlFor="numberOfPeople" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Number of People Attending
          </label>
          <input
            id="numberOfPeople"
            type="number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
            {...register('numberOfPeople', { valueAsNumber: true })}
            min={1}
            max={10}
          />
          {errors.numberOfPeople && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.numberOfPeople.message}
            </p>
          )}
        </div>
        
        {error && (
          <div className="mb-4 p-2 bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-200 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-2 bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200 rounded">
            {success}
          </div>
        )}
        
        <div className="flex space-x-2">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting 
              ? 'Processing...' 
              : initialInterest 
                ? 'Update Registration' 
                : 'Register Now'
            }
          </Button>
          
          {initialInterest && (
            <Button
              type="button"
              variant="danger"
              onClick={handleCancelInterest}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Processing...' : 'Cancel Registration'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
} 