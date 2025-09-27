-- Schema initialization for AI Content Workflow
-- This script is executed by Postgres when initializing the DB container

CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_pieces (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL,
  original_content TEXT,
  language VARCHAR(16) DEFAULT 'en',
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_generations (
  id SERIAL PRIMARY KEY,
  content_piece_id INTEGER NOT NULL REFERENCES content_pieces(id) ON DELETE CASCADE,
  ai_model VARCHAR(64) NOT NULL,
  model_version VARCHAR(64),
  prompt_used TEXT,
  generated_text TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_generations_content ON ai_generations(content_piece_id);

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  content_piece_id INTEGER NOT NULL REFERENCES content_pieces(id) ON DELETE CASCADE,
  reviewer_name VARCHAR(255),
  status VARCHAR(50) NOT NULL,
  feedback TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_content ON reviews(content_piece_id);

CREATE TABLE IF NOT EXISTS translations (
  id SERIAL PRIMARY KEY,
  content_piece_id INTEGER NOT NULL REFERENCES content_pieces(id) ON DELETE CASCADE,
  target_language VARCHAR(16) NOT NULL,
  translated_text TEXT NOT NULL,
  ai_model VARCHAR(64),
  status VARCHAR(50) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_translations_content ON translations(content_piece_id);

-- Triggers to update updated_at on changes
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_campaigns_updated_at'
  ) THEN
    CREATE TRIGGER set_campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_content_pieces_updated_at'
  ) THEN
    CREATE TRIGGER set_content_pieces_updated_at
    BEFORE UPDATE ON content_pieces
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

