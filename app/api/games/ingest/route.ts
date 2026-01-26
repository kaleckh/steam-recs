import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateGameEmbeddingOpenAI } from '@/lib/embeddings';
import { Prisma } from '@prisma/client';
import {
  fetchSteamAppDetails,
  stripHtml,
  extractReleaseYear,
  fetchSteamReviewScore,
  type SteamAppDetails,
} from '@/lib/steam-api';
import {
  fetchSteamSpyData,
  createEnrichedMetadata,
} from '@/lib/steamspy-api';

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
 * Create cleaned metadata object from Steam API response.
 */
function createCleanedMetadata(steamData: SteamAppDetails): Record<string, any> {
  return {
    // Core info
    steam_appid: steamData.steam_appid,
    type: steamData.type,
    name: steamData.name,
    
    // Descriptions (cleaned)
    short_description: stripHtml(steamData.short_description),
    detailed_description: stripHtml(steamData.detailed_description),
    about_the_game: stripHtml(steamData.about_the_game),
    
    // Taxonomies
    genres: steamData.genres?.map(g => g.description) || [],
    categories: steamData.categories?.map(c => c.description) || [],
    
    // Creators
    developers: steamData.developers || [],
    publishers: steamData.publishers || [],
    
    // Release info
    release_date: steamData.release_date,
    release_year: extractReleaseYear(steamData.release_date),
    
    // Platforms
    platforms: steamData.platforms ? [
      ...(steamData.platforms.windows ? ['windows'] : []),
      ...(steamData.platforms.mac ? ['mac'] : []),
      ...(steamData.platforms.linux ? ['linux'] : []),
    ] : [],
    
    // Languages
    supported_languages: steamData.supported_languages,
    
    // Reviews & ratings
    recommendations: steamData.recommendations,
    review_count: steamData.recommendations?.total || 0,
    metacritic: steamData.metacritic,
    metacritic_score: steamData.metacritic?.score || null,
    
    // Features
    achievements: steamData.achievements,
    achievement_count: steamData.achievements?.total || 0,
    controller_support: steamData.controller_support,
    
    // Pricing
    is_free: steamData.is_free,
    price_overview: steamData.price_overview,
    
    // Content
    content_descriptors: steamData.content_descriptors,
    required_age: steamData.required_age,
    
    // Media (save ALL screenshots and movies, not limited)
    screenshots: steamData.screenshots || [],
    movies: steamData.movies || [],
    
    // Images
    header_image: steamData.header_image,
    capsule_image: steamData.capsule_image,
    background: steamData.background,
    
    // Related content
    dlc: steamData.dlc || [],
    
    // Misc
    website: steamData.website,
    legal_notice: steamData.legal_notice,
  };
}

/**
 * Ingest a single game with embedding generation.
 * Optionally fetches from Steam API if no metadata provided.
 */
