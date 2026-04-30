export interface User {
  id: string;
  name: string;
  avatar: string;
  location: string;
  location_private: string;
  location_public: string;
  age: number;
  bio: string;
  interests: string[];
  weeklyHours: number;
  groupIds: string[];
  friendIds: string[];
  pendingFriendRequests: string[]; // incoming
  sentFriendRequests: string[]; // outgoing
  eventRatings: Record<string, number>;
  rsvpEventIds: string[];
}

export interface Group {
  id: string;
  name: string;
  category: string;
  description: string;
  memberIds: string[];
  eventIds: string[];
  chatMessages: ChatMessage[];
  color: string;
}

export interface Event {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  date: string;
  time: string;
  dressCode: string;
  price: string; // "Free", "$", "$$"
  attendeeIds: string[];
  maxAttendees: number;
  rating: number;
  groupId?: string;
  tags: string[];
}

export interface ChatMessage {
  id: string;
  userId: string;
  text: string;
  timestamp: string;
}

export type ViewMode = 'user' | 'admin';
