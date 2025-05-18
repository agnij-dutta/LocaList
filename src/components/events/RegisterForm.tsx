'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';

import Button from '@/components/ui/Button';

// Define the form schema
const registrationSchema = z.object({
  numberOfPeople: z.number().min(1, 'Please select at least 1 person').max(10, 'Maximum 10 people allowed'),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

interface RegisterFormProps {
  eventId: number;
  userId: number;
}

export default function RegisterForm({ eventId, userId }: RegisterFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      numberOfPeople: 1,
    },
  });
  
  const onSubmit = async (data: RegistrationFormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await axios.post('/api/events/register', {
        eventId,
        userId,
        numberOfPeople: data.numberOfPeople,
      });
      
      setSuccess(true);
      router.refresh();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to register for event');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (success) {
    return (
      <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-green-800 dark:text-green-100">
          Registration successful!
        </h3>
        <p className="text-green-700 dark:text-green-200 mt-1">
          You're now registered for this event. You'll receive updates about the event.
        </p>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="bg-red-50 dark:bg-red-900 p-3 rounded-lg">
          <p className="text-red-700 dark:text-red-200 text-sm">{error}</p>
        </div>
      )}
      
      <div>
        <label htmlFor="numberOfPeople" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Number of people
        </label>
        <select
          id="numberOfPeople"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          {...register('numberOfPeople', { valueAsNumber: true })}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <option key={num} value={num}>
              {num} {num === 1 ? 'person' : 'people'}
            </option>
          ))}
        </select>
        {errors.numberOfPeople && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.numberOfPeople.message}
          </p>
        )}
      </div>
      
      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Registering...' : 'Register Now'}
      </Button>
    </form>
  );
} 