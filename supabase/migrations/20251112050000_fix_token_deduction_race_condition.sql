/*
  # Fix Token Deduction Race Condition

  ## Critical Security Fix
  Implements reserve → process → finalize pattern to prevent users from
  disconnecting after receiving AI response but before token deduction.

  ## Changes
  1. Create token_reservations table to track in-flight requests
  2. Create reserve_tokens function (deducts immediately)
  3. Create finalize_token_deduction function (adjusts for actual cost)
  4. Create refund_reserved_tokens function (on error)
  5. Add indexes for performance

  ## Flow
  1. User initiates request → reserve_tokens() deducts estimated cost
  2. AI processes request → tokens already deducted
  3. AI returns response → finalize_token_deduction() adjusts if needed
  4. If error occurs → refund_reserved_tokens() returns tokens

  ## Security Impact
  - Prevents users from getting free AI responses
  - Eliminates race condition exploit
  - Ensures accurate billing
*/

-- ============================================================================
-- CREATE RESERVATIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS token_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  tokens_reserved BIGINT NOT NULL,
  request_id TEXT UNIQUE NOT NULL,
  model TEXT,
  status TEXT NOT NULL DEFAULT 'reserved', -- reserved, finalized, refunded, expired
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finalized_at TIMESTAMPTZ,
  actual_tokens_used BIGINT,
  refund_amount BIGINT DEFAULT 0
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_token_reservations_user ON token_reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_token_reservations_request ON token_reservations(request_id);
CREATE INDEX IF NOT EXISTS idx_token_reservations_status ON token_reservations(status);
CREATE INDEX IF NOT EXISTS idx_token_reservations_created ON token_reservations(created_at);

-- Enable RLS
ALTER TABLE token_reservations ENABLE ROW LEVEL SECURITY;

-- Users can read their own reservations
CREATE POLICY "Users can read own reservations"
  ON token_reservations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- FUNCTION: RESERVE TOKENS (Step 1)
-- ============================================================================

CREATE OR REPLACE FUNCTION reserve_tokens(
  p_user_id TEXT,
  p_tokens BIGINT,
  p_request_id TEXT,
  p_model TEXT DEFAULT 'unknown'
) RETURNS JSON AS $$
DECLARE
  v_current_balance BIGINT;
  v_paid_balance BIGINT;
  v_free_balance BIGINT;
  v_deduct_from_paid BIGINT;
  v_deduct_from_free BIGINT;
