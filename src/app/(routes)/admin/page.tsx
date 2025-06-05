import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import db from '@/lib/db';
import BaseLayout from '@/components/layouts/BaseLayout';
import Container from '@/components/ui/Container';
import AdminDashboard from '@/components/admin/AdminDashboard';

// Define types for the data structure
interface User {
  id: number;
  name: string;
  email: string;
}

interface Interest {
  id: number;
  userId: number;
  eventId: number;
}

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate?: string;
  category: string;
  imageUrl?: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  organizerId: number;
  organizer: User;
  interests: Interest[];
}

export const metadata: Metadata = {
  title: 'Admin Dashboard - LocaList',
  description: 'Manage events and users',
};

export default async function AdminPage() {
  const currentUser = await requireAdmin();
  
  // Fetch pending events
  let pendingEvents: Event[] = [];
  
  try {
    pendingEvents = await db.event.findMany({
      where: {
        isApproved: false,
      },
      include: {
        organizer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  } catch (error) {
    console.error('Error fetching pending events:', error);
  }
  
  // Fetch recent approved events
  let recentEvents: Event[] = [];
  
  try {
    recentEvents = await db.event.findMany({
      where: {
        isApproved: true,
      },
      include: {
        organizer: true,
        interests: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });
  } catch (error) {
    console.error('Error fetching recent events:', error);
  }
  
  return (
    <BaseLayout currentUser={currentUser}>
      <Container className="py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage events, users, and site content
          </p>
        </div>
        
        <AdminDashboard 
          pendingEvents={pendingEvents}
          recentEvents={recentEvents}
        />
      </Container>
    </BaseLayout>
  );
} 