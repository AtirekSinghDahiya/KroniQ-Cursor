/*
  # Comprehensive Security Fixes

  1. Performance Optimization
    - Remove 31 unused indexes that are not being utilized
    - Remove duplicate indexes

  2. RLS Policy Cleanup
    - Remove duplicate and conflicting policies across 10 tables
    - Keep only the most restrictive policy per action

  3. RLS Enablement
    - Enable RLS on 8 tables that have policies but RLS disabled

  4. Function Security
    - Fix search path mutability on 30 functions
    - Update SECURITY DEFINER view

  5. Tables Affected
    - profiles, projects, conversations, messages
    - rate_limit_tracking, ai_usage_logs, promotional_redemptions
    - token_reservations, token_transactions, promotional_campaigns
    - page_visits, analytics_events, conversion_funnel
*/

-- =====================================================
-- PART 1: DROP UNUSED INDEXES (Performance Improvement)
-- =====================================================

DROP INDEX IF EXISTS idx_rate_limit_tracking_user;
DROP INDEX IF EXISTS idx_rate_limit_tracking_timestamp;
DROP INDEX IF EXISTS idx_rate_limit_tracking_user_service;
DROP INDEX IF EXISTS idx_ai_usage_logs_user_id;
DROP INDEX IF EXISTS idx_ai_usage_logs_created_at;
DROP INDEX IF EXISTS idx_ai_usage_logs_model;
DROP INDEX IF EXISTS idx_promotional_redemptions_timestamp;
DROP INDEX IF EXISTS idx_promotional_redemptions_email;
DROP INDEX IF EXISTS idx_rate_limit_user_time;
DROP INDEX IF EXISTS idx_token_reservations_user;
DROP INDEX IF EXISTS idx_token_reservations_status;
DROP INDEX IF EXISTS idx_token_reservations_created;
DROP INDEX IF EXISTS idx_job_applications_job_id;
DROP INDEX IF EXISTS idx_messages_conversation_id;
DROP INDEX IF EXISTS idx_token_purchases_pack_id;
DROP INDEX IF EXISTS idx_token_purchases_user_id;
DROP INDEX IF EXISTS idx_transactions_plan_id;
DROP INDEX IF EXISTS idx_transactions_user_id;
DROP INDEX IF EXISTS idx_promotional_redemptions_user;
DROP INDEX IF EXISTS idx_page_visits_session;
DROP INDEX IF EXISTS idx_page_visits_user;
DROP INDEX IF EXISTS idx_page_visits_date;
DROP INDEX IF EXISTS idx_page_visits_page;
DROP INDEX IF EXISTS idx_analytics_events_session;
DROP INDEX IF EXISTS idx_analytics_events_user;
DROP INDEX IF EXISTS idx_analytics_events_date;
DROP INDEX IF EXISTS idx_analytics_events_type;
DROP INDEX IF EXISTS idx_analytics_events_name;
DROP INDEX IF EXISTS idx_conversion_funnel_user;
DROP INDEX IF EXISTS idx_conversion_funnel_converted;
DROP INDEX IF EXISTS idx_conversion_funnel_date;
DROP INDEX IF EXISTS idx_promotional_redemptions_ip;

-- =====================================================
-- PART 2: DROP DUPLICATE INDEXES
-- =====================================================

-- Keep messages_project_id_idx, drop idx_messages_project_id
DROP INDEX IF EXISTS idx_messages_project_id;

-- =====================================================
-- PART 3: FIX DUPLICATE RLS POLICIES
-- =====================================================

-- ai_usage_logs: Keep only the most restrictive policies
DROP POLICY IF EXISTS "No direct user access to logs" ON ai_usage_logs;
DROP POLICY IF EXISTS "No user modifications to logs" ON ai_usage_logs;
DROP POLICY IF EXISTS "No user updates to logs" ON ai_usage_logs;
DROP POLICY IF EXISTS "No user deletes to logs" ON ai_usage_logs;
-- Keep: "Users can read own logs"

