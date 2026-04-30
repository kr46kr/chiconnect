import { useSyncExternalStore } from 'react';
import { store } from '@/lib/store';

export function useStore() {
  const state = useSyncExternalStore(store.subscribe, store.getState);
  const currentUser = state.users.find(u => u.id === state.currentUserId);
  return {
    ...state,
    store,
    currentUser: currentUser || { id: '', name: '', avatar: '', location: '', age: 0, bio: '', interests: [], weeklyHours: 0, groupIds: [], friendIds: [], pendingFriendRequests: [], sentFriendRequests: [], eventRatings: {}, rsvpEventIds: [] },
  };
}

export function useCurrentUser() {
  return useSyncExternalStore(store.subscribe, store.getCurrentUser);
}

export function useViewMode() {
  return useSyncExternalStore(store.subscribe, store.getViewMode);
}
