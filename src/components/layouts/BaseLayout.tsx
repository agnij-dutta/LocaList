import { ReactNode } from 'react';
import Navbar from '../ui/Navbar';
import Footer from '../ui/Footer';

interface BaseLayoutProps {
  children: ReactNode;
  currentUser?: {
    id: string;
    name?: string | null;
    email?: string | null;
    isAdmin: boolean;
    isVerifiedOrganizer: boolean;
  } | null;
}

export default function BaseLayout({ children, currentUser }: BaseLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navbar currentUser={currentUser} />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
} 