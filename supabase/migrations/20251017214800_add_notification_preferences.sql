/*
  # Add Notification Preferences

  1. Changes
    - Add `email_notifications` column to user_preferences
    - Add `product_updates` column to user_preferences
    - Add `marketing_emails` column to user_preferences

  2. Details
    - All columns are boolean with default true except marketing_emails (false)
    - These columns store user notification preferences
*/

-- Add notification preference columns
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS product_updates boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS marketing_emails boolean DEFAULT false;
