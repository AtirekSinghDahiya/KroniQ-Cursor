/*
  # Fix Premium Flags Sync - Strict user_type Check
  
  ## Changes
  1. Update auto_sync_premium_flags function
     - Check user_type field as PRIMARY source of truth
     - Only set premium flags if user_type = 'paid'
     - Do NOT grant premium access based on token balance alone
  
  2. Logic:
     - If user_type = 'paid' AND has paid_tokens_balance > 0 → Premium
     - If user_type = 'free' (even with tokens) → NOT Premium
     - Only actual payments through Stripe set user_type = 'paid'
  
  ## Security
  - Prevents promotional token users from getting premium access
  - user_type is only set by payment system, not by token grants
*/

CREATE OR REPLACE FUNCTION public.auto_sync_premium_flags()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
v_paid_tokens bigint;
v_user_type text;
BEGIN
  -- Get values
  v_paid_tokens := COALESCE(NEW.paid_tokens_balance, 0);
  v_user_type := COALESCE(NEW.user_type, 'free');

  -- CRITICAL: Only user_type = 'paid' gets premium access
  -- Token balance alone does NOT grant premium access
  IF v_user_type = 'paid' AND v_paid_tokens > 0 THEN
    NEW.is_premium := TRUE;
    NEW.is_paid := TRUE;
    NEW.is_paid_user := TRUE;
    NEW.current_tier := 'premium';
  ELSE
    -- Free users stay free, even with promotional tokens
    NEW.is_premium := FALSE;
    NEW.is_paid := FALSE;
    NEW.is_paid_user := FALSE;
    NEW.current_tier := 'free';
    
    -- Ensure user_type stays 'free' if not explicitly paid
    IF v_user_type != 'paid' THEN
      NEW.user_type := 'free';
    END IF;
  END IF;

  NEW.updated_at := NOW();

  RETURN NEW;
END;
$function$;
