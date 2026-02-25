-- Add is_favorite column to food_logs for global "Thumb Up" functionality
ALTER TABLE public.food_logs
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Update RLS policies to allow friends to see favorites as well (already handled by the selective SELECT policy in previous step, but just in case)
-- The previous policy: 
-- CREATE POLICY "Users can view their friends' meal logs" ON public.food_logs FOR SELECT USING (...)
-- This will automatically include the new is_favorite column.
