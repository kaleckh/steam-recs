-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "games" (
    "app_id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "metadata" JSONB,
    "embedding" vector(384),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("app_id")
);

-- Create IVFFlat index for vector similarity search
-- Note: For small datasets (<10k rows), use 'lists = rows / 1000'
-- For larger datasets, use 'lists = sqrt(rows)'
CREATE INDEX "games_embedding_idx" ON "games" USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
