"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from 'next-auth/react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Link from 'next/link';

// Form validation schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/events';
  const isRegistered = searchParams.get('registered') === 'true';
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      
      if (result?.error) {
        setError(result.error);
        return;
      }
      
      router.push(callbackUrl);
      router.refresh();
    } catch (error) {
      console.error('Login error:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">Login to Your Account</h2>
      
      {isRegistered && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Registration successful! You can now log in.
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          id="email"
          type="email"
          error={errors.email?.message}
          {...register('email')}
        />
        
        <Input
          label="Password"
          id="password"
          type="password"
          error={errors.password?.message}
          {...register('password')}
        />
        
        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
        >
          Login
        </Button>
      </form>
      
      <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        <p className="mb-2">
          Don't have an account?{' '}
          <Link
            href="/register"
            className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
          >
            Register
          </Link>
        </p>
        <p>
          <Link
            href="/forgot-password"
            className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
          >
            Forgot your password?
          </Link>
        </p>
      </div>
    </div>
  );
} 