-- Add default_language to campaigns and quality_score to translations

ALTER TABLE IF EXISTS campaigns
  ADD COLUMN IF NOT EXISTS default_language VARCHAR(16) DEFAULT 'en';

ALTER TABLE IF EXISTS translations
  ADD COLUMN IF NOT EXISTS quality_score FLOAT;