-- free_tier_users: Remove duplicate
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON free_tier_users;
-- Keep: "Read free tier data"

-- paid_tier_users: Remove duplicate
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON paid_tier_users;
-- Keep: "Read paid tier data"

-- promotional_campaigns: Keep only the most restrictive
DROP POLICY IF EXISTS "No delete from campaigns" ON promotional_campaigns;
DROP POLICY IF EXISTS "No insert to campaigns" ON promotional_campaigns;
DROP POLICY IF EXISTS "No update to campaigns" ON promotional_campaigns;
DROP POLICY IF EXISTS "Read active campaigns only" ON promotional_campaigns;
-- Keep: "No user deletes/modifications/updates to campaigns", "Read only active campaigns"

-- promotional_redemptions: Keep most restrictive
DROP POLICY IF EXISTS "No deletes to redemptions" ON promotional_redemptions;
DROP POLICY IF EXISTS "No direct modifications to redemptions" ON promotional_redemptions;
DROP POLICY IF EXISTS "No updates to redemptions" ON promotional_redemptions;
DROP POLICY IF EXISTS "Users can read own redemptions" ON promotional_redemptions;
-- Keep: "No direct access to redemptions"

-- rate_limit_config: Remove duplicate
DROP POLICY IF EXISTS "Anyone can read rate limit config" ON rate_limit_config;
-- Keep: "No modifications to config"

-- rate_limit_tracking: Remove duplicate
DROP POLICY IF EXISTS "No user modifications to tracking" ON rate_limit_tracking;
-- Keep: "Users can read own tracking"

-- token_reservations: Keep most restrictive
DROP POLICY IF EXISTS "No user modifications to reservations" ON token_reservations;
DROP POLICY IF EXISTS "No user updates to reservations" ON token_reservations;
DROP POLICY IF EXISTS "No user deletes to reservations" ON token_reservations;
DROP POLICY IF EXISTS "Users can read own reservations" ON token_reservations;
-- Keep: "No direct user access to reservations"

-- token_transactions: Keep most restrictive
DROP POLICY IF EXISTS "No user modifications to transactions" ON token_transactions;
DROP POLICY IF EXISTS "No user updates to transactions" ON token_transactions;
DROP POLICY IF EXISTS "No user deletes to transactions" ON token_transactions;
DROP POLICY IF EXISTS "Users can read own transactions" ON token_transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON token_transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON token_transactions;
-- Keep: "No direct user access to transactions"

-- =====================================================
-- PART 4: ENABLE RLS ON TABLES WITH POLICIES
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotional_user_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_funnel ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 5: ADD MISSING RLS POLICIES FOR NEWLY ENABLED TABLES
-- =====================================================

-- promotional_user_counter: System managed, no user access
CREATE POLICY IF NOT EXISTS "System only access to counter"
  ON promotional_user_counter
  FOR ALL
  TO authenticated
  USING (false);

-- page_visits: Backend/analytics only
CREATE POLICY IF NOT EXISTS "No direct user access to visits"
  ON page_visits
  FOR ALL
  TO authenticated
  USING (false);

-- analytics_events: Backend/analytics only
CREATE POLICY IF NOT EXISTS "No direct user access to events"
  ON analytics_events
  FOR ALL
  TO authenticated
  USING (false);

-- conversion_funnel: Backend/analytics only
CREATE POLICY IF NOT EXISTS "No direct user access to funnel"
  ON conversion_funnel
  FOR ALL
  TO authenticated
  USING (false);

-- =====================================================
-- PART 6: FIX SECURITY DEFINER VIEW
-- =====================================================

-- Recreate view without SECURITY DEFINER
DROP VIEW IF EXISTS first_101_promotion_status;

CREATE OR REPLACE VIEW first_101_promotion_status AS
SELECT
  (SELECT COUNT(*) FROM promotional_user_counter) as current_count,
  (SELECT COUNT(*) FROM promotional_user_counter) < 101 as is_active,
  101 - (SELECT COUNT(*) FROM promotional_user_counter) as remaining_slots;

