-- 1. Remove duplicate ratings (keep only the latest one)
DELETE FROM public.event_ratings a
USING public.event_ratings b
WHERE a.id < b.id
  AND a.profile_id = b.profile_id
  AND a.event_id = b.event_id;

-- 2. Remove duplicate RSVPs
DELETE FROM public.event_attendees a
USING public.event_attendees b
WHERE a.id < b.id
  AND a.profile_id = b.profile_id
  AND a.event_id = b.event_id;

-- 3. Reinforce UNIQUE constraints
ALTER TABLE public.event_ratings DROP CONSTRAINT IF EXISTS event_ratings_event_id_profile_id_key;
ALTER TABLE public.event_ratings DROP CONSTRAINT IF EXISTS unique_user_event_rating;
ALTER TABLE public.event_ratings ADD CONSTRAINT unique_user_event_rating UNIQUE (profile_id, event_id);

ALTER TABLE public.event_attendees DROP CONSTRAINT IF EXISTS event_attendees_event_id_profile_id_key;
ALTER TABLE public.event_attendees DROP CONSTRAINT IF EXISTS unique_user_event_rsvp;
ALTER TABLE public.event_attendees ADD CONSTRAINT unique_user_event_rsvp UNIQUE (profile_id, event_id);

-- 4. Reinforce CHECK constraint for rating range
ALTER TABLE public.event_ratings DROP CONSTRAINT IF EXISTS rating_range_check;
ALTER TABLE public.event_ratings ADD CONSTRAINT rating_range_check CHECK (rating >= 1 AND rating <= 5);

-- 5. Tighten RLS Policies to ensure writes are tied to authenticated users

-- Profiles: Only allow users to manage their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Event Ratings
DROP POLICY IF EXISTS "Anyone can rate" ON public.event_ratings;
DROP POLICY IF EXISTS "Users can insert own ratings" ON public.event_ratings;
CREATE POLICY "Users can insert own ratings" ON public.event_ratings 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = profile_id 
    AND profiles.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Anyone can update rating" ON public.event_ratings;
DROP POLICY IF EXISTS "Users can update own ratings" ON public.event_ratings;
CREATE POLICY "Users can update own ratings" ON public.event_ratings 
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = profile_id 
    AND profiles.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can delete own ratings" ON public.event_ratings;
CREATE POLICY "Users can delete own ratings" ON public.event_ratings 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = profile_id 
    AND profiles.user_id = auth.uid()
  )
);

-- Event Attendees
DROP POLICY IF EXISTS "Anyone can RSVP" ON public.event_attendees;
DROP POLICY IF EXISTS "Users can insert own RSVPs" ON public.event_attendees;
CREATE POLICY "Users can insert own RSVPs" ON public.event_attendees 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = profile_id 
    AND profiles.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Anyone can un-RSVP" ON public.event_attendees;
DROP POLICY IF EXISTS "Users can delete own RSVPs" ON public.event_attendees;
CREATE POLICY "Users can delete own RSVPs" ON public.event_attendees 
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = profile_id 
    AND profiles.user_id = auth.uid()
  )
);
