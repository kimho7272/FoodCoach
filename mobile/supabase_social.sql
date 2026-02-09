-- 1. Updates to 'profiles' table
-- Add phone number for contact matching and last_active_at for online status
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text UNIQUE,
ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- 2. Create 'friendships' table
CREATE TABLE IF NOT EXISTS public.friendships (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id_1 uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    user_id_2 uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status text CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    -- Prevent duplicate friend requests between the same two users in the same direction
    UNIQUE(user_id_1, user_id_2),
    -- Prevent users from friending themselves
    CHECK (user_id_1 != user_id_2)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Policy: Users can view their own friendships (both sent and received)
CREATE POLICY "Users can view their own friendships"
ON public.friendships FOR SELECT
USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Policy: Users can send friend requests (insert as user_id_1)
CREATE POLICY "Users can send friend requests"
ON public.friendships FOR INSERT
WITH CHECK (auth.uid() = user_id_1);

-- Policy: Users can update friendships (accept requests)
-- Allows both sender and receiver to update status (e.g., cancel or accept)
CREATE POLICY "Users can update their friendships"
ON public.friendships FOR UPDATE
USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Policy: Users can delete friendships (unfriend or decline)
CREATE POLICY "Users can delete their friendships"
ON public.friendships FOR DELETE
USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);
