-- Create streams table to track active streams
CREATE TABLE public.streams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform VARCHAR(255) NOT NULL CHECK (platform IN ('Kick', 'YouTube', 'Twitch')),
  title VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  stream_url VARCHAR(1024) NOT NULL,
  max_viewers INTEGER NOT NULL,
  viewers_per_minute INTEGER NOT NULL DEFAULT 1,
  points_per_viewer INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  is_paid BOOLEAN NOT NULL DEFAULT false,
  payment_confirmed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;

-- Create policies for streams
CREATE POLICY "Users can view active streams"
ON public.streams
FOR SELECT
USING (status = 'active' AND is_paid = true);

CREATE POLICY "Users can view their own streams"
ON public.streams
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own streams"
ON public.streams
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending streams"
ON public.streams
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Add trigger for updated_at
CREATE TRIGGER update_streams_updated_at
BEFORE UPDATE ON public.streams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for streams table
ALTER PUBLICATION supabase_realtime ADD TABLE public.streams;