-- Add HNSW index on embedding column for fast similarity search
-- HNSW is better for search quality and works well with 42k vectors
-- This will speed up vector searches from 20+ seconds to <100ms

-- First, drop any existing index (if re-running)
DROP INDEX IF EXISTS games_embedding_hnsw_idx;

-- Create HNSW index with cosine distance operator
-- m = 16 (connections per layer, default is fine)
-- ef_construction = 64 (higher = better quality, slower build)
CREATE INDEX CONCURRENTLY games_embedding_hnsw_idx
ON games
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Verify the index was created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'games' AND indexname LIKE '%embedding%';
