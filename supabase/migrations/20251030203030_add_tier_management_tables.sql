/*
  # Add Tier Management Tables

  1. New Tables
    - `tier_transitions` - Audit log of tier changes
    - `notification_queue` - Email notification queue
    
  2. Updates
    - Add grace period columns to profiles table
    
  3. Security
    - Enable RLS on new tables
*/

-- ============================================
-- 1. TIER TRANSITIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tier_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  from_tier text NOT NULL CHECK (from_tier IN ('free', 'paid')),
  to_tier text NOT NULL CHECK (to_tier IN ('free', 'paid')),
  reason text NOT NULL,
  tokens_at_transition bigint,
  triggered_by text DEFAULT 'system',
  manual_override boolean DEFAULT false,
  admin_notes text,
  transitioned_at timestamptz DEFAULT now()
);

-- ============================================
-- 2. NOTIFICATION QUEUE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN (
    'tokens_low', 'tokens_depleted', 'downgraded_to_free',
    'upgraded_to_paid', 'grace_period_started', 'grace_period_ending',
    'auto_refill_success', 'payment_failed'
  )),
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- 3. ADD GRACE PERIOD COLUMNS TO PROFILES
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'in_grace_period'
  ) THEN
    ALTER TABLE profiles ADD COLUMN in_grace_period boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'grace_period_ends_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN grace_period_ends_at timestamptz;
  END IF;
END $$;

-- ============================================
-- 4. ENABLE RLS
-- ============================================
ALTER TABLE tier_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tier_transitions_user ON tier_transitions(user_id, transitioned_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status, created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_notification_queue_user ON notification_queue(user_id, created_at DESC);
