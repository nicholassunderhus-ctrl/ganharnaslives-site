-- Migration to create the deposits table

-- Function to update updated_at timestamp.
-- This function will be re-used by other tables.
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE public.deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    points_awarded INTEGER NOT NULL,
    amount_brl NUMERIC(10, 2) NOT NULL,
    gateway_payment_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger to automatically update updated_at on row modification
CREATE TRIGGER set_deposits_timestamp
BEFORE UPDATE ON public.deposits
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Enable RLS for the table
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view their own deposits
CREATE POLICY "Users can view their own deposits"
ON public.deposits FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Allow users to create their own deposits
-- This is necessary for the 'create-pix-payment' function to work when called by a user.
CREATE POLICY "Users can create their own deposits"
ON public.deposits FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Note: Update and Delete policies are handled restrictively in a separate migration file.