async function ingestGame(game: GameIngestRequest, fetchFromSteam = true) {
  const { appId, name, description, metadata } = game;

  let cleanedMetadata: Record<string, any> | undefined = metadata;
  let steamData: SteamAppDetails | null = null;

  // Fetch from Steam API if enabled and no metadata provided
  if (fetchFromSteam && !metadata) {
    steamData = await fetchSteamAppDetails(appId);
    if (steamData) {
      cleanedMetadata = createCleanedMetadata(steamData);
    } else {
      console.warn(`Could not fetch Steam data for ${appId}, using provided data only`);
    }
  }

  // Fetch SteamSpy data for tags and accurate review scores (CRITICAL for accuracy)
  let tags: string[] = [];
  let reviewScoreFromSpy: number | null = null;
  let reviewCountFinal: number | undefined = undefined;

  if (fetchFromSteam) {
    console.log(`Fetching SteamSpy data for ${appId}...`);
    const steamSpyData = await fetchSteamSpyData(appId);

    if (steamSpyData) {
      const enriched = createEnrichedMetadata(steamSpyData);
      tags = enriched.tags; // User-generated tags (most valuable!)
      reviewScoreFromSpy = enriched.reviewScore;

      // Update metadata with SteamSpy data
      if (cleanedMetadata) {
        cleanedMetadata.tags = tags;
        cleanedMetadata.steamspy_review_score = reviewScoreFromSpy;
        cleanedMetadata.ownership_estimate = enriched.ownershipEstimate;
        cleanedMetadata.average_playtime_hours = enriched.averagePlaytime;
        cleanedMetadata.median_playtime_hours = enriched.medianPlaytime;
      }

      console.log(`  Found ${tags.length} tags for ${name}`);
    }

    // Fetch accurate review score from Steam Reviews API (fallback if SteamSpy fails)
    if (!reviewScoreFromSpy) {
      console.log(`Fetching Steam review score for ${appId}...`);
      const reviewData = await fetchSteamReviewScore(appId);

      if (reviewData) {
        reviewScoreFromSpy = reviewData.reviewPositivePct;
        reviewCountFinal = reviewData.reviewCount;

        if (cleanedMetadata) {
          cleanedMetadata.steam_review_score = reviewScoreFromSpy;
          cleanedMetadata.steam_review_count = reviewCountFinal;
        }
      }
    }
  }

  // Extract fields for embedding and database columns
  const gameMetadata = cleanedMetadata || {};
  const gameName = steamData?.name || name;
  const shortDesc = gameMetadata.short_description as string | undefined;
  const detailedDesc = gameMetadata.detailed_description as string | undefined;
  const aboutTheGame = gameMetadata.about_the_game as string | undefined;
  const genres = gameMetadata.genres as string[] | undefined;
  const categories = gameMetadata.categories as string[] | undefined;
  const developers = gameMetadata.developers as string[] | undefined;
  const publishers = gameMetadata.publishers as string[] | undefined;
  const releaseYear = gameMetadata.release_year as number | undefined;
  const reviewCount = reviewCountFinal || (gameMetadata.review_count as number | undefined);
  const reviewPositivePct = reviewScoreFromSpy || (gameMetadata.review_positive_pct as number | undefined);
  const metacriticScore = gameMetadata.metacritic_score as number | undefined;
  const isFree = gameMetadata.is_free as boolean | undefined;
  const gameType = gameMetadata.type as string | undefined;
  const contentDescriptors = gameMetadata.content_descriptors?.notes as string | undefined;

  // Generate embedding with comprehensive metadata INCLUDING TAGS (critical!)
  const embedding = await generateGameEmbeddingOpenAI({
    name: gameName,
    shortDescription: shortDesc,
    detailedDescription: detailedDesc || description,
    aboutTheGame,
    genres,
    categories,
    developers,
    publishers,
    releaseYear,
    reviewCount,
    reviewPositivePct,
    metacriticScore,
    isFree,
    contentDescriptors,
    tags, // USER-GENERATED TAGS - THE MOST VALUABLE SIGNAL
  });

  // Convert embedding array to pgvector format string
  const vectorString = `[${embedding.join(',')}]`;

  // Use raw SQL to insert/update with vector type and new fields
  await prisma.$executeRaw`
    INSERT INTO games (
      app_id,
      name,
      release_year,
      review_positive_pct,
      review_count,
      is_free,
      metacritic_score,
      type,
      metadata,
      embedding,
      created_at,
      updated_at
    )
    VALUES (
      ${BigInt(appId)},
      ${gameName},
      ${releaseYear || null},
      ${reviewPositivePct || null},
      ${reviewCount || null},
      ${isFree !== undefined ? isFree : null},
      ${metacriticScore || null},
      ${gameType || null},
      ${cleanedMetadata ? JSON.stringify(cleanedMetadata) : null}::jsonb,
      ${Prisma.raw(`'${vectorString}'::vector(1536)`)},
      NOW(),
      NOW()
    )
    ON CONFLICT (app_id) DO UPDATE SET
      name = EXCLUDED.name,
      release_year = EXCLUDED.release_year,
      review_positive_pct = EXCLUDED.review_positive_pct,
      review_count = EXCLUDED.review_count,
      is_free = EXCLUDED.is_free,
      metacritic_score = EXCLUDED.metacritic_score,
      type = EXCLUDED.type,
      metadata = EXCLUDED.metadata,
      embedding = EXCLUDED.embedding,
      updated_at = NOW()
  `;

  return { appId, name: gameName };
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
