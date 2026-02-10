-- Add location columns to food_logs table
ALTER TABLE food_logs
ADD COLUMN location_lat FLOAT8,
ADD COLUMN location_lng FLOAT8,
ADD COLUMN place_name TEXT,
ADD COLUMN address TEXT;

-- (Optional) Create an index if you plan to search by location frequently
-- CREATE INDEX idx_food_logs_location ON food_logs USING gist (ll_to_earth(location_lat, location_lng));
