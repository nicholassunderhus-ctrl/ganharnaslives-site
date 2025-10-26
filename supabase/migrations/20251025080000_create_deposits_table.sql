
CREATE TABLE deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    amount_points INTEGER NOT NULL,
    amount_brl NUMERIC(10, 2) NOT NULL,
    gateway_payment_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on row modification
CREATE TRIGGER set_deposits_timestamp
BEFORE UPDATE ON deposits
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- RLS Policies for deposits table
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deposits"
ON deposits FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deposits"
ON deposits FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- No update or delete policies for users, only backend service role should do this.
