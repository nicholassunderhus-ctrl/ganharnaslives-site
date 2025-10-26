-- Add last_earn_timestamp to user_points table to limit earning to 1 point per minute per account
ALTER TABLE public.user_points
ADD COLUMN last_earn_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Update existing rows to have a timestamp in the past to allow immediate earning
UPDATE public.user_points
SET last_earn_timestamp = now() - interval '2 minutes'
WHERE last_earn_timestamp IS NULL;
