import { supabase } from '@/integrations/supabase/client';
import type { User, Group, Event, ChatMessage, ViewMode } from './types';

// UUID helpers - map between short IDs and full UUIDs
const toUUID = (shortId: string) => {
  if (shortId.includes('-')) return shortId; // already UUID
  return `00000000-0000-0000-0000-${shortId.padStart(12, '0')}`;
};

export async function loadAllData(): Promise<{
  users: User[];
  groups: Group[];
  events: Event[];
}> {
  try {
    const [
      { data: profiles },
      { data: interests },
      { data: groups },
      { data: groupMembers },
      { data: events },
      { data: eventTags },
      { data: eventAttendees },
      { data: eventRatings },
      { data: friendships },
      { data: friendRequests },
      { data: chatMessages },
    ] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('user_interests').select('*'),
      supabase.from('groups').select('*'),
      supabase.from('group_members').select('*'),
      supabase.from('events').select('*'),
      supabase.from('event_tags').select('*'),
      supabase.from('event_attendees').select('*'),
      supabase.from('event_ratings').select('*'),
      supabase.from('friendships').select('*'),
      supabase.from('friend_requests').select('*').eq('status', 'pending'),
      supabase.from('chat_messages').select('*').order('created_at', { ascending: true }),
    ]);

    // Cleanup logic for interests, members, etc. (rest of the mapping code)
    const processedData = processLoadedData(
      profiles, interests, groups, groupMembers, events, 
      eventTags, eventAttendees, eventRatings, friendships, 
      friendRequests, chatMessages
    );

    // Cache the processed result
    localStorage.setItem('chiconnect_cache', JSON.stringify(processedData));
    return processedData;

  } catch (error) {
    console.warn('Network error, attempting to load from cache:', error);
    const cached = localStorage.getItem('chiconnect_cache');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (parseError) {
        console.error('Failed to parse cached data:', parseError);
      }
    }
    throw error; // Re-throw if no cache or parse fails
  }
}

