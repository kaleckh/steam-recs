-- Migration: Update vector dimensions from 384 to 1536 for OpenAI embeddings
-- This must be run BEFORE re-embedding games

-- Step 1: Drop the old embedding column and create new one with 1536 dimensions
-- Note: This will DELETE all existing embeddings (they need to be regenerated anyway)

BEGIN;

-- Drop indexes that depend on the embedding column
DROP INDEX IF EXISTS games_embedding_idx;
DROP INDEX IF EXISTS user_profiles_preference_vector_idx;
DROP INDEX IF EXISTS user_profiles_learned_vector_idx;

-- Alter the games table
ALTER TABLE games DROP COLUMN IF EXISTS embedding;
ALTER TABLE games ADD COLUMN embedding vector(1536);

-- Alter user_profiles table
ALTER TABLE user_profiles DROP COLUMN IF EXISTS preference_vector;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS learned_vector;
ALTER TABLE user_profiles ADD COLUMN preference_vector vector(1536);
ALTER TABLE user_profiles ADD COLUMN learned_vector vector(1536);

-- Recreate indexes for vector similarity search (using IVFFlat for large datasets)
-- IVFFlat is faster than HNSW for bulk inserts, which we need for re-embedding
-- Can switch to HNSW later for faster queries if needed

-- For games: use IVFFlat with lists = sqrt(n) ~ 150 for 22k games
CREATE INDEX games_embedding_idx ON games
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 150);

-- For user profiles: smaller dataset, simple index is fine
CREATE INDEX user_profiles_preference_vector_idx ON user_profiles
USING ivfflat (preference_vector vector_cosine_ops)
WITH (lists = 50);

CREATE INDEX user_profiles_learned_vector_idx ON user_profiles
USING ivfflat (learned_vector vector_cosine_ops)
WITH (lists = 50);

COMMIT;

-- Verify the changes
SELECT
  column_name,
  udt_name,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'games' AND column_name = 'embedding';
