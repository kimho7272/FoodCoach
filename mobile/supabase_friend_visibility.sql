-- RLS Policies for Friend Visibility

-- 1. Profiles: Ensure friends can see each other's basic profile info
-- If profiles RLS is enabled, we need to allow selection for accepted friends
CREATE POLICY "Users can view their friends' profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() = id -- Own profile
  OR 
  EXISTS (
    SELECT 1 FROM public.friendships 
    WHERE status = 'accepted' 
    AND (
      (user_id_1 = auth.uid() AND user_id_2 = profiles.id)
      OR
      (user_id_2 = auth.uid() AND user_id_1 = profiles.id)
    )
  )
);

-- 2. Food Logs: Allow friends to view each other's meal history
-- Make sure RLS is enabled on food_logs first
ALTER TABLE public.food_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own logs (already might exist, but let's be explicit)
CREATE POLICY "Users can manage their own meal logs"
ON public.food_logs FOR ALL
USING (auth.uid() = user_id);

-- Policy: Friends can see each other's logs
CREATE POLICY "Users can view their friends' meal logs"
ON public.food_logs FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.friendships 
    WHERE status = 'accepted' 
    AND (
      (user_id_1 = auth.uid() AND user_id_2 = food_logs.user_id)
      OR
      (user_id_2 = auth.uid() AND user_id_1 = food_logs.user_id)
    )
  )
);
