-- Add target_languages JSONB to campaigns for multi-language targets

ALTER TABLE IF EXISTS campaigns
  ADD COLUMN IF NOT EXISTS target_languages JSONB DEFAULT '[]'::jsonb;

