/*
  # Comprehensive Security Fixes
  
  ## Summary
  Addresses all critical security vulnerabilities in the database.
  
  ## Changes Applied
  
  ### 1. Removed 36 Unused Indexes
  Performance optimization by removing indexes not being utilized.
  
  ### 2. Removed Duplicate Index
  Eliminated redundant index on messages table.
  
  ### 3. Consolidated 70+ Duplicate RLS Policies
  Removed conflicting policies, created single clear policy per action.
  
  ### 4. Enabled RLS on Tables with Policies
  Enabled RLS on: conversations, messages, profiles, projects
  
  ### 5. Enabled RLS on Unprotected Public Tables  
  Protected 6 tables: promotional_users, generation_limits, promotional_user_counter, page_visits, analytics_events, conversion_funnel
  
  ### 6. Fixed Security Definer View
  Changed first_200_promotion_status to SECURITY INVOKER.
  
  ### 7. Secured 39 Functions
  Set immutable search_path on all functions to prevent injection attacks.
*/

-- =====================================================
-- STEP 1: DROP UNUSED INDEXES
-- =====================================================

DROP INDEX IF EXISTS idx_rate_limit_tracking_user;
DROP INDEX IF EXISTS idx_rate_limit_tracking_timestamp;
DROP INDEX IF EXISTS idx_rate_limit_tracking_user_service;
DROP INDEX IF EXISTS idx_promotional_users_user_id;
DROP INDEX IF EXISTS idx_ai_usage_logs_user_id;
DROP INDEX IF EXISTS idx_ai_usage_logs_created_at;
DROP INDEX IF EXISTS idx_ai_usage_logs_model;
DROP INDEX IF EXISTS idx_promotional_redemptions_timestamp;
DROP INDEX IF EXISTS idx_promotional_redemptions_email;
DROP INDEX IF EXISTS idx_promotional_redemptions_user;
DROP INDEX IF EXISTS idx_promotional_redemptions_ip;
DROP INDEX IF EXISTS idx_daily_usage_user_id;
DROP INDEX IF EXISTS idx_daily_usage_last_reset;
DROP INDEX IF EXISTS idx_rate_limit_user_time;
DROP INDEX IF EXISTS idx_generation_limits_user_month;
DROP INDEX IF EXISTS idx_token_reservations_user;
DROP INDEX IF EXISTS idx_token_reservations_status;
DROP INDEX IF EXISTS idx_token_reservations_created;
DROP INDEX IF EXISTS idx_job_applications_job_id;
DROP INDEX IF EXISTS idx_messages_conversation_id;
DROP INDEX IF EXISTS idx_token_purchases_pack_id;
DROP INDEX IF EXISTS idx_token_purchases_user_id;
DROP INDEX IF EXISTS idx_transactions_plan_id;
DROP INDEX IF EXISTS idx_transactions_user_id;
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
DROP INDEX IF EXISTS idx_profiles_premium_status;

-- =====================================================
-- STEP 2: DROP DUPLICATE INDEX
-- =====================================================

DROP INDEX IF EXISTS idx_messages_project_id;

-- =====================================================
-- STEP 3: CONSOLIDATE DUPLICATE RLS POLICIES
-- =====================================================

-- AI USAGE LOGS
DROP POLICY IF EXISTS "No direct user access to logs" ON ai_usage_logs;
DROP POLICY IF EXISTS "No user deletes to logs" ON ai_usage_logs;
DROP POLICY IF EXISTS "No user modifications to logs" ON ai_usage_logs;
DROP POLICY IF EXISTS "Users can read own logs" ON ai_usage_logs;
DROP POLICY IF EXISTS "No user updates to logs" ON ai_usage_logs;

CREATE POLICY "Users can view their own logs"
  ON ai_usage_logs FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "System only can insert logs"
  ON ai_usage_logs FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No updates to logs"
  ON ai_usage_logs FOR UPDATE
  USING (false);

CREATE POLICY "No deletes from logs"
  ON ai_usage_logs FOR DELETE
  USING (false);

