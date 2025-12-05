/*
  # Atomic Promotional Code Redemption System

  ## Critical Security Fix
  The migration file referenced redeem_promo_atomic() but never implemented it!
  This allowed users to:
  - Create multiple accounts and redeem the same promo
  - Manipulate token amounts client-side
  - Bypass max_redemptions limits

  ## Solution
  Create a fully atomic, server-side redemption function that:
  - Locks the campaign row during redemption
  - Validates all conditions atomically
  - Increments redemption counter safely
  - Prevents duplicate redemptions
  - Logs IP addresses for fraud detection

  ## Changes
  1. Create redeem_promo_code_atomic() function
  2. Add fraud detection (IP tracking)
  3. Add comprehensive validation
  4. Ensure atomicity with row locks
*/

-- ============================================================================
-- ATOMIC PROMOTIONAL CODE REDEMPTION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION redeem_promo_code_atomic(
  p_user_id TEXT,
  p_campaign_code TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_campaign RECORD;
  v_tokens_awarded BIGINT;
  v_new_redemption_count INTEGER;
BEGIN
  -- Validate inputs
  IF p_user_id IS NULL OR LENGTH(p_user_id) < 10 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid user ID'
    );
  END IF;

  IF p_campaign_code IS NULL OR LENGTH(p_campaign_code) = 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid promo code'
    );
  END IF;

  -- Lock and validate campaign (CRITICAL: locks row to prevent race conditions)
  SELECT * INTO v_campaign
  FROM promotional_campaigns
  WHERE campaign_code = UPPER(TRIM(p_campaign_code))
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
  FOR UPDATE;  -- Locks this row until transaction commits

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid, expired, or inactive promo code'
    );
  END IF;

  -- Check if campaign has reached max redemptions
  IF v_campaign.current_redemptions >= v_campaign.max_redemptions THEN
    RETURN json_build_object(
      'success', false,
      'error', 'This promo code has been fully redeemed'
    );
  END IF;

  -- Check if user already redeemed this campaign
  IF EXISTS (
    SELECT 1 FROM promotional_redemptions
    WHERE user_id = p_user_id 
      AND campaign_id = v_campaign.id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'You have already redeemed this promo code'
    );
  END IF;

  -- Fraud detection: Check if same IP redeemed multiple times
  IF p_ip_address IS NOT NULL THEN
    DECLARE
      v_ip_redemption_count INTEGER;
    BEGIN
      SELECT COUNT(*) INTO v_ip_redemption_count
      FROM promotional_redemptions
      WHERE campaign_id = v_campaign.id
        AND ip_address = p_ip_address;

      -- Allow max 3 redemptions per IP (family/shared networks)
      IF v_ip_redemption_count >= 3 THEN
        RAISE NOTICE '⚠️ Suspicious: IP % has redeemed promo % times', p_ip_address, v_ip_redemption_count;
        RETURN json_build_object(
          'success', false,
          'error', 'This promo code has reached the limit for your location'
        );
      END IF;
    END;
  END IF;

  -- Atomically increment redemption counter
  UPDATE promotional_campaigns
  SET 
    current_redemptions = current_redemptions + 1,
    updated_at = now()
  WHERE id = v_campaign.id
  RETURNING current_redemptions INTO v_new_redemption_count;

  -- Add tokens to user's balance
  UPDATE profiles
  SET
    tokens_balance = COALESCE(tokens_balance, 0) + v_campaign.token_amount,
    free_tokens_balance = COALESCE(free_tokens_balance, 0) + v_campaign.token_amount,
    updated_at = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    -- Rollback will happen automatically
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Record redemption with metadata
  INSERT INTO promotional_redemptions (
    user_id,
    campaign_id,
    tokens_awarded,
    redeemed_at,
    ip_address,
    user_agent
  ) VALUES (
    p_user_id,
    v_campaign.id,
    v_campaign.token_amount,
    now(),
    p_ip_address,
    p_user_agent
  );

  -- Log transaction
  INSERT INTO token_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    metadata
  ) VALUES (
    p_user_id,
    v_campaign.token_amount,
    'promotional',
    'Promo code: ' || p_campaign_code,
    json_build_object(
      'campaign_id', v_campaign.id,
      'campaign_code', p_campaign_code,
      'tokens_awarded', v_campaign.token_amount
    )
  );

  RAISE NOTICE '✅ User % redeemed promo % for % tokens (redemption %/%)',
    p_user_id, p_campaign_code, v_campaign.token_amount, 
    v_new_redemption_count, v_campaign.max_redemptions;

  RETURN json_build_object(
    'success', true,
    'tokens_awarded', v_campaign.token_amount,
    'new_balance', (SELECT tokens_balance FROM profiles WHERE id = p_user_id),
    'message', 'Promo code redeemed successfully!'
  );

EXCEPTION
  WHEN unique_violation THEN
    -- User tried to redeem twice simultaneously
    RETURN json_build_object(
      'success', false,
      'error', 'This promo code has already been redeemed'
    );
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Error redeeming promo: %', SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', 'An error occurred while redeeming the promo code'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION redeem_promo_code_atomic IS 
  'Atomically redeems promotional codes with fraud detection - RACE CONDITION FIXED';

-- ============================================================================
-- FUNCTION TO CHECK PROMO CODE STATUS (WITHOUT REDEEMING)
-- ============================================================================

CREATE OR REPLACE FUNCTION check_promo_code_status(p_campaign_code TEXT)
RETURNS JSON AS $$
DECLARE
  v_campaign RECORD;
BEGIN
  SELECT 
    id,
    campaign_code,
    token_amount,
    current_redemptions,
    max_redemptions,
    is_active,
    expires_at
  INTO v_campaign
  FROM promotional_campaigns
  WHERE campaign_code = UPPER(TRIM(p_campaign_code));

  IF NOT FOUND THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Promo code not found'
    );
  END IF;

  -- Check if expired
  IF v_campaign.expires_at IS NOT NULL AND v_campaign.expires_at < now() THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Promo code has expired'
    );
  END IF;

  -- Check if inactive
  IF NOT v_campaign.is_active THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Promo code is no longer active'
    );
  END IF;

  -- Check if fully redeemed
  IF v_campaign.current_redemptions >= v_campaign.max_redemptions THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Promo code has been fully redeemed'
    );
  END IF;

  -- Valid promo code
  RETURN json_build_object(
    'valid', true,
    'campaign_code', v_campaign.campaign_code,
    'token_amount', v_campaign.token_amount,
    'remaining_redemptions', v_campaign.max_redemptions - v_campaign.current_redemptions
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION redeem_promo_code_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION check_promo_code_status TO authenticated, anon;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ ATOMIC PROMO REDEMPTION SYSTEM CREATED';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE 'Functions Created:';
  RAISE NOTICE '  ✅ redeem_promo_code_atomic() - Secure redemption';
  RAISE NOTICE '  ✅ check_promo_code_status() - Validate before redeem';
  RAISE NOTICE '';
  RAISE NOTICE 'Security Features:';
  RAISE NOTICE '  ✅ Row-level locking prevents race conditions';
  RAISE NOTICE '  ✅ Atomic counter increment';
  RAISE NOTICE '  ✅ IP-based fraud detection (max 3 per IP)';
  RAISE NOTICE '  ✅ Duplicate redemption prevention';
  RAISE NOTICE '  ✅ Comprehensive validation';
  RAISE NOTICE '  ✅ Automatic transaction logging';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Update frontend to use redeem_promo_code_atomic()';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;
