-- Add language column to reviews for per-language approval

ALTER TABLE IF EXISTS reviews
  ADD COLUMN IF NOT EXISTS language VARCHAR(16);