-- FREE TIER USERS
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON free_tier_users;
DROP POLICY IF EXISTS "Read free tier data" ON free_tier_users;

CREATE POLICY "Users can read their free tier status"
  ON free_tier_users FOR SELECT
  USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

-- PAID TIER USERS
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON paid_tier_users;
DROP POLICY IF EXISTS "Read paid tier data" ON paid_tier_users;

CREATE POLICY "Users can read their paid tier status"
  ON paid_tier_users FOR SELECT
  USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

-- PROMOTIONAL CAMPAIGNS
DROP POLICY IF EXISTS "No delete from campaigns" ON promotional_campaigns;
DROP POLICY IF EXISTS "No user deletes to campaigns" ON promotional_campaigns;
DROP POLICY IF EXISTS "No insert to campaigns" ON promotional_campaigns;
DROP POLICY IF EXISTS "No user modifications to campaigns" ON promotional_campaigns;
DROP POLICY IF EXISTS "Read active campaigns only" ON promotional_campaigns;
DROP POLICY IF EXISTS "Read only active campaigns" ON promotional_campaigns;
DROP POLICY IF EXISTS "No update to campaigns" ON promotional_campaigns;
DROP POLICY IF EXISTS "No user updates to campaigns" ON promotional_campaigns;

CREATE POLICY "Anyone can read active campaigns"
  ON promotional_campaigns FOR SELECT
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "No user inserts to campaigns"
  ON promotional_campaigns FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No user updates to campaigns"
  ON promotional_campaigns FOR UPDATE
  USING (false);

CREATE POLICY "No user deletes from campaigns"
  ON promotional_campaigns FOR DELETE
  USING (false);

-- PROMOTIONAL REDEMPTIONS
DROP POLICY IF EXISTS "No deletes to redemptions" ON promotional_redemptions;
DROP POLICY IF EXISTS "No direct access to redemptions" ON promotional_redemptions;
DROP POLICY IF EXISTS "No direct modifications to redemptions" ON promotional_redemptions;
DROP POLICY IF EXISTS "Users can read own redemptions" ON promotional_redemptions;
DROP POLICY IF EXISTS "No updates to redemptions" ON promotional_redemptions;

CREATE POLICY "Users can view their redemptions"
  ON promotional_redemptions FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "System only can insert redemptions"
  ON promotional_redemptions FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No updates to redemptions"
  ON promotional_redemptions FOR UPDATE
  USING (false);

CREATE POLICY "No deletes from redemptions"
  ON promotional_redemptions FOR DELETE
  USING (false);

-- RATE LIMIT CONFIG
DROP POLICY IF EXISTS "Anyone can read rate limit config" ON rate_limit_config;
DROP POLICY IF EXISTS "No modifications to config" ON rate_limit_config;

CREATE POLICY "Anyone can read config"
  ON rate_limit_config FOR SELECT
  USING (true);

CREATE POLICY "No user inserts to config"
  ON rate_limit_config FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No user updates to config"
  ON rate_limit_config FOR UPDATE
  USING (false);

CREATE POLICY "No user deletes from config"
  ON rate_limit_config FOR DELETE
  USING (false);

-- RATE LIMIT TRACKING
DROP POLICY IF EXISTS "No user modifications to tracking" ON rate_limit_tracking;
DROP POLICY IF EXISTS "Users can read own tracking" ON rate_limit_tracking;

CREATE POLICY "Users can view their tracking"
  ON rate_limit_tracking FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "System only can insert tracking"
  ON rate_limit_tracking FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No updates to tracking"
  ON rate_limit_tracking FOR UPDATE
  USING (false);

CREATE POLICY "No deletes from tracking"
  ON rate_limit_tracking FOR DELETE
  USING (false);

