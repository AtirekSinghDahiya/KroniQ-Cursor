/*
  # Comprehensive Usage Tracking System
  
  ## New Table
  - `ai_usage_logs` - Tracks every AI interaction with detailed cost information
  
  ## Columns
  - id: UUID primary key
  - user_id: TEXT (Firebase UID)
  - model: TEXT (AI model used)
  - provider: TEXT (OpenRouter, FAL, etc)
  - request_type: TEXT (chat, image, video, etc)
  - prompt: TEXT (user input)
  - tokens_used: BIGINT (tokens deducted)
  - openrouter_cost_usd: NUMERIC (actual cost from OpenRouter)
  - final_cost_usd: NUMERIC (cost after 2x multiplier)
  - success: BOOLEAN
  - error_message: TEXT (if failed)
  - created_at: TIMESTAMPTZ
  
  ## Purpose
  Track all AI usage with detailed cost breakdown for analytics and debugging
*/

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  model TEXT NOT NULL,
  provider TEXT NOT NULL,
  request_type TEXT NOT NULL DEFAULT 'chat',
  prompt TEXT,
  response_length INTEGER,
  tokens_used BIGINT NOT NULL DEFAULT 0,
  openrouter_cost_usd NUMERIC(10, 6),
  final_cost_usd NUMERIC(10, 6),
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON ai_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_model ON ai_usage_logs(model);

-- Disable RLS for Firebase auth
ALTER TABLE ai_usage_logs DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE ai_usage_logs IS 'Comprehensive tracking of all AI usage including costs and tokens';
