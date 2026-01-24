/**
 * Add Top Steam Games (with OpenAI Embeddings)
 *
 * Fetches top games from SteamSpy, skips existing ones, and adds new games
 * with OpenAI text-embedding-3-small embeddings.
 *
 * Usage:
 *   npx tsx scripts/add-top-games.ts
 *   npx tsx scripts/add-top-games.ts --limit=500
 *   npx tsx scripts/add-top-games.ts --limit=2000 --concurrency=3
 */

import 'dotenv/config';
import OpenAI from 'openai';
import { fetchSteamAppDetails, stripHtml, extractReleaseYear, fetchSteamReviewScore } from '../lib/steam-api';
import { fetchSteamSpyData, createEnrichedMetadata } from '../lib/steamspy-api';
import { createEmbeddingText } from '../lib/embeddings';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface SteamSpyGame {
  appid: number;
  name: string;
  players_forever: number;
}

interface Options {
  limit: number;
  concurrency: number;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    limit: 1000,
    concurrency: 2,
  };

  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--concurrency=')) {
      options.concurrency = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
Add Top Steam Games

Usage:
  npx tsx scripts/add-top-games.ts [OPTIONS]

Options:
  --limit=N        Number of top games to check (default: 1000)
  --concurrency=N  Parallel workers (default: 2)
  --help, -h       Show this help
