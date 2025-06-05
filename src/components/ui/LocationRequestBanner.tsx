"use client";

import { FiMapPin } from 'react-icons/fi';
import Button from './Button';

interface LocationRequestBannerProps {
  tab: string;
}

export default function LocationRequestBanner({ tab }: LocationRequestBannerProps) {
  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const params = new URLSearchParams(window.location.search);
          params.set('latitude', position.coords.latitude.toString());
          params.set('longitude', position.coords.longitude.toString());
          window.location.href = `${window.location.pathname}?${params.toString()}`;
        },
        (error) => {
          alert('Unable to get your location. Please enable location services.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FiMapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <div>
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Enable Location for Distance Filtering
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Allow location access to filter {tab} by distance from your current location.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={requestLocation}
          className="shrink-0"
        >
          Enable Location
        </Button>
      </div>
    </div>
  );
} 