// Helper to contain the mapping logic
function processLoadedData(
  profiles: any, interests: any, groups: any, groupMembers: any, events: any, 
  eventTags: any, eventAttendees: any, eventRatings: any, friendships: any, 
  friendRequests: any, chatMessages: any
): { users: User[]; groups: Group[]; events: Event[] } {
  // Build user objects
  const interestsByProfile = new Map<string, string[]>();
  (interests || []).forEach(i => {
    const arr = interestsByProfile.get(i.profile_id) || [];
    arr.push(i.interest);
    interestsByProfile.set(i.profile_id, arr);
  });

  const groupIdsByProfile = new Map<string, string[]>();
  (groupMembers || []).forEach(gm => {
    const arr = groupIdsByProfile.get(gm.profile_id) || [];
    arr.push(gm.group_id);
    groupIdsByProfile.set(gm.profile_id, arr);
  });

  const rsvpsByProfile = new Map<string, string[]>();
  (eventAttendees || []).forEach(ea => {
    const arr = rsvpsByProfile.get(ea.profile_id) || [];
    arr.push(ea.event_id);
    rsvpsByProfile.set(ea.profile_id, arr);
  });

  const ratingsByProfile = new Map<string, Record<string, number>>();
  (eventRatings || []).forEach(er => {
    const map = ratingsByProfile.get(er.profile_id) || {};
    map[er.event_id] = er.rating;
    ratingsByProfile.set(er.profile_id, map);
  });

  const friendIdsByProfile = new Map<string, string[]>();
  (friendships || []).forEach(f => {
    const arr1 = friendIdsByProfile.get(f.profile_id_1) || [];
    arr1.push(f.profile_id_2);
    friendIdsByProfile.set(f.profile_id_1, arr1);
    const arr2 = friendIdsByProfile.get(f.profile_id_2) || [];
    arr2.push(f.profile_id_1);
    friendIdsByProfile.set(f.profile_id_2, arr2);
  });

  const pendingByProfile = new Map<string, string[]>();
  const sentByProfile = new Map<string, string[]>();
  (friendRequests || []).forEach(fr => {
    const pending = pendingByProfile.get(fr.to_profile_id) || [];
    pending.push(fr.from_profile_id);
    pendingByProfile.set(fr.to_profile_id, pending);
    const sent = sentByProfile.get(fr.from_profile_id) || [];
    sent.push(fr.to_profile_id);
    sentByProfile.set(fr.from_profile_id, sent);
  });

  const users: (User & { _userId?: string | null })[] = (profiles || []).map(p => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${p.name}`,
    location: p.location || '',
    location_private: p.location_private || '',
    location_public: p.location_public || '',
    age: p.age || 0,
    bio: p.bio || '',
    interests: interestsByProfile.get(p.id) || [],
    weeklyHours: p.weekly_hours || 0,
    groupIds: groupIdsByProfile.get(p.id) || [],
    friendIds: friendIdsByProfile.get(p.id) || [],
    pendingFriendRequests: pendingByProfile.get(p.id) || [],
    sentFriendRequests: sentByProfile.get(p.id) || [],
    eventRatings: ratingsByProfile.get(p.id) || {},
    rsvpEventIds: rsvpsByProfile.get(p.id) || [],
    _userId: p.user_id,
  }));

  // Build group objects
  const membersByGroup = new Map<string, string[]>();
  (groupMembers || []).forEach(gm => {
    const arr = membersByGroup.get(gm.group_id) || [];
    arr.push(gm.profile_id);
    membersByGroup.set(gm.group_id, arr);
  });

  const eventsByGroup = new Map<string, string[]>();
  (events || []).forEach(e => {
    if (e.group_id) {
      const arr = eventsByGroup.get(e.group_id) || [];
      arr.push(e.id);
      eventsByGroup.set(e.group_id, arr);
    }
  });

  const chatsByGroup = new Map<string, ChatMessage[]>();
  (chatMessages || []).forEach(cm => {
    const arr = chatsByGroup.get(cm.group_id) || [];
    arr.push({
      id: cm.id,
      userId: cm.profile_id,
      text: cm.text,
      timestamp: cm.created_at,
    });
    chatsByGroup.set(cm.group_id, arr);
  });

  const groupList: Group[] = (groups || []).map(g => ({
    id: g.id,
    name: g.name,
    category: g.category || '',
    description: g.description || '',
    memberIds: membersByGroup.get(g.id) || [],
    eventIds: eventsByGroup.get(g.id) || [],
    chatMessages: chatsByGroup.get(g.id) || [],
    color: g.color || 'hsl(210, 70%, 50%)',
  }));

  // Build event objects
  const tagsByEvent = new Map<string, string[]>();
  (eventTags || []).forEach(et => {
    const arr = tagsByEvent.get(et.event_id) || [];
    arr.push(et.tag);
    tagsByEvent.set(et.event_id, arr);
  });

  const attendeesByEvent = new Map<string, string[]>();
  (eventAttendees || []).forEach(ea => {
    const arr = attendeesByEvent.get(ea.event_id) || [];
    arr.push(ea.profile_id);
    attendeesByEvent.set(ea.event_id, arr);
  });

  const eventList: Event[] = (events || []).map(e => ({
    id: e.id,
    title: e.title,
    category: e.category || '',
    description: e.description || '',
    location: e.location || '',
    date: e.date || '',
    time: e.time || '',
    dressCode: e.dress_code || '',
    price: e.price || 'Free',
    attendeeIds: attendeesByEvent.get(e.id) || [],
    maxAttendees: e.max_attendees || 0,
    rating: Number(e.rating) || 0,
    groupId: e.group_id || undefined,
    tags: tagsByEvent.get(e.id) || [],
  }));

  return { users, groups: groupList, events: eventList };
}

// --- Mutation functions (persist to Supabase) ---

export async function updateProfile(profileId: string, updates: {
  name?: string;
  bio?: string;
  location?: string;
  location_private?: string;
  location_public?: string;
  age?: number;
  weeklyHours?: number;
  interests?: string[];
}) {
  const { interests, weeklyHours, location_private, location_public, age, ...profileUpdates } = updates;
  
  // Validation
  if (age !== undefined && (age < 13 || age > 120)) {
    throw new Error('Age must be between 13 and 120.');
  }
  if (weeklyHours !== undefined && (weeklyHours < 0 || weeklyHours > 168)) {
    throw new Error('Weekly commitment must be between 0 and 168 hours.');
  }

  const dbUpdates: Record<string, unknown> = { ...profileUpdates };
  if (age !== undefined) dbUpdates.age = age;
  if (weeklyHours !== undefined) dbUpdates.weekly_hours = weeklyHours;
  if (location_private !== undefined) dbUpdates.location_private = location_private;
  if (location_public !== undefined) dbUpdates.location_public = location_public;

  if (Object.keys(dbUpdates).length > 0) {
    await supabase.from('profiles').update(dbUpdates).eq('id', profileId);
  }

  if (interests !== undefined) {
    await supabase.from('user_interests').delete().eq('profile_id', profileId);
    if (interests.length > 0) {
      await supabase.from('user_interests').insert(
        interests.map(interest => ({ profile_id: profileId, interest }))
      );
    }
  }
}

export async function joinGroup(profileId: string, groupId: string) {
  await supabase.from('group_members').insert({ profile_id: profileId, group_id: groupId });
}

export async function leaveGroup(profileId: string, groupId: string) {
  await supabase.from('group_members').delete().eq('profile_id', profileId).eq('group_id', groupId);
}

export async function rsvpEvent(profileId: string, eventId: string) {
  await supabase.from('event_attendees').insert({ profile_id: profileId, event_id: eventId });
}

export async function unrsvpEvent(profileId: string, eventId: string) {
  await supabase.from('event_attendees').delete().eq('profile_id', profileId).eq('event_id', eventId);
}

export async function rateEvent(profileId: string, eventId: string, rating: number) {
  // Validation
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5.');
  }

  await supabase.from('event_ratings').upsert(
    { profile_id: profileId, event_id: eventId, rating },
    { onConflict: 'event_id,profile_id' }
  );
}

export async function sendFriendRequest(fromProfileId: string, toProfileId: string) {
  await supabase.from('friend_requests').insert({
    from_profile_id: fromProfileId,
    to_profile_id: toProfileId,
    status: 'pending',
  });
}

export async function acceptFriendRequest(userId: string, fromId: string) {
  // Delete the request
  await supabase.from('friend_requests').delete()
    .eq('from_profile_id', fromId)
    .eq('to_profile_id', userId);
  
  // Create friendship (ensure profile_id_1 < profile_id_2)
  const [id1, id2] = userId < fromId ? [userId, fromId] : [fromId, userId];
  await supabase.from('friendships').insert({ profile_id_1: id1, profile_id_2: id2 });
}

export async function declineFriendRequest(userId: string, fromId: string) {
  await supabase.from('friend_requests').delete()
    .eq('from_profile_id', fromId)
    .eq('to_profile_id', userId);
}

export async function removeFriend(userId: string, friendId: string) {
  const [id1, id2] = userId < friendId ? [userId, friendId] : [friendId, userId];
  await supabase.from('friendships').delete()
    .eq('profile_id_1', id1)
    .eq('profile_id_2', id2);
}

export async function sendChatMessage(groupId: string, profileId: string, text: string) {
  const { data } = await supabase.from('chat_messages').insert({
    group_id: groupId,
    profile_id: profileId,
    text,
  }).select().single();
  return data;
}
