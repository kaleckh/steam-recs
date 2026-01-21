import { Prisma } from '@prisma/client';
import prisma from './prisma';

/**
 * Insert a game with its embedding vector
 * 
 * @param appId - Steam app ID
 * @param name - Game name
 * @param metadata - JSON metadata (genres, tags, description, review_score, etc.)
 * @param embedding - Float array representing the game's embedding (e.g., 384 or 768 dimensions)
 */
export async function insertGameWithEmbedding(
  appId: bigint,
  name: string,
  metadata: Record<string, any>,
  embedding: number[]
): Promise<void> {
  // Convert embedding array to pgvector format string: '[0.1, 0.2, ...]'
  const embeddingString = `[${embedding.join(',')}]`;

  await prisma.$executeRaw`
    INSERT INTO games (app_id, name, metadata, embedding, created_at, updated_at)
    VALUES (
      ${appId}::bigint,
      ${name},
      ${JSON.stringify(metadata)}::jsonb,
      ${Prisma.raw(embeddingString)}::vector,
      NOW(),
      NOW()
    )
    ON CONFLICT (app_id) 
    DO UPDATE SET
      name = EXCLUDED.name,
      metadata = EXCLUDED.metadata,
      embedding = EXCLUDED.embedding,
      updated_at = NOW()
  `;
}

/**
 * Batch insert multiple games with embeddings
 */
export async function batchInsertGamesWithEmbeddings(
  games: Array<{
    appId: bigint;
    name: string;
    metadata: Record<string, any>;
    embedding: number[];
  }>
): Promise<void> {
  // Use a transaction for batch insert
  await prisma.$transaction(
    games.map((game) =>
      prisma.$executeRaw`
        INSERT INTO games (app_id, name, metadata, embedding, created_at, updated_at)
        VALUES (
          ${game.appId}::bigint,
          ${game.name},
          ${JSON.stringify(game.metadata)}::jsonb,
          ${Prisma.raw(`[${game.embedding.join(',')}]`)}::vector,
          NOW(),
          NOW()
        )
        ON CONFLICT (app_id) 
        DO UPDATE SET
          name = EXCLUDED.name,
          metadata = EXCLUDED.metadata,
          embedding = EXCLUDED.embedding,
          updated_at = NOW()
      `
    )
  );
}

/**
 * Find top N similar games using cosine distance
 * 
 * @param queryEmbedding - The embedding vector to search for similar games
 * @param topN - Number of results to return
 * @param excludeAppIds - Array of app IDs to exclude from results (e.g., the query game itself)
 * @returns Array of games with similarity scores
 */
export async function findSimilarGames(
  queryEmbedding: number[],
  topN: number = 10,
  excludeAppIds: bigint[] = []
): Promise<
  Array<{
    app_id: bigint;
    name: string;
    metadata: any;
    similarity: number;
  }>
> {
  const embeddingString = `[${queryEmbedding.join(',')}]`;
  
  // Note: pgvector's <=> operator returns distance (0 = identical, 2 = opposite)
  // We convert to similarity: 1 - (distance / 2) for a 0-1 scale
  const results = await prisma.$queryRaw<
    Array<{
      app_id: bigint;
      name: string;
      metadata: any;
      distance: number;
    }>
  >`
    SELECT 
      app_id,
      name,
      metadata,
      (embedding <=> ${Prisma.raw(embeddingString)}::vector) as distance
    FROM games
    WHERE embedding IS NOT NULL
      ${excludeAppIds.length > 0 ? Prisma.sql`AND app_id != ALL(${excludeAppIds}::bigint[])` : Prisma.empty}
    ORDER BY embedding <=> ${Prisma.raw(embeddingString)}::vector
    LIMIT ${topN}
  `;

  // Convert distance to similarity score (0-1, where 1 is most similar)
  return results.map((game) => ({
    app_id: game.app_id,
    name: game.name,
    metadata: game.metadata,
    similarity: 1 - game.distance / 2,
  }));
}

/**
 * Get a game by app_id with its embedding
 */
export async function getGameWithEmbedding(appId: bigint): Promise<{
  app_id: bigint;
  name: string;
  metadata: any;
  embedding: number[] | null;
} | null> {
  const result = await prisma.$queryRaw<
    Array<{
      app_id: bigint;
      name: string;
      metadata: any;
      embedding: string | null;
    }>
  >`
    SELECT app_id, name, metadata, embedding::text as embedding
    FROM games
    WHERE app_id = ${appId}::bigint
    LIMIT 1
  `;

  if (result.length === 0) return null;

  const game = result[0];
  
  // Parse embedding from pgvector string format '[0.1,0.2,...]' to number[]
  let embeddingArray: number[] | null = null;
  if (game.embedding) {
    embeddingArray = game.embedding
      .replace(/[\[\]]/g, '')
      .split(',')
      .map(Number);
  }

  return {
    app_id: game.app_id,
    name: game.name,
    metadata: game.metadata,
    embedding: embeddingArray,
  };
}

/**
 * Update only the embedding for an existing game
 */
export async function updateGameEmbedding(
  appId: bigint,
  embedding: number[]
): Promise<void> {
  const embeddingString = `[${embedding.join(',')}]`;

  await prisma.$executeRaw`
    UPDATE games
    SET embedding = ${Prisma.raw(embeddingString)}::vector,
        updated_at = NOW()
    WHERE app_id = ${appId}::bigint
  `;
}

/**
 * Get total count of games with embeddings
 */
export async function getGamesWithEmbeddingsCount(): Promise<number> {
  const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count
    FROM games
    WHERE embedding IS NOT NULL
  `;
  
  return Number(result[0].count);
}
