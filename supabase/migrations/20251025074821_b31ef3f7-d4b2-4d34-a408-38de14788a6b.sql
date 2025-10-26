-- Remove the UPDATE policy that allows users to modify their own points
DROP POLICY IF EXISTS "Users can update their own points" ON public.user_points;

-- Users should NOT be able to INSERT, UPDATE, or DELETE their own points
-- Only the system (triggers/functions) should be able to modify points
-- Users can only SELECT their own points (this policy already exists)

-- The existing SELECT policy is good:
-- "Users can view their own points" - allows users to see their own points

-- No INSERT policy means users cannot create point records (only triggers can)
-- No UPDATE policy means users cannot modify their points (only system can)
-- No DELETE policy means users cannot delete their point history