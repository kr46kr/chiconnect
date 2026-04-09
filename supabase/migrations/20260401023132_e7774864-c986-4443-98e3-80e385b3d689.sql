
-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  location TEXT,
  age INTEGER,
  bio TEXT,
  weekly_hours INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (true);

-- User interests
CREATE TABLE public.user_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  interest TEXT NOT NULL,
  UNIQUE(profile_id, interest)
);
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Interests viewable by everyone" ON public.user_interests FOR SELECT USING (true);
CREATE POLICY "Users can manage own interests" ON public.user_interests FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own interests" ON public.user_interests FOR DELETE USING (true);

-- Groups
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Groups viewable by everyone" ON public.groups FOR SELECT USING (true);
CREATE POLICY "Anyone can create groups" ON public.groups FOR INSERT WITH CHECK (true);

-- Group members
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, profile_id)
);
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group members viewable by everyone" ON public.group_members FOR SELECT USING (true);
CREATE POLICY "Anyone can join groups" ON public.group_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can leave groups" ON public.group_members FOR DELETE USING (true);

-- Events
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  location TEXT,
  date DATE,
  time TEXT,
  dress_code TEXT,
  price TEXT,
  max_attendees INTEGER,
  rating NUMERIC(3,1) DEFAULT 0,
  group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Anyone can create events" ON public.events FOR INSERT WITH CHECK (true);

-- Event tags
CREATE TABLE public.event_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  UNIQUE(event_id, tag)
);
ALTER TABLE public.event_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Event tags viewable by everyone" ON public.event_tags FOR SELECT USING (true);
CREATE POLICY "Anyone can add event tags" ON public.event_tags FOR INSERT WITH CHECK (true);

-- Event attendees (RSVPs)
CREATE TABLE public.event_attendees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rsvp_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, profile_id)
);
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Attendees viewable by everyone" ON public.event_attendees FOR SELECT USING (true);
CREATE POLICY "Anyone can RSVP" ON public.event_attendees FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can un-RSVP" ON public.event_attendees FOR DELETE USING (true);

-- Event ratings
CREATE TABLE public.event_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  UNIQUE(event_id, profile_id)
);
ALTER TABLE public.event_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ratings viewable by everyone" ON public.event_ratings FOR SELECT USING (true);
CREATE POLICY "Anyone can rate" ON public.event_ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update rating" ON public.event_ratings FOR UPDATE USING (true);

-- Friendships (confirmed)
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  profile_id_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id_1, profile_id_2),
  CHECK (profile_id_1 < profile_id_2)
);
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Friendships viewable by everyone" ON public.friendships FOR SELECT USING (true);
CREATE POLICY "Anyone can create friendships" ON public.friendships FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can remove friendships" ON public.friendships FOR DELETE USING (true);

-- Friend requests
CREATE TABLE public.friend_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  to_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(from_profile_id, to_profile_id)
);
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Friend requests viewable by everyone" ON public.friend_requests FOR SELECT USING (true);
CREATE POLICY "Anyone can send friend requests" ON public.friend_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update friend requests" ON public.friend_requests FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete friend requests" ON public.friend_requests FOR DELETE USING (true);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Chat messages viewable by everyone" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can send messages" ON public.chat_messages FOR INSERT WITH CHECK (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
