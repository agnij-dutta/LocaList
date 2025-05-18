import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';

import BaseLayout from '@/components/layouts/BaseLayout';
import Container from '@/components/ui/Container';
import EventForm from '@/components/events/EventForm';

export const metadata: Metadata = {
  title: 'Create Event - LocaList',
  description: 'Create a new event for your community',
};

export default async function CreateEventPage() {
  const currentUser = await getCurrentUser();

  // Redirect unauthenticated users
  if (!currentUser) {
    redirect('/login?callbackUrl=/events/create');
  }

  async function createEvent(formData: FormData) {
    'use server';

    try {
      // Validate user is logged in
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('You must be logged in to create an event');
      }

      // Extract form data
      const title = formData.get('title') as string;
      const location = formData.get('location') as string;
      const description = formData.get('description') as string;
      const category = formData.get('category') as string;
      
      // Process dates and times
      const startDate = formData.get('startDate') as string;
      const startTime = formData.get('startTime') as string;
      const registrationStartDate = formData.get('registrationStartDate') as string || null;
      const registrationStartTime = formData.get('registrationStartTime') as string || null;

      // Combine date and time fields
      let eventStartDate = new Date(`${startDate}T${startTime}`);
      
      let registrationStart = null;
      if (registrationStartDate && registrationStartTime) {
        registrationStart = new Date(`${registrationStartDate}T${registrationStartTime}`);
      }

      // Create event in database
      const event = await db.event.create({
        data: {
          title,
          location,
          description,
          category,
          startDate: eventStartDate,
          registrationStart,
          organizerId: user.id,
          isApproved: true, // Auto-approve for now
        },
      });

      // Handle image upload
      const image = formData.get('image') as File;
      if (image && image.size > 0) {
        // TODO: Implement image upload functionality
        // For now, we'll skip this step
      }

      // Return the ID so we can redirect on the client
      return { success: true, eventId: event.id };
    } catch (error) {
      console.error('Error creating event:', error);
      return { success: false, error: 'Failed to create event. Please try again.' };
    }
  }

  return (
    <BaseLayout currentUser={currentUser}>
      <Container className="py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Add New Event
          </h1>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 md:p-8">
            <EventForm 
              onSubmit={createEvent}
            />
          </div>
        </div>
      </Container>
    </BaseLayout>
  );
} 