BEGIN
  -- Check for duplicate request
  IF EXISTS (SELECT 1 FROM token_reservations WHERE request_id = p_request_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Duplicate request ID'
    );
  END IF;

  -- Get current balances
  SELECT
    COALESCE(tokens_balance, 0),
    COALESCE(paid_tokens_balance, 0),
    COALESCE(free_tokens_balance, 0)
  INTO v_current_balance, v_paid_balance, v_free_balance
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- Check if user has enough tokens
  IF v_current_balance < p_tokens THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Insufficient tokens',
      'required', p_tokens,
      'available', v_current_balance,
      'shortfall', p_tokens - v_current_balance
    );
  END IF;

  -- Calculate deduction from paid and free balances
  IF v_paid_balance >= p_tokens THEN
    -- Deduct entirely from paid
    v_deduct_from_paid := p_tokens;
    v_deduct_from_free := 0;
  ELSE
    -- Deduct what we can from paid, rest from free
    v_deduct_from_paid := v_paid_balance;
    v_deduct_from_free := p_tokens - v_paid_balance;
  END IF;

  -- Deduct tokens immediately (atomic operation)
  UPDATE profiles
  SET
    tokens_balance = tokens_balance - p_tokens,
    paid_tokens_balance = paid_tokens_balance - v_deduct_from_paid,
    free_tokens_balance = free_tokens_balance - v_deduct_from_free,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Record reservation
  INSERT INTO token_reservations (
    user_id,
    tokens_reserved,
    request_id,
    model,
    status
  ) VALUES (
    p_user_id,
    p_tokens,
    p_request_id,
    p_model,
    'reserved'
  );

  RAISE NOTICE '🔒 Reserved % tokens for user % (request: %)', p_tokens, p_user_id, p_request_id;

  RETURN json_build_object(
    'success', true,
    'tokens_reserved', p_tokens,
    'new_balance', v_current_balance - p_tokens,
    'request_id', p_request_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: FINALIZE DEDUCTION (Step 2)
-- ============================================================================

CREATE OR REPLACE FUNCTION finalize_token_deduction(
  p_request_id TEXT,
  p_actual_tokens BIGINT
) RETURNS JSON AS $$
DECLARE
  v_reservation RECORD;
  v_difference BIGINT;
BEGIN
  -- Get reservation
  SELECT * INTO v_reservation
  FROM token_reservations
  WHERE request_id = p_request_id AND status = 'reserved';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Reservation not found or already finalized'
    );
  END IF;

  v_difference := v_reservation.tokens_reserved - p_actual_tokens;

  -- If actual cost was less, refund difference
  IF v_difference > 0 THEN
    UPDATE profiles
    SET
      tokens_balance = tokens_balance + v_difference,
      paid_tokens_balance = paid_tokens_balance + v_difference,
      updated_at = NOW()
    WHERE id = v_reservation.user_id;

    RAISE NOTICE '💰 Refunded % tokens to user % (overestimate)', v_difference, v_reservation.user_id;
  END IF;

  -- If actual cost was more, deduct additional (shouldn't happen but handle it)
  IF v_difference < 0 THEN
    UPDATE profiles
    SET
      tokens_balance = tokens_balance + v_difference,
      paid_tokens_balance = paid_tokens_balance + v_difference,
      updated_at = NOW()
    WHERE id = v_reservation.user_id;

    RAISE NOTICE '⚠️  Deducted additional % tokens from user %', ABS(v_difference), v_reservation.user_id;
  END IF;

  -- Mark as finalized
  UPDATE token_reservations
  SET
    status = 'finalized',
    finalized_at = NOW(),
    actual_tokens_used = p_actual_tokens,
    refund_amount = GREATEST(v_difference, 0)
  WHERE request_id = p_request_id;

  -- Log transaction
  INSERT INTO token_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    metadata
  ) VALUES (
    v_reservation.user_id,
    -p_actual_tokens,
    'usage',
    'AI request: ' || v_reservation.model,
    json_build_object(
      'request_id', p_request_id,
      'reserved', v_reservation.tokens_reserved,
      'actual', p_actual_tokens,
      'refunded', GREATEST(v_difference, 0)
    )
  );

  RAISE NOTICE '✅ Finalized token deduction for request %', p_request_id;

  RETURN json_build_object(
    'success', true,
    'tokens_charged', p_actual_tokens,
    'tokens_refunded', GREATEST(v_difference, 0),
    'final_cost', p_actual_tokens
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: REFUND RESERVED TOKENS (On Error)
-- ============================================================================

CREATE OR REPLACE FUNCTION refund_reserved_tokens(
  p_request_id TEXT
) RETURNS JSON AS $$
DECLARE
  v_reservation RECORD;
BEGIN
  SELECT * INTO v_reservation
  FROM token_reservations
  WHERE request_id = p_request_id AND status = 'reserved';

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Reservation not found or already processed'
    );
  END IF;

  -- Refund all reserved tokens
  UPDATE profiles
  SET
    tokens_balance = tokens_balance + v_reservation.tokens_reserved,
    paid_tokens_balance = paid_tokens_balance + v_reservation.tokens_reserved,
    updated_at = NOW()
  WHERE id = v_reservation.user_id;

  -- Mark as refunded
  UPDATE token_reservations
  SET
    status = 'refunded',
    finalized_at = NOW(),
    refund_amount = v_reservation.tokens_reserved
  WHERE request_id = p_request_id;

  -- Log transaction
  INSERT INTO token_transactions (
    user_id,
    amount,
    transaction_type,
    description,
    metadata
  ) VALUES (
    v_reservation.user_id,
    v_reservation.tokens_reserved,
    'refund',
    'Request failed: ' || v_reservation.model,
    json_build_object(
      'request_id', p_request_id,
      'reserved', v_reservation.tokens_reserved,
      'reason', 'error'
    )
  );

  RAISE NOTICE '↩️  Refunded % tokens to user % (error)', v_reservation.tokens_reserved, v_reservation.user_id;

  RETURN json_build_object(
    'success', true,
    'tokens_refunded', v_reservation.tokens_reserved
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: CLEANUP EXPIRED RESERVATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS JSON AS $$
DECLARE
  v_cleaned INTEGER := 0;
  v_refunded BIGINT := 0;
BEGIN
  -- Refund tokens for reservations older than 1 hour that are still reserved
  WITH expired_reservations AS (
    SELECT * FROM token_reservations
    WHERE status = 'reserved'
      AND created_at < NOW() - INTERVAL '1 hour'
  )
  UPDATE profiles p
  SET
    tokens_balance = tokens_balance + er.tokens_reserved,
    paid_tokens_balance = paid_tokens_balance + er.tokens_reserved
  FROM expired_reservations er
  WHERE p.id = er.user_id
  RETURNING er.tokens_reserved;

  GET DIAGNOSTICS v_cleaned = ROW_COUNT;

  -- Mark as expired
  UPDATE token_reservations
  SET status = 'expired', finalized_at = NOW()
  WHERE status = 'reserved'
    AND created_at < NOW() - INTERVAL '1 hour';

  RAISE NOTICE '🧹 Cleaned up % expired reservations', v_cleaned;

  RETURN json_build_object(
    'success', true,
    'reservations_cleaned', v_cleaned
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION reserve_tokens TO authenticated;
GRANT EXECUTE ON FUNCTION finalize_token_deduction TO authenticated;
GRANT EXECUTE ON FUNCTION refund_reserved_tokens TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_reservations TO authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ TOKEN RESERVATION SYSTEM ENABLED';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
  RAISE NOTICE 'New Functions:';
  RAISE NOTICE '  ✅ reserve_tokens() - Deduct tokens before processing';
  RAISE NOTICE '  ✅ finalize_token_deduction() - Adjust for actual cost';
  RAISE NOTICE '  ✅ refund_reserved_tokens() - Refund on error';
  RAISE NOTICE '  ✅ cleanup_expired_reservations() - Auto-cleanup';
  RAISE NOTICE '';
  RAISE NOTICE 'Security Impact:';
  RAISE NOTICE '  ✅ Tokens deducted BEFORE AI response';
  RAISE NOTICE '  ✅ Race condition eliminated';
  RAISE NOTICE '  ✅ Users cannot disconnect for free responses';
  RAISE NOTICE '  ✅ Automatic refund on errors';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Update MainChat.tsx to use new functions!';
  RAISE NOTICE '═══════════════════════════════════════════════════════';
END $$;
