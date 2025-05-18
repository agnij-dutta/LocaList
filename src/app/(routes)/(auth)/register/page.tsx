import RegisterForm from '@/components/forms/RegisterForm';
import Container from '@/components/ui/Container';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Register - LocaList',
  description: 'Create a new LocaList account',
};

export default async function RegisterPage() {
  // Check if the user is already logged in
  const session = await getSession();
  
  if (session) {
    redirect('/events');
  }
  
  return (
    <Container className="py-16">
      <div className="flex justify-center">
        <RegisterForm />
      </div>
    </Container>
  );
} 