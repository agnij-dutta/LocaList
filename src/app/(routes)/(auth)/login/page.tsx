import LoginForm from '@/components/forms/LoginForm';
import Container from '@/components/ui/Container';
import BaseLayout from '@/components/layouts/BaseLayout';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - Community Pulse',
  description: 'Sign in to your Community Pulse account',
};

export default async function LoginPage() {
  // Check if the user is already logged in
  const currentUser = await getCurrentUser();
  
  if (currentUser) {
    redirect('/events');
  }
  
  return (
    <BaseLayout currentUser={null}>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col justify-center">
        <Container className="py-16">
          <div className="flex justify-center">
            <LoginForm />
          </div>
        </Container>
      </div>
    </BaseLayout>
  );
} 