`);
      process.exit(0);
    }
  }

  return options;
}

/**
 * Fetch top games from SteamSpy sorted by player count
 */
async function fetchTopGames(limit: number): Promise<SteamSpyGame[]> {
  console.log('Fetching game list from SteamSpy...');

  const response = await fetch('https://steamspy.com/api.php?request=all');
  const data = await response.json();

  const games: SteamSpyGame[] = Object.values(data)
    .filter((g: any) => g.appid && g.name)
    .map((g: any) => ({
      appid: g.appid,
      name: g.name,
      players_forever: g.players_forever || 0,
    }));

  games.sort((a, b) => b.players_forever - a.players_forever);

  console.log(`Found ${games.length.toLocaleString()} total games`);
  return games.slice(0, limit);
}

/**
 * Get app IDs that already exist in database
 */
async function getExistingAppIds(appIds: number[]): Promise<Set<number>> {
  const existing = await prisma.game.findMany({
    where: {
      appId: { in: appIds.map(id => BigInt(id)) },
    },
    select: { appId: true },
  });

  return new Set(existing.map(g => Number(g.appId)));
}

/**
 * Generate OpenAI embedding with retry logic
 */
async function generateEmbedding(text: string, maxRetries = 5): Promise<number[]> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      });
      return response.data[0].embedding;
    } catch (error: any) {
      if (error?.status === 429) {
        const waitMs = Math.min(Math.pow(2, attempt) * 1000 + 500, 60000);
        console.log(`  Rate limit, waiting ${waitMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * Ingest a single game
 */
async function ingestGame(appId: number): Promise<{
  success: boolean;
  name?: string;
  error?: string;
}> {
  try {
    // Fetch Steam data
    const steamData = await fetchSteamAppDetails(appId);
    if (!steamData) {
      return { success: false, error: 'No Steam data' };
    }

    // Fetch SteamSpy data for tags
    const steamSpyData = await fetchSteamSpyData(appId);
    const enriched = createEnrichedMetadata(steamSpyData);
    const tags = enriched.tags;

    // Get review score
    let reviewScore = enriched.reviewScore;
    if (!reviewScore) {
      const reviewData = await fetchSteamReviewScore(appId);
      reviewScore = reviewData?.reviewPositivePct || null;
    }

    // Build metadata
    const metadata: any = {
      steam_appid: steamData.steam_appid,
      type: steamData.type,
      name: steamData.name,
      short_description: stripHtml(steamData.short_description),
      detailed_description: stripHtml(steamData.detailed_description),
      about_the_game: stripHtml(steamData.about_the_game),
      genres: steamData.genres?.map((g: any) => g.description) || [],
      categories: steamData.categories?.map((c: any) => c.description) || [],
      developers: steamData.developers || [],
      publishers: steamData.publishers || [],
      release_date: steamData.release_date,
      release_year: extractReleaseYear(steamData.release_date),
      review_count: steamData.recommendations?.total || 0,
      metacritic_score: steamData.metacritic?.score || null,
      is_free: steamData.is_free,
      header_image: steamData.header_image,
      tags,
      steamspy_review_score: enriched.reviewScore,
      steam_review_score: reviewScore,
      ownership_estimate: enriched.ownershipEstimate,
      average_playtime_hours: enriched.averagePlaytime,
      median_playtime_hours: enriched.medianPlaytime,
    };

    // Generate embedding text and OpenAI embedding
    const embeddingText = createEmbeddingText({
      name: steamData.name,
      shortDescription: metadata.short_description,
      detailedDescription: metadata.detailed_description,
      aboutTheGame: metadata.about_the_game,
      genres: metadata.genres,
      categories: metadata.categories,
      developers: metadata.developers,
      publishers: metadata.publishers,
      releaseYear: metadata.release_year,
      reviewCount: metadata.review_count,
      reviewPositivePct: reviewScore || undefined,
      metacriticScore: metadata.metacritic_score,
      isFree: metadata.is_free,
      tags,
    });

    const embedding = await generateEmbedding(embeddingText);
    const vectorString = `[${embedding.join(',')}]`;

    // Insert into database
    await prisma.$executeRaw`
      INSERT INTO games (
        app_id, name, release_year, review_positive_pct, review_count,
        is_free, metacritic_score, type, metadata, embedding,
        created_at, updated_at
      )
      VALUES (
        ${BigInt(appId)},
        ${steamData.name},
        ${metadata.release_year || null},
        ${reviewScore || null},
        ${metadata.review_count || null},
        ${metadata.is_free !== undefined ? metadata.is_free : null},
        ${metadata.metacritic_score || null},
        ${metadata.type || null},
        ${JSON.stringify(metadata)}::jsonb,
        ${Prisma.raw(`'${vectorString}'::vector(1536)`)},
        NOW(),
        NOW()
      )
    `;

    return { success: true, name: steamData.name };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Process games with controlled concurrency
 */
async function processGames(
  appIds: number[],
  concurrency: number
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  let processed = 0;

  for (let i = 0; i < appIds.length; i += concurrency) {
    const batch = appIds.slice(i, i + concurrency);

    // Stagger requests within batch
    const results = await Promise.all(
      batch.map((appId, idx) =>
        new Promise<{ success: boolean; name?: string; error?: string }>(resolve => {
          setTimeout(async () => {
            const result = await ingestGame(appId);
            resolve(result);
          }, idx * 500);
        })
      )
    );

    for (const result of results) {
      processed++;
      if (result.success) {
        success++;
        console.log(`[${processed}/${appIds.length}] + ${result.name}`);
      } else {
        failed++;
        console.log(`[${processed}/${appIds.length}] x ${result.error}`);
      }
    }

    // Delay between batches for rate limiting
    if (i + concurrency < appIds.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return { success, failed };
}

async function main() {
  console.log('='.repeat(60));
  console.log('Add Top Steam Games (OpenAI Embeddings)');
  console.log('='.repeat(60));
  console.log('');

  const options = parseArgs();
  const startTime = Date.now();

  try {
    // Fetch top games
    const topGames = await fetchTopGames(options.limit);
    console.log(`\nTop ${topGames.length} games by player count`);

    // Check which already exist
    const allAppIds = topGames.map(g => g.appid);
    const existingIds = await getExistingAppIds(allAppIds);
    const newAppIds = allAppIds.filter(id => !existingIds.has(id));

    console.log(`Already in DB: ${existingIds.size}`);
    console.log(`New to add: ${newAppIds.length}`);

    if (newAppIds.length === 0) {
      console.log('\nAll games already exist! Nothing to do.');
      process.exit(0);
    }

    console.log(`\nAdding ${newAppIds.length} new games...`);
    console.log('');

    const result = await processGames(newAppIds, options.concurrency);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('');
    console.log('='.repeat(60));
    console.log('Complete!');
    console.log('='.repeat(60));
    console.log(`Added: ${result.success}`);
    console.log(`Failed: ${result.failed}`);
    console.log(`Duration: ${duration}s`);
    console.log('');

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
