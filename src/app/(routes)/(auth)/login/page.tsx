import LoginForm from '@/components/forms/LoginForm';
import Container from '@/components/ui/Container';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login - LocaList',
  description: 'Sign in to your LocaList account',
};

export default async function LoginPage() {
  // Check if the user is already logged in
  const session = await getSession();
  
  if (session) {
    redirect('/events');
  }
  
  return (
    <Container className="py-16">
      <div className="flex justify-center">
        <LoginForm />
      </div>
    </Container>
  );
} 