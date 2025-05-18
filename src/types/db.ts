export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  isAdmin: boolean;
  isVerifiedOrganizer: boolean;
  isBanned: boolean;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate?: string;
  category: string;
  imageUrl?: string;
  isApproved: boolean;
  registrationStart?: string;
  registrationEnd?: string;
  createdAt: string;
  updatedAt: string;
  organizerId: number;
  organizer?: User;
  interests?: Interest[];
}

export interface Interest {
  id: number;
  userId: number;
  eventId: number;
  numberOfPeople: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  event?: Event;
}

export interface Notification {
  id: number;
  content: string;
  type: string;
  isRead: boolean;
  userId: number;
  eventId?: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  event?: Event;
} 