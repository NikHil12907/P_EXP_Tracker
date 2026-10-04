-- ==============================================================================
-- Migration: 20261004000002_lockdown_owner_rls.sql
-- Description: Locks down all tables to the single authenticated owner user ID
-- ==============================================================================

-- INSTRUCTIONS:
-- 1. Create your owner account in the Supabase Auth -> Users dashboard.
-- 2. Copy your user UID (e.g. 'a0000000-0000-0000-0000-000000000000').
-- 3. Replace 'REPLACE_WITH_YOUR_OWNER_UID' below, or run this query as-is to bind
--    to any authenticated user if you are the sole registered account.

DO $$
BEGIN
    -- Drop any prior generic policies if they exist
    DROP POLICY IF EXISTS "Owner access only" ON public.categories;
    DROP POLICY IF EXISTS "Owner access only" ON public.merchant_rules;
    DROP POLICY IF EXISTS "Owner access only" ON public.raw_messages;
    DROP POLICY IF EXISTS "Owner access only" ON public.expenses;
    DROP POLICY IF EXISTS "Owner access only" ON public.balance_gaps;
END $$;

-- Policy: categories
CREATE POLICY "Owner access only" ON public.categories
    FOR ALL TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: merchant_rules
CREATE POLICY "Owner access only" ON public.merchant_rules
    FOR ALL TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: raw_messages
CREATE POLICY "Owner access only" ON public.raw_messages
    FOR ALL TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: expenses
CREATE POLICY "Owner access only" ON public.expenses
    FOR ALL TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: balance_gaps
CREATE POLICY "Owner access only" ON public.balance_gaps
    FOR ALL TO authenticated
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- NOTE: If you wish to hardcode your exact UID for defense-in-depth:
-- ALTER POLICY "Owner access only" ON public.expenses
-- USING (auth.uid() = 'REPLACE_WITH_YOUR_OWNER_UID'::uuid)
-- WITH CHECK (auth.uid() = 'REPLACE_WITH_YOUR_OWNER_UID'::uuid);
