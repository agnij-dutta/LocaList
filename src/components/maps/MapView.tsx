"use client";

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapViewProps {
  events?: any[];
  issues?: any[];
  userLocation?: {
    latitude: number;
    longitude: number;
  };
  className?: string;
}

const MapView = ({ events = [], issues = [], userLocation, className = '' }: MapViewProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    mapInstanceRef.current = L.map(mapRef.current).setView([51.505, -0.09], 13);

    // Add tile layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mapInstanceRef.current);

    // If user location is available, center map there
    if (userLocation) {
      mapInstanceRef.current.setView([userLocation.latitude, userLocation.longitude], 13);
      
      // Add user location marker
      const userIcon = L.divIcon({
        html: '<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        className: 'user-location-marker'
      });
      
      L.marker([userLocation.latitude, userLocation.longitude], { icon: userIcon })
        .addTo(mapInstanceRef.current)
        .bindPopup('Your Location');
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [userLocation]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers (except user location)
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker && !layer.getPopup()?.getContent()?.toString().includes('Your Location')) {
        mapInstanceRef.current?.removeLayer(layer);
      }
    });

    // Add event markers
    events.forEach((event) => {
      if (event.latitude && event.longitude) {
        const eventIcon = L.divIcon({
          html: `<div style="background-color: ${event.isUrgent ? '#dc2626' : '#10b981'}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
                   📅 ${event.category === 'Lost & Found' ? '🔍' : '📅'}
                 </div>`,
          iconSize: [80, 24],
          iconAnchor: [40, 12],
          className: 'event-marker'
        });

        const popup = L.popup({
          maxWidth: 300,
          className: 'custom-popup'
        }).setContent(`
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1f2937;">${event.title}</h3>
            ${event.isUrgent ? '<span style="background-color: #dc2626; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600;">URGENT</span>' : ''}
            <p style="margin: 8px 0; font-size: 14px; color: #6b7280; line-height: 1.4;">${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}</p>
            <div style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
              <div>📍 ${event.location}</div>
              <div>📅 ${new Date(event.startDate).toLocaleDateString()}</div>
              <div>👥 ${event.interests?.length || 0} interested</div>
            </div>
          </div>
        `);

        L.marker([event.latitude, event.longitude], { icon: eventIcon })
          .addTo(mapInstanceRef.current!)
          .bindPopup(popup);
      }
    });

    // Add issue markers
    issues.forEach((issue) => {
      if (issue.latitude && issue.longitude) {
        const issueIcon = L.divIcon({
          html: `<div style="background-color: #dc2626; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 600; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
                   ⚠️ ${issue.category}
                 </div>`,
          iconSize: [80, 24],
          iconAnchor: [40, 12],
          className: 'issue-marker'
        });

        const popup = L.popup({
          maxWidth: 300,
          className: 'custom-popup'
        }).setContent(`
          <div style="padding: 8px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1f2937;">${issue.title}</h3>
            <span style="background-color: ${
              issue.status === 'Resolved' ? '#10b981' : 
              issue.status === 'In Progress' ? '#f59e0b' : '#dc2626'
            }; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600;">${issue.status}</span>
            <p style="margin: 8px 0; font-size: 14px; color: #6b7280; line-height: 1.4;">${issue.description.substring(0, 100)}${issue.description.length > 100 ? '...' : ''}</p>
            <div style="font-size: 12px; color: #9ca3af; margin-top: 8px;">
              <div>📍 ${issue.location}</div>
              <div>📅 ${new Date(issue.createdAt).toLocaleDateString()}</div>
              <div>👍 ${issue.upvotes || 0} upvotes</div>
            </div>
          </div>
        `);

        L.marker([issue.latitude, issue.longitude], { icon: issueIcon })
          .addTo(mapInstanceRef.current!)
          .bindPopup(popup);
      }
    });

    // Fit bounds to show all markers if there are any
    const allItems = [...events, ...issues];
    if (allItems.length > 0 && mapInstanceRef.current) {
      const group = new L.FeatureGroup();
      
      allItems.forEach((item) => {
        if (item.latitude && item.longitude) {
          const marker = L.marker([item.latitude, item.longitude]);
          group.addLayer(marker);
        }
      });

      if (userLocation) {
        const userMarker = L.marker([userLocation.latitude, userLocation.longitude]);
        group.addLayer(userMarker);
      }

      if (group.getLayers().length > 0) {
        mapInstanceRef.current.fitBounds(group.getBounds(), { padding: [20, 20] });
      }
    }
  }, [events, issues]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={mapRef}
        className="w-full h-full min-h-[500px] rounded-lg"
        style={{ zIndex: 1 }}
      />
      
      {/* Map Legend */}
      <div className="absolute top-4 right-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-3 text-sm z-[1000]">
        <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Map Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow"></div>
            <span className="text-gray-700 dark:text-gray-300">Your Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-green-600 text-white px-2 py-1 rounded text-xs">📅</div>
            <span className="text-gray-700 dark:text-gray-300">Events</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-red-600 text-white px-2 py-1 rounded text-xs">📅</div>
            <span className="text-gray-700 dark:text-gray-300">Urgent Events</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-red-600 text-white px-2 py-1 rounded text-xs">⚠️</div>
            <span className="text-gray-700 dark:text-gray-300">Issues</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView; 