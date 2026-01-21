import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateGameEmbedding } from '@/lib/embeddings';
import { Prisma } from '@prisma/client';

// Request body types
interface GameIngestRequest {
  appId: number;
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface BatchIngestRequest {
  games: GameIngestRequest[];
}

/**
 * Ingest a single game with embedding generation.
 */
async function ingestGame(game: GameIngestRequest) {
  const { appId, name, description, metadata } = game;

  // Extract genres from metadata if available
  const genres = metadata?.genres as string[] | undefined;

  // Generate embedding
  const embedding = await generateGameEmbedding({
    name,
    description,
    genres,
  });

  // Convert embedding array to pgvector format string
  const vectorString = `[${embedding.join(',')}]`;

  // Use raw SQL to insert/update with vector type
  // Prisma doesn't support Unsupported types in queries, so we use $executeRaw
  await prisma.$executeRaw`
    INSERT INTO games (app_id, name, metadata, embedding, created_at, updated_at)
    VALUES (
      ${BigInt(appId)},
      ${name},
      ${metadata ? JSON.stringify(metadata) : null}::jsonb,
      ${Prisma.raw(`'${vectorString}'::vector(384)`)},
      NOW(),
      NOW()
    )
    ON CONFLICT (app_id) DO UPDATE SET
      name = EXCLUDED.name,
      metadata = EXCLUDED.metadata,
      embedding = EXCLUDED.embedding,
      updated_at = NOW()
  `;

  return { appId, name };
}

/**
 * POST /api/games/ingest
 * 
 * Accepts either:
 * - Single game: { appId, name, description?, metadata? }
 * - Batch: { games: [{ appId, name, description?, metadata? }, ...] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a batch request
    if ('games' in body && Array.isArray(body.games)) {
      return handleBatchIngest(body as BatchIngestRequest);
    }

    // Single game ingest
    return handleSingleIngest(body as GameIngestRequest);
  } catch (error) {
    console.error('Ingest error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Handle single game ingestion.
 */
async function handleSingleIngest(game: GameIngestRequest) {
  // Validate required fields
  if (!game.appId || !game.name) {
    return NextResponse.json(
      { error: 'appId and name are required' },
      { status: 400 }
    );
  }

  try {
    const result = await ingestGame(game);
    
    return NextResponse.json({
      success: true,
      game: result,
    });
  } catch (error) {
    console.error(`Failed to ingest game ${game.appId}:`, error);
    throw error;
  }
}

/**
 * Handle batch game ingestion.
 * Processes games in chunks to avoid timeouts and memory issues.
 */
async function handleBatchIngest(request: BatchIngestRequest) {
  const { games } = request;

  if (!games || games.length === 0) {
    return NextResponse.json(
      { error: 'games array is required and must not be empty' },
      { status: 400 }
    );
  }

  // Validate all games have required fields
  for (const game of games) {
    if (!game.appId || !game.name) {
      return NextResponse.json(
        { error: `All games must have appId and name. Invalid game: ${JSON.stringify(game)}` },
        { status: 400 }
      );
    }
  }

  const BATCH_SIZE = 50;
  const results: { appId: number; name: string }[] = [];
  const errors: { appId: number; error: string }[] = [];

  // Process in chunks
  for (let i = 0; i < games.length; i += BATCH_SIZE) {
    const chunk = games.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(games.length / BATCH_SIZE)} (${chunk.length} games)`);

    // Process chunk sequentially to avoid memory issues with transformer model
    for (const game of chunk) {
      try {
        const result = await ingestGame(game);
        results.push(result);
      } catch (error) {
        console.error(`Failed to ingest game ${game.appId}:`, error);
        errors.push({
          appId: game.appId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return NextResponse.json({
    success: true,
    processed: results.length,
    failed: errors.length,
    total: games.length,
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}
