import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: {
    search?: string;
    category?: string;
    status?: string;
    distance?: string;
    latitude?: string;
    longitude?: string;
    view?: string;
  };
}

export default function IssuesPage({ searchParams }: PageProps) {
  const params = new URLSearchParams();
  params.set('tab', 'issues');
  params.set('view', searchParams.view || 'list');
  
  if (searchParams.search) params.set('search', searchParams.search);
  if (searchParams.category) params.set('category', searchParams.category);
  if (searchParams.status) params.set('status', searchParams.status);
  if (searchParams.distance) params.set('distance', searchParams.distance);
  if (searchParams.latitude) params.set('latitude', searchParams.latitude);
  if (searchParams.longitude) params.set('longitude', searchParams.longitude);
  
  redirect(`/events?${params.toString()}`);
} 