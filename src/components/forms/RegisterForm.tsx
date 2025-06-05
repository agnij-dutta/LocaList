"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import * as z from 'zod';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import OTPVerification from '@/components/auth/OTPVerification';
import Link from 'next/link';

// Form validation schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true; // Allow empty
      // Regex for international phone numbers (10-15 digits, optional country code)
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      return phoneRegex.test(val.replace(/[-\s\(\)]/g, ''));
    }, {
      message: "Please enter a valid phone number (10-15 digits)"
    }),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

type RegistrationStep = 'form' | 'otp' | 'success';

export default function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('form');
  const [registrationData, setRegistrationData] = useState<RegisterFormValues | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });
  
  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setServerError(null);
    
    try {
      // First, register the user and send OTP
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          password: data.password,
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Registration failed");
      }

      // Store registration data and move to OTP step
      setRegistrationData(data);
      setCurrentStep('otp');
    } catch (error) {
      console.error('Registration error:', error);
      setServerError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPVerificationSuccess = async () => {
    if (!registrationData) return;

    try {
      // Auto-login the user after successful OTP verification
      const result = await signIn('credentials', {
        email: registrationData.email,
        password: registrationData.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Auto-login failed');
      }

      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Auto-login error:', error);
      // If auto-login fails, redirect to login page with success message
      router.push('/login?verified=true');
    }
  };

  const handleBackToForm = () => {
    setCurrentStep('form');
    setServerError(null);
  };

  if (currentStep === 'otp' && registrationData) {
    return (
      <OTPVerification
        email={registrationData.email}
        name={registrationData.name}
        onVerificationSuccess={handleOTPVerificationSuccess}
        onBack={handleBackToForm}
      />
    );
  }
  
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-slate-800 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">Create an Account</h2>
      
      {serverError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {serverError}
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          id="name"
          error={errors.name?.message}
          {...register('name')}
        />
        
        <Input
          label="Email"
          id="email"
          type="email"
          error={errors.email?.message}
          {...register('email')}
        />
        
        <Input
          label="Phone (optional)"
          id="phone"
          error={errors.phone?.message}
          {...register('phone')}
        />
        
        <Input
          label="Password"
          id="password"
          type="password"
          error={errors.password?.message}
          {...register('password')}
        />
        
        <Input
          label="Confirm Password"
          id="confirmPassword"
          type="password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        
        <Button
          type="submit"
          className="w-full"
          isLoading={isLoading}
        >
          Create Account & Send Verification
        </Button>
      </form>
      
      <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500"
        >
          Login
        </Link>
      </p>
    </div>
  );
} 