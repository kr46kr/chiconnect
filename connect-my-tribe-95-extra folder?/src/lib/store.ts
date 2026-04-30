import { User, Group, Event, ChatMessage, ViewMode } from './types';
import * as db from './supabase-data';

interface AppState {
  users: User[];
  groups: Group[];
  events: Event[];
  currentUserId: string;
  userEmail: string;
  viewMode: ViewMode;
  loaded: boolean;
}

let state: AppState = {
  users: [],
  groups: [],
  events: [],
  currentUserId: '00000000-0000-0000-0000-000000000001',
  userEmail: '',
  viewMode: 'user',
  loaded: false,
};

const ADMIN_EMAIL = "test123@gmail.com";

let listeners: Array<() => void> = [];

function notify() {
  listeners.forEach(fn => fn());
}

export const store = {
  subscribe(listener: () => void) {
    listeners.push(listener);
    return () => { listeners = listeners.filter(l => l !== listener); };
  },

  getState: () => state,
  getUsers: () => state.users,
  getGroups: () => state.groups,
  getEvents: () => state.events,
  getCurrentUser: () => state.users.find(u => u.id === state.currentUserId)!,
  getViewMode: () => state.viewMode,
  isLoaded: () => state.loaded,

  getUserById: (id: string) => state.users.find(u => u.id === id),
  getGroupById: (id: string) => state.groups.find(g => g.id === id),
  getEventById: (id: string) => state.events.find(e => e.id === id),

  async loadFromSupabase(authUserId?: string, userEmail?: string) {
    const data = await db.loadAllData();
    
    // Find profile linked to the authenticated user
    let currentId = state.currentUserId;
    if (authUserId) {
      const linkedProfile = data.users.find(u => {
        // Check if this profile is linked to the auth user via user_id
        return (u as any)._userId === authUserId;
      });
      if (linkedProfile) {
        currentId = linkedProfile.id;
      }
    }
    
    state = {
      ...state,
      users: data.users,
      groups: data.groups,
      events: data.events,
      currentUserId: currentId,
      userEmail: userEmail || '',
      loaded: true,
    };
    // Ensure currentUserId is valid
    if (!state.users.find(u => u.id === state.currentUserId) && state.users.length > 0) {
      state.currentUserId = state.users[0].id;
    }
    notify();
  },

  setViewMode(mode: ViewMode) {
    if (mode === 'admin' && state.userEmail !== ADMIN_EMAIL) {
      console.warn("Unauthorized: Only authorized admins can switch to Admin view.");
      return;
    }
    state = { ...state, viewMode: mode };
    notify();
  },

  isAdmin() {
    return state.userEmail === ADMIN_EMAIL;
  },

  updateUser(userId: string, updates: Partial<User>) {
    state = {
      ...state,
      users: state.users.map(u => u.id === userId ? { ...u, ...updates } : u),
    };
    notify();
    db.updateProfile(userId, {
      name: updates.name,
      bio: updates.bio,
      location: updates.location,
      location_private: updates.location_private,
      location_public: updates.location_public,
      age: updates.age,
      weeklyHours: updates.weeklyHours,
      interests: updates.interests,
    });
  },

  joinGroup(userId: string, groupId: string) {
    state = {
      ...state,
      users: state.users.map(u => u.id === userId ? { ...u, groupIds: [...new Set([...u.groupIds, groupId])] } : u),
      groups: state.groups.map(g => g.id === groupId ? { ...g, memberIds: [...new Set([...g.memberIds, userId])] } : g),
    };
    notify();
    db.joinGroup(userId, groupId);
  },

  leaveGroup(userId: string, groupId: string) {
    state = {
      ...state,
      users: state.users.map(u => u.id === userId ? { ...u, groupIds: u.groupIds.filter(id => id !== groupId) } : u),
      groups: state.groups.map(g => g.id === groupId ? { ...g, memberIds: g.memberIds.filter(id => id !== userId) } : g),
    };
    notify();
    db.leaveGroup(userId, groupId);
  },

  rsvpEvent(userId: string, eventId: string) {
    state = {
      ...state,
      users: state.users.map(u => u.id === userId ? { ...u, rsvpEventIds: [...new Set([...u.rsvpEventIds, eventId])] } : u),
      events: state.events.map(e => e.id === eventId ? { ...e, attendeeIds: [...new Set([...e.attendeeIds, userId])] } : e),
    };
    notify();
    db.rsvpEvent(userId, eventId);
  },

  unrsvpEvent(userId: string, eventId: string) {
    state = {
      ...state,
      users: state.users.map(u => u.id === userId ? { ...u, rsvpEventIds: u.rsvpEventIds.filter(id => id !== eventId) } : u),
      events: state.events.map(e => e.id === eventId ? { ...e, attendeeIds: e.attendeeIds.filter(id => id !== userId) } : e),
    };
    notify();
    db.unrsvpEvent(userId, eventId);
  },

  rateEvent(userId: string, eventId: string, rating: number) {
    state = {
      ...state,
      users: state.users.map(u => u.id === userId ? { ...u, eventRatings: { ...u.eventRatings, [eventId]: rating } } : u),
    };
    notify();
    db.rateEvent(userId, eventId, rating);
  },

  sendFriendRequest(fromId: string, toId: string) {
    state = {
      ...state,
      users: state.users.map(u => {
        if (u.id === fromId) return { ...u, sentFriendRequests: [...new Set([...u.sentFriendRequests, toId])] };
        if (u.id === toId) return { ...u, pendingFriendRequests: [...new Set([...u.pendingFriendRequests, fromId])] };
        return u;
      }),
    };
    notify();
    db.sendFriendRequest(fromId, toId);
  },

  acceptFriendRequest(userId: string, fromId: string) {
    state = {
      ...state,
      users: state.users.map(u => {
        if (u.id === userId) return { ...u, friendIds: [...new Set([...u.friendIds, fromId])], pendingFriendRequests: u.pendingFriendRequests.filter(id => id !== fromId) };
        if (u.id === fromId) return { ...u, friendIds: [...new Set([...u.friendIds, userId])], sentFriendRequests: u.sentFriendRequests.filter(id => id !== userId) };
        return u;
      }),
    };
    notify();
    db.acceptFriendRequest(userId, fromId);
  },

  declineFriendRequest(userId: string, fromId: string) {
    state = {
      ...state,
      users: state.users.map(u => {
        if (u.id === userId) return { ...u, pendingFriendRequests: u.pendingFriendRequests.filter(id => id !== fromId) };
        if (u.id === fromId) return { ...u, sentFriendRequests: u.sentFriendRequests.filter(id => id !== userId) };
        return u;
      }),
    };
    notify();
    db.declineFriendRequest(userId, fromId);
  },

  removeFriend(userId: string, friendId: string) {
    state = {
      ...state,
      users: state.users.map(u => {
        if (u.id === userId) return { ...u, friendIds: u.friendIds.filter(id => id !== friendId) };
        if (u.id === friendId) return { ...u, friendIds: u.friendIds.filter(id => id !== userId) };
        return u;
      }),
    };
    notify();
    db.removeFriend(userId, friendId);
  },

  sendGroupChat(groupId: string, userId: string, text: string) {
    const message: ChatMessage = {
      id: `msg_${Date.now()}`,
      userId,
      text,
      timestamp: new Date().toISOString(),
    };
    state = {
      ...state,
      groups: state.groups.map(g => g.id === groupId ? { ...g, chatMessages: [...g.chatMessages, message] } : g),
    };
    notify();
    db.sendChatMessage(groupId, userId, text);
  },

  getRecommendedGroups(userId: string): Group[] {
    const user = state.users.find(u => u.id === userId);
    if (!user) return [];
    const interestSet = new Set(user.interests.map(i => i.toLowerCase()));
    return state.groups
      .filter(g => !user.groupIds.includes(g.id))
      .map(g => {
        const categoryMatch = interestSet.has(g.category.toLowerCase()) ? 2 : 0;
        const tagMatch = g.description.split(' ').filter(w => interestSet.has(w.toLowerCase())).length;
        return { group: g, score: categoryMatch + tagMatch };
      })
      .sort((a, b) => b.score - a.score)
      .map(r => r.group);
  },

  getRecommendedEvents(userId: string): Event[] {
    const user = state.users.find(u => u.id === userId);
    if (!user) return [];

    const categoryToInterests: Record<string, string[]> = {
      'Arts & Culture': ['Art & Culture', 'Pottery', 'Film', 'Reading', 'Writing', 'Books'],
      'Music': ['Music', 'Karaoke', 'Dancing'],
      'Concert': ['Music', 'Karaoke', 'Dancing', 'Tech'],
      'Music Festival': ['Music', 'Dancing'],
      'Family & Outdoors': ['Outdoors', 'Hiking', 'Kayaking'],
      'Theater & Performing Arts': ['Art & Culture', 'Film', 'Music'],
      'Film': ['Film', 'Photography'],
      'Shopping & Markets': ['Art & Culture'],
      'Comedy': ['Trivia', 'Games'],
      'Sports': ['Fitness', 'Rock Climbing', 'Bowling', 'Skating'],
      'Food & Drink': ['Food & Drink', 'Coffee', 'Wine Tasting', 'Cooking'],
      'Wellness': ['Wellness', 'Yoga', 'Meditation'],
      'Entertainment': ['Karaoke', 'Games', 'Trivia', 'Music'],
      'Cultural & Civic': ['Art & Culture', 'Volunteering', 'Professional'],
      'Cultural Festival': ['Art & Culture', 'Food & Drink', 'Music'],
      'Tours & Activities': ['Outdoors', 'Photography', 'Art & Culture'],
      'Street Festival': ['Music', 'Food & Drink', 'Outdoors']
    };

    const interestSet = new Set(user.interests.map(i => i.toLowerCase()));

    return state.events
      .map(e => {
        let score = 0;
        
        const mappedInterests = categoryToInterests[e.category] || [];
        const hasMappedInterest = mappedInterests.some(mi => interestSet.has(mi.toLowerCase()));
        
        if (hasMappedInterest) score += 10;
        
        const tagScore = e.tags.filter(t => interestSet.has(t.toLowerCase())).length * 2;
        score += tagScore;
        
        const isInGroup = e.groupId && user.groupIds.includes(e.groupId) ? 5 : 0;
        score += isInGroup;

        if (interestSet.has(e.category.toLowerCase())) score += 5;
        
        return { event: e, score };
      })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(r => r.event);
  },

  getVisiblePeople(userId: string): User[] {
    const user = state.users.find(u => u.id === userId);
    if (!user) return [];
    const visibleIds = new Set<string>();
    user.groupIds.forEach(gId => {
      const group = state.groups.find(g => g.id === gId);
      group?.memberIds.forEach(mId => visibleIds.add(mId));
    });
    user.rsvpEventIds.forEach(eId => {
      const event = state.events.find(e => e.id === eId);
      event?.attendeeIds.forEach(aId => visibleIds.add(aId));
    });
    visibleIds.delete(userId);
    return state.users.filter(u => visibleIds.has(u.id));
  },

  async resetData() {
    await store.loadFromSupabase();
  },
};