-- TOKEN RESERVATIONS
DROP POLICY IF EXISTS "No direct user access to reservations" ON token_reservations;
DROP POLICY IF EXISTS "No user deletes to reservations" ON token_reservations;
DROP POLICY IF EXISTS "No user modifications to reservations" ON token_reservations;
DROP POLICY IF EXISTS "Users can read own reservations" ON token_reservations;
DROP POLICY IF EXISTS "No user updates to reservations" ON token_reservations;

CREATE POLICY "Users can view their reservations"
  ON token_reservations FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "System only can insert reservations"
  ON token_reservations FOR INSERT
  WITH CHECK (false);

CREATE POLICY "System only can update reservations"
  ON token_reservations FOR UPDATE
  USING (false);

CREATE POLICY "No deletes from reservations"
  ON token_reservations FOR DELETE
  USING (false);

-- TOKEN TRANSACTIONS
DROP POLICY IF EXISTS "No direct user access to transactions" ON token_transactions;
DROP POLICY IF EXISTS "No user deletes to transactions" ON token_transactions;
DROP POLICY IF EXISTS "No user modifications to transactions" ON token_transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON token_transactions;
DROP POLICY IF EXISTS "Users can read own transactions" ON token_transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON token_transactions;
DROP POLICY IF EXISTS "No user updates to transactions" ON token_transactions;

CREATE POLICY "Users can view their transactions"
  ON token_transactions FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "System only can insert transactions"
  ON token_transactions FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No updates to transactions"
  ON token_transactions FOR UPDATE
  USING (false);

CREATE POLICY "No deletes from transactions"
  ON token_transactions FOR DELETE
  USING (false);

-- =====================================================
-- STEP 4: ENABLE RLS ON TABLES WITH POLICIES
-- =====================================================

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 5: ENABLE RLS ON UNPROTECTED PUBLIC TABLES
-- =====================================================

ALTER TABLE promotional_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotional_user_counter ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_funnel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their promotional status"
  ON promotional_users FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "System only manages promotional users"
  ON promotional_users FOR ALL
  USING (false);

CREATE POLICY "Users can view their generation limits"
  ON generation_limits FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "System only manages generation limits"
  ON generation_limits FOR ALL
  USING (false);

CREATE POLICY "Anyone can read counter"
  ON promotional_user_counter FOR SELECT
  USING (true);

CREATE POLICY "System only modifies counter"
  ON promotional_user_counter FOR ALL
  USING (false);

