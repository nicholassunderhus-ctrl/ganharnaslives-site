-- Migration to create the deposits table

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
EXECUTE FUNCTION public.update_updated_at_column();

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

-- Restrict UPDATE and DELETE to service_role only by not creating permissive policies.
-- This removes any old, potentially conflicting policies.
DROP POLICY IF EXISTS "Allow update deposits" ON public.deposits;
DROP POLICY IF EXISTS "Allow delete deposits" ON public.deposits;
DROP POLICY IF EXISTS "public_deposits_update" ON public.deposits;
DROP POLICY IF EXISTS "public_deposits_delete" ON public.deposits;
DROP POLICY IF EXISTS "Admins or service role can update deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admins or service role can delete deposits" ON public.deposits;
