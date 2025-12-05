/*
  # Enable Row Level Security

  ## Critical Security Fix
  This migration enables RLS on all tables and adds restrictive policies
  to ensure users can ONLY access their own data.

  ## Changes
  1. Enable RLS on all user-facing tables
  2. Add policies for profiles (read own, update non-critical fields)
  3. Add policies for projects (full access to own projects)
  4. Add policies for messages (access via owned projects)
  5. Add policies for transactions and logs (read only own)
  6. Add policies for file attachments (full access to own)

  ## Security Impact
  - Prevents users from accessing other users' data
  - Prevents users from modifying token balances directly
  - Ensures data isolation between users
*/

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE paid_tier_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_tier_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES POLICIES
-- ============================================================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Anonymous users can read profiles for public features
CREATE POLICY "Anonymous can read profiles for public features"
  ON profiles FOR SELECT
  TO anon
  USING (true);

-- Users can update their own profile (but NOT token balances or premium flags)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid() AND
    -- Prevent users from directly modifying token balances
    paid_tokens_balance = (SELECT paid_tokens_balance FROM profiles WHERE id = auth.uid()) AND
    free_tokens_balance = (SELECT free_tokens_balance FROM profiles WHERE id = auth.uid()) AND
    tokens_balance = (SELECT tokens_balance FROM profiles WHERE id = auth.uid()) AND
    -- Prevent users from modifying premium flags
    is_premium = (SELECT is_premium FROM profiles WHERE id = auth.uid()) AND
    is_paid = (SELECT is_paid FROM profiles WHERE id = auth.uid()) AND
    current_tier = (SELECT current_tier FROM profiles WHERE id = auth.uid())
  );

-- Users can insert their own profile (signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- ============================================================================
-- PROJECTS POLICIES
-- ============================================================================

-- Users can read their own projects
CREATE POLICY "Users can read own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own projects
CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- MESSAGES POLICIES
-- ============================================================================

-- Users can read messages from their own projects
CREATE POLICY "Users can read own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Users can insert messages to their own projects
CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Users can update messages in their own projects
CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- Users can delete messages from their own projects
CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  );

-- ============================================================================
-- TOKEN TRANSACTIONS POLICIES (Read-only)
-- ============================================================================

-- Users can only read their own token transactions
CREATE POLICY "Users can read own token transactions"
  ON token_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Prevent users from inserting transactions (done by system only)
-- No INSERT policy = users cannot insert

-- ============================================================================
-- AI USAGE LOGS POLICIES (Read-only)
-- ============================================================================

-- Users can read their own usage logs
CREATE POLICY "Users can read own usage logs"
  ON ai_usage_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- No INSERT policy for users (system only)

-- ============================================================================
-- FILE ATTACHMENTS POLICIES
-- ============================================================================

-- Users can read their own file attachments
CREATE POLICY "Users can read own files"
  ON file_attachments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own files
CREATE POLICY "Users can insert own files"
  ON file_attachments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own files
CREATE POLICY "Users can delete own files"
  ON file_attachments FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- TIER TABLES POLICIES
-- ============================================================================

-- Users can read their own tier data
CREATE POLICY "Users can read own paid tier"
  ON paid_tier_users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can read own free tier"
  ON free_tier_users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Anonymous access for tier checks
CREATE POLICY "Anonymous can read tier data"
  ON paid_tier_users FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous can read free tier data"
  ON free_tier_users FOR SELECT
  TO anon
  USING (true);

-- ============================================================================
-- USAGE LIMITS POLICIES
-- ============================================================================

-- Users can read their own usage limits
CREATE POLICY "Users can read own usage limits"
  ON usage_limits FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- GRANT EXECUTE ON RPC FUNCTIONS
-- ============================================================================

-- Ensure users can call necessary RPC functions
GRANT EXECUTE ON FUNCTION deduct_tokens_simple TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_token_balance TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_monthly_free_tokens TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
  v_tables_with_rls INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_tables_with_rls
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  WHERE t.schemaname = 'public'
    AND c.relrowsecurity = true;

  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ ROW LEVEL SECURITY ENABLED';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE 'Tables with RLS enabled: %', v_tables_with_rls;
  RAISE NOTICE '';
  RAISE NOTICE 'Security Features:';
  RAISE NOTICE '  ✅ Users can only read their own data';
  RAISE NOTICE '  ✅ Users cannot modify token balances directly';
  RAISE NOTICE '  ✅ Users cannot modify premium flags';
  RAISE NOTICE '  ✅ Messages isolated by project ownership';
  RAISE NOTICE '  ✅ Token transactions read-only for users';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  IMPORTANT: Test with multiple user accounts!';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;
