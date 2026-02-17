-- Add gender column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender text;

-- Optional: Add check constraint for valid values
-- ALTER TABLE public.profiles 
-- ADD CONSTRAINT profiles_gender_check 
-- CHECK (gender IN ('Male', 'Female'));
