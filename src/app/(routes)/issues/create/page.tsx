import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import axios from 'axios';

import BaseLayout from '@/components/layouts/BaseLayout';
import Container from '@/components/ui/Container';
import IssueForm from '@/components/issues/IssueForm';

export const metadata: Metadata = {
  title: 'Report Issue - Community Pulse',
  description: 'Report a community issue to help improve your neighborhood',
};

export default async function CreateIssuePage() {
  const currentUser = await getCurrentUser();

  async function createIssue(formData: FormData) {
    'use server';

    try {
      // Extract form data
      const title = formData.get('title') as string;
      const description = formData.get('description') as string;
      const category = formData.get('category') as string;
      const location = formData.get('location') as string;
      const latitude = formData.get('latitude') as string;
      const longitude = formData.get('longitude') as string;
      const isAnonymous = formData.get('isAnonymous') === 'true';

      // Validate required fields
      if (!title || !description || !category || !location || !latitude || !longitude) {
        return { success: false, error: 'All required fields must be filled' };
      }

      // Handle photo uploads (simplified for now - in a real app you'd upload to a file service)
      const photos: string[] = [];
      for (let i = 0; i < 5; i++) {
        const photo = formData.get(`image_${i}`) as File;
        if (photo && photo.size > 0) {
          // In a real application, you would upload the photo to a file storage service
          // and get back a URL. For now, we'll create a placeholder URL
          photos.push(`/uploads/issues/${Date.now()}_${i}.jpg`);
        }
      }

      // Prepare the request data
      const issueData: any = {
        title,
        description,
        category,
        location,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        isAnonymous,
      };

      if (photos.length > 0) {
        issueData.photos = photos;
      }

      // Make API call to create the issue
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/issues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(issueData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Failed to create issue' };
      }

      const result = await response.json();
      return { success: true, issueId: result.issue.id };
    } catch (error) {
      console.error('Error creating issue:', error);
      return { success: false, error: 'Failed to create issue. Please try again.' };
    }
  }

  return (
    <BaseLayout currentUser={currentUser}>
      <Container className="py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Report a Community Issue
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Help improve your neighborhood by reporting issues that need attention
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 md:p-8">
            <IssueForm 
              onSubmit={createIssue}
            />
          </div>
        </div>
      </Container>
    </BaseLayout>
  );
} 