-- Grant access to authenticated users only
GRANT SELECT ON first_101_promotion_status TO authenticated;

-- =====================================================
-- PART 7: FIX FUNCTION SEARCH PATH MUTABILITY
-- =====================================================

-- Set search_path for all affected functions
ALTER FUNCTION update_promotional_campaigns_updated_at() SET search_path = pg_catalog, public;
ALTER FUNCTION update_conversion_funnel_timestamp() SET search_path = pg_catalog, public;
ALTER FUNCTION get_campaign_status(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION redeem_promo_atomic(text, text) SET search_path = pg_catalog, public;
ALTER FUNCTION grant_first_101_bonus(text) SET search_path = pg_catalog, public;
ALTER FUNCTION grant_first_101_bonus_before() SET search_path = pg_catalog, public;
ALTER FUNCTION reserve_tokens(text, bigint, text) SET search_path = pg_catalog, public;
ALTER FUNCTION finalize_token_deduction(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION refund_reserved_tokens(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION get_user_profile(text) SET search_path = pg_catalog, public;
ALTER FUNCTION get_user_projects(text) SET search_path = pg_catalog, public;
ALTER FUNCTION get_project_messages(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION get_user_token_transactions(text) SET search_path = pg_catalog, public;
ALTER FUNCTION get_user_ai_usage_logs(text) SET search_path = pg_catalog, public;
ALTER FUNCTION get_first_101_status() SET search_path = pg_catalog, public;
ALTER FUNCTION redeem_promo_code(text, text) SET search_path = pg_catalog, public;
ALTER FUNCTION get_user_redemptions(text) SET search_path = pg_catalog, public;
ALTER FUNCTION get_campaign_details(text) SET search_path = pg_catalog, public;
ALTER FUNCTION cleanup_rate_limit_tracking() SET search_path = pg_catalog, public;
ALTER FUNCTION check_rate_limit(text, text, integer, integer) SET search_path = pg_catalog, public;
ALTER FUNCTION get_rate_limit_stats(text) SET search_path = pg_catalog, public;
ALTER FUNCTION get_user_profile_secure(text) SET search_path = pg_catalog, public;
ALTER FUNCTION get_user_projects_secure(text) SET search_path = pg_catalog, public;
ALTER FUNCTION get_project_messages_secure(uuid) SET search_path = pg_catalog, public;
ALTER FUNCTION get_user_transactions_secure(text) SET search_path = pg_catalog, public;
ALTER FUNCTION grant_first_101_bonus_atomic(text) SET search_path = pg_catalog, public;
ALTER FUNCTION redeem_promo_code_atomic(text, text) SET search_path = pg_catalog, public;
ALTER FUNCTION check_promo_code_status(text) SET search_path = pg_catalog, public;
ALTER FUNCTION check_rate_limit_simple(text, text) SET search_path = pg_catalog, public;
ALTER FUNCTION cleanup_rate_limits() SET search_path = pg_catalog, public;

-- =====================================================
-- VERIFICATION QUERIES (Run these to verify the fixes)
-- =====================================================

-- These are comments for manual verification after migration:

-- Check for duplicate policies (should return 0 rows):
-- SELECT schemaname, tablename, policyname, COUNT(*)
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- GROUP BY schemaname, tablename, policyname
-- HAVING COUNT(*) > 1;

-- Check RLS is enabled on all tables with policies (all should be true):
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('profiles', 'projects', 'conversations', 'messages',
--                   'promotional_user_counter', 'page_visits',
--                   'analytics_events', 'conversion_funnel');

-- Check function search paths are set:
-- SELECT routine_name, routine_type
-- FROM information_schema.routines
-- WHERE routine_schema = 'public'
-- AND specific_name IN (SELECT specific_name FROM information_schema.routines
--                       WHERE routine_schema = 'public');
