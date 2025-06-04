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
  userName: z.string().min(1, 'Name is required'),
  userEmail: z.string().email('Valid email is required'),
  userPhone: z.string().optional(),
  numberOfPeople: z.number().min(1, 'Please select at least 1 person').max(10, 'Maximum 10 people allowed'),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

interface RegisterFormProps {
  eventId: number;
  userId: number;
  userName?: string;
  userEmail?: string;
}

export default function RegisterForm({ eventId, userId, userName = '', userEmail = '' }: RegisterFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      userName,
      userEmail,
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
        userName: data.userName,
        userEmail: data.userEmail,
        userPhone: data.userPhone,
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
        <label htmlFor="userName" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Full Name
        </label>
        <input
          id="userName"
          type="text"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          placeholder="Your full name"
          {...register('userName')}
        />
        {errors.userName && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.userName.message}
          </p>
        )}
      </div>
      
      <div>
        <label htmlFor="userEmail" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Email
        </label>
        <input
          id="userEmail"
          type="email"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          placeholder="Your email address"
          {...register('userEmail')}
        />
        {errors.userEmail && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.userEmail.message}
          </p>
        )}
      </div>
      
      <div>
        <label htmlFor="userPhone" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Phone (optional)
        </label>
        <input
          id="userPhone"
          type="tel"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          placeholder="Your phone number"
          {...register('userPhone')}
        />
        {errors.userPhone && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {errors.userPhone.message}
          </p>
        )}
      </div>
      
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