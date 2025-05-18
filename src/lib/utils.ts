import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";

// Helper to combine Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date for display
export function formatDate(date: Date | string) {
  if (typeof date === "string") {
    date = new Date(date);
  }
  return format(date, "MMM d, yyyy 'at' h:mm a");
}

// Format relative time
export function formatRelativeTime(date: Date | string) {
  if (typeof date === "string") {
    date = new Date(date);
  }
  return formatDistanceToNow(date, { addSuffix: true });
}

// Format category for display
export function formatCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    'garage_sale': 'Garage Sale',
    'sports': 'Sports',
    'class': 'Class',
    'volunteer': 'Volunteer',
    'exhibition': 'Exhibition',
    'festival': 'Festival'
  };
  
  return categoryMap[category] || category;
}

// Truncate text for previews
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Get URL for local image
export function getImageUrl(path: string) {
  return `/uploads/${path}`;
}

// Validate email format
export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
} 