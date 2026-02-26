-- Add localization columns to food_logs table
ALTER TABLE food_logs ADD COLUMN IF NOT EXISTS description_ko TEXT;
ALTER TABLE food_logs ADD COLUMN IF NOT EXISTS food_name_ko TEXT;