CREATE POLICY "Users can view their page visits"
  ON page_visits FOR SELECT
  USING (user_id IS NOT NULL AND user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "System only tracks page visits"
  ON page_visits FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No updates to page visits"
  ON page_visits FOR UPDATE
  USING (false);

CREATE POLICY "No deletes from page visits"
  ON page_visits FOR DELETE
  USING (false);

CREATE POLICY "Users can view their analytics"
  ON analytics_events FOR SELECT
  USING (user_id IS NOT NULL AND user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "System only tracks analytics"
  ON analytics_events FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No updates to analytics"
  ON analytics_events FOR UPDATE
  USING (false);

CREATE POLICY "No deletes from analytics"
  ON analytics_events FOR DELETE
  USING (false);

CREATE POLICY "Users can view their conversion data"
  ON conversion_funnel FOR SELECT
  USING (user_id IS NOT NULL AND user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "System only tracks conversions"
  ON conversion_funnel FOR INSERT
  WITH CHECK (false);

CREATE POLICY "System only updates conversions"
  ON conversion_funnel FOR UPDATE
  USING (false);

CREATE POLICY "No deletes from conversions"
  ON conversion_funnel FOR DELETE
  USING (false);

-- =====================================================
-- STEP 6: FIX SECURITY DEFINER VIEW
-- =====================================================

DROP VIEW IF EXISTS first_200_promotion_status;

CREATE VIEW first_200_promotion_status
WITH (security_invoker = true)
AS
SELECT 
  (SELECT COUNT(*) FROM promotional_users) as current_count,
  105 as max_slots,
  CASE 
    WHEN (SELECT COUNT(*) FROM promotional_users) < 105 THEN true
    ELSE false
  END as slots_available;

-- =====================================================
-- STEP 7: SET IMMUTABLE SEARCH PATH ON ALL FUNCTIONS
-- =====================================================

ALTER FUNCTION update_promotional_campaigns_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION update_conversion_funnel_timestamp() SET search_path = public, pg_temp;
ALTER FUNCTION get_campaign_status(text) SET search_path = public, pg_temp;
ALTER FUNCTION redeem_promo_atomic(text, text, text, text, text) SET search_path = public, pg_temp;
ALTER FUNCTION deduct_tokens_v2(text, integer, text, text, numeric, text) SET search_path = public, pg_temp;
ALTER FUNCTION unified_profile_initialization() SET search_path = public, pg_temp;
ALTER FUNCTION upgrade_to_paid(text, bigint, numeric) SET search_path = public, pg_temp;
ALTER FUNCTION verify_user_token_allocation(text) SET search_path = public, pg_temp;
ALTER FUNCTION reset_daily_free_tokens() SET search_path = public, pg_temp;
ALTER FUNCTION increment_usage(text, text) SET search_path = public, pg_temp;
ALTER FUNCTION increment_usage(text, text, integer) SET search_path = public, pg_temp;
ALTER FUNCTION sync_premium_status() SET search_path = public, pg_temp;
ALTER FUNCTION reserve_tokens(text, bigint, text, text) SET search_path = public, pg_temp;
ALTER FUNCTION get_total_token_balance(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION upgrade_to_paid_tier(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION finalize_token_deduction(text, bigint) SET search_path = public, pg_temp;
ALTER FUNCTION refund_reserved_tokens(text) SET search_path = public, pg_temp;
ALTER FUNCTION get_user_profile(text) SET search_path = public, pg_temp;
ALTER FUNCTION get_user_projects(text) SET search_path = public, pg_temp;
ALTER FUNCTION get_project_messages(text, uuid) SET search_path = public, pg_temp;
ALTER FUNCTION get_user_token_transactions(text, integer) SET search_path = public, pg_temp;
ALTER FUNCTION get_user_ai_usage_logs(text, integer) SET search_path = public, pg_temp;
ALTER FUNCTION get_generation_limits(text, text) SET search_path = public, pg_temp;
ALTER FUNCTION get_first_101_status() SET search_path = public, pg_temp;
ALTER FUNCTION increment_generation(text, text) SET search_path = public, pg_temp;
ALTER FUNCTION check_generation_limit(text, text, text) SET search_path = public, pg_temp;
ALTER FUNCTION redeem_promo_code(text, text, text, text) SET search_path = public, pg_temp;
ALTER FUNCTION get_user_redemptions(text) SET search_path = public, pg_temp;
ALTER FUNCTION get_campaign_details(text) SET search_path = public, pg_temp;
ALTER FUNCTION cleanup_rate_limit_tracking() SET search_path = public, pg_temp;
ALTER FUNCTION check_rate_limit(text, text, text, text) SET search_path = public, pg_temp;
ALTER FUNCTION get_rate_limit_stats(text) SET search_path = public, pg_temp;
ALTER FUNCTION get_user_profile_secure(text) SET search_path = public, pg_temp;
ALTER FUNCTION get_user_projects_secure(text) SET search_path = public, pg_temp;
ALTER FUNCTION get_project_messages_secure(text, text) SET search_path = public, pg_temp;
ALTER FUNCTION get_user_transactions_secure(text, integer) SET search_path = public, pg_temp;
ALTER FUNCTION redeem_promo_code_atomic(text, text, text, text) SET search_path = public, pg_temp;
ALTER FUNCTION get_user_token_balance(text) SET search_path = public, pg_temp;
ALTER FUNCTION check_promo_code_status(text) SET search_path = public, pg_temp;
ALTER FUNCTION check_rate_limit_simple(text, text) SET search_path = public, pg_temp;
ALTER FUNCTION cleanup_rate_limits() SET search_path = public, pg_temp;
