/*
  # Add Stripe Payment Links to Pricing Plans

  1. Changes
    - Add `stripe_payment_link` column to `pricing_plans` table
    - Update existing plans with Stripe payment links
    - Add `stripe_price_id` column for price ID mapping

  2. Notes
    - Creator plan: https://buy.stripe.com/test_dRm5kC9zc5ZZ88DekPcV200
    - Pro plan: https://buy.stripe.com/test_4gMdR8eTw9cbfB590vcV201
*/

-- Add stripe columns to pricing_plans if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pricing_plans' AND column_name = 'stripe_payment_link'
  ) THEN
    ALTER TABLE pricing_plans ADD COLUMN stripe_payment_link text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pricing_plans' AND column_name = 'stripe_price_id'
  ) THEN
    ALTER TABLE pricing_plans ADD COLUMN stripe_price_id text;
  END IF;
END $$;

-- Update Creator plan with Stripe payment link
UPDATE pricing_plans
SET 
  stripe_payment_link = 'https://buy.stripe.com/test_dRm5kC9zc5ZZ88DekPcV200',
  stripe_price_id = 'creator_price_id'
WHERE name = 'creator';

-- Update Pro plan with Stripe payment link
UPDATE pricing_plans
SET 
  stripe_payment_link = 'https://buy.stripe.com/test_4gMdR8eTw9cbfB590vcV201',
  stripe_price_id = 'pro_price_id'
WHERE name = 'pro';