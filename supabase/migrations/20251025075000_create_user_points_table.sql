-- Migration to create the user_points table

CREATE TABLE public.user_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL DEFAULT 0,
    total_earned INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to automatically update updated_at on row modification
CREATE TRIGGER set_user_points_timestamp
BEFORE UPDATE ON public.user_points
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp(); -- Reutiliza a função já existente

-- Enable RLS
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own points
CREATE POLICY "Users can view their own points"
ON public.user_points FOR SELECT
USING (auth.uid() = user_id);

-- No other policies are needed, as only the backend (via service_role) should modify points.
