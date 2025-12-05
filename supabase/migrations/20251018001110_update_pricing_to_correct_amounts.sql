/*
  # Update Pricing Plans to Correct Amounts

  1. Changes
    - Update Creator plan price from $9 to $9.99
    - Update Pro plan price from $29 CAD to $29 USD
    - Ensure prices are accurate for Stripe integration

  2. Notes
    - Creator plan: $9.99/month
    - Pro plan: $29.00/month (USD)
*/

-- Update Creator plan pricing
UPDATE pricing_plans
SET 
  price = 9.99,
  updated_at = now()
WHERE name = 'creator';

-- Update Pro plan pricing
UPDATE pricing_plans
SET 
  price = 29.00,
  updated_at = now()
WHERE name = 'pro';