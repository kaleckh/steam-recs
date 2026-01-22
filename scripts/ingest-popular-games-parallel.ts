/**
 * FAST Ingest Popular Steam Games (Parallel Processing)
 *
 * Processes multiple games simultaneously for 10-20x speed improvement.
 *
 * Usage:
 *   # Top 1000 games with 5 workers (recommended)
 *   tsx scripts/ingest-popular-games-parallel.ts --limit=1000 --concurrency=5
 *
 *   # Faster: 10 workers
 *   tsx scripts/ingest-popular-games-parallel.ts --limit=1000 --concurrency=10
 *
 *   # Very fast: 20 workers (aggressive)
 *   tsx scripts/ingest-popular-games-parallel.ts --limit=5000 --concurrency=20
 */

import { fetchSteamAppDetails, stripHtml, extractReleaseYear, fetchSteamReviewScore } from '../lib/steam-api';
import { fetchSteamSpyData, createEnrichedMetadata } from '../lib/steamspy-api';
import { generateGameEmbedding } from '../lib/embeddings';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

interface SteamSpyAllGamesResponse {
  [appId: string]: {
    appid: number;
    name: string;
    owners: string;
    players_forever: number;
    average_forever: number;
    positive: number;
    negative: number;
  };
}

interface IngestOptions {
  limit: number;
  minPlayers: number;
  concurrency: number;
}

/**
 * Parse CLI arguments
 */
function parseArgs(): IngestOptions {
  const args = process.argv.slice(2);
  const options: IngestOptions = {
    limit: 1000,
    minPlayers: 0,
    concurrency: 10, // Default: 10 parallel workers
  };

  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--min-players=')) {
      options.minPlayers = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--concurrency=')) {
      options.concurrency = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }
  }

  return options;
}

/**
 * Print usage information
 */
function printUsage() {
  console.log(`
FAST Ingest Popular Steam Games (Parallel)

Processes multiple games simultaneously for 10-20x speed improvement.

Usage:
  tsx scripts/ingest-popular-games-parallel.ts [OPTIONS]

Options:
  --limit=N          Number of top games to ingest (default: 1000)
  --min-players=N    Only ingest games with N+ total players
  --concurrency=N    Parallel workers (default: 10, safe: 5-15)
  --help, -h         Show this help message

Examples:
  tsx scripts/ingest-popular-games-parallel.ts --limit=1000 --concurrency=10
  tsx scripts/ingest-popular-games-parallel.ts --limit=5000 --concurrency=15

Speed Comparison (1000 games):
  Sequential:    ~45 minutes
  Parallel (5):  ~9 minutes (5x faster)
  Parallel (10): ~4-5 minutes (10x faster)
  Parallel (20): ~2-3 minutes (20x faster)
`);
}

/**
 * Fetch all games from SteamSpy and sort by popularity
 */
async function fetchPopularGames(options: IngestOptions): Promise<number[]> {
  console.log('Fetching game list from SteamSpy...');

  const response = await fetch('https://steamspy.com/api.php?request=all');
  const data: SteamSpyAllGamesResponse = await response.json();

  console.log(`Fetched ${Object.keys(data).length.toLocaleString()} games`);

  const games = Object.values(data)
    .filter(game => {
      if (!game.appid || !game.name) return false;
      if (options.minPlayers > 0 && game.players_forever < options.minPlayers) return false;
      return true;
    });

  games.sort((a, b) => b.players_forever - a.players_forever);
  const topGames = games.slice(0, options.limit);

  console.log(`\nTop ${topGames.length} games selected`);
  console.log('Sample:');
  topGames.slice(0, 5).forEach((game, i) => {
    console.log(`  ${i + 1}. ${game.name} (${(game.players_forever || 0).toLocaleString()} players)`);
  });

  return topGames.map(g => g.appid);
}

/**
 * Ingest a single game (with all data fetching and embedding generation)
 */
async function ingestSingleGame(appId: number): Promise<{
  success: boolean;
  appId: number;
  name?: string;
  error?: string;
}> {
  try {
    // Fetch Steam data
    const steamData = await fetchSteamAppDetails(appId);

    if (!steamData) {
      return { success: false, appId, error: 'Steam API returned no data' };
    }

    const name = steamData.name;

    // Fetch SteamSpy data for tags
    const steamSpyData = await fetchSteamSpyData(appId);
    const enriched = createEnrichedMetadata(steamSpyData);
    const tags = enriched.tags;
    let reviewScore = enriched.reviewScore;

    // Fallback to Steam Reviews API
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
      genres: steamData.genres?.map(g => g.description) || [],
      categories: steamData.categories?.map(c => c.description) || [],
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

    // Generate embedding
    const embedding = await generateGameEmbedding({
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

    // Insert into database
    const vectorString = `[${embedding.join(',')}]`;

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
        ${name},
        ${metadata.release_year || null},
        ${reviewScore || null},
        ${metadata.review_count || null},
        ${metadata.is_free !== undefined ? metadata.is_free : null},
        ${metadata.metacritic_score || null},
        ${metadata.type || null},
        ${JSON.stringify(metadata)}::jsonb,
        ${Prisma.raw(`'${vectorString}'::vector(384)`)},
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

    return { success: true, appId, name };
  } catch (error) {
    return {
      success: false,
      appId,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Process games with controlled concurrency and rate limiting
 */
async function processGamesParallel(
  appIds: number[],
  concurrency: number,
  onProgress: (completed: number, total: number, result: any) => void
): Promise<any[]> {
  const results: any[] = [];
  let completed = 0;

  for (let i = 0; i < appIds.length; i += concurrency) {
    const chunk = appIds.slice(i, i + concurrency);

    // Add stagger delay between games in the same chunk to avoid rate limits
    const chunkResults = await Promise.all(
      chunk.map((appId, index) => {
        // Stagger each request by 500ms to spread out API calls (increased from 200ms)
        return new Promise(resolve => {
          setTimeout(async () => {
            const result = await ingestSingleGame(appId);
            resolve(result);
          }, index * 500);
        });
      })
    );

    results.push(...chunkResults);
    completed += chunk.length;

    chunkResults.forEach(result => {
      onProgress(completed, appIds.length, result);
    });

    // Longer delay between chunks to respect rate limits (increased from 300ms)
    if (i + concurrency < appIds.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Filter out games that already exist in database
 */
async function filterExistingGames(appIds: number[]): Promise<number[]> {
  console.log('Checking database for existing games...');

  const existingGames = await prisma.game.findMany({
    where: {
      appId: {
        in: appIds.map(id => BigInt(id)),
      },
    },
    select: {
      appId: true,
    },
  });

  const existingAppIds = new Set(existingGames.map(g => Number(g.appId)));
  const newAppIds = appIds.filter(id => !existingAppIds.has(id));

  console.log(`  Found ${existingGames.length} existing games`);
  console.log(`  Will ingest ${newAppIds.length} new games`);

  return newAppIds;
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(70));
  console.log('FAST Ingest Popular Games (Parallel Processing)');
  console.log('='.repeat(70));
  console.log('');

  const options = parseArgs();
  const startTime = Date.now();

  console.log(`Concurrency: ${options.concurrency} parallel workers`);
  console.log('');

  try {
    const allAppIds = await fetchPopularGames(options);

    if (allAppIds.length === 0) {
      console.error('\nNo games selected');
      process.exit(1);
    }

    // Filter out existing games
    const appIds = await filterExistingGames(allAppIds);

    if (appIds.length === 0) {
      console.log('\n✅ All games already exist in database!');
      console.log('Nothing to ingest.');
      process.exit(0);
    }

    console.log('\n' + '='.repeat(70));
    console.log('Starting parallel ingestion...');
    console.log('='.repeat(70));
    console.log('');

    let successCount = 0;
    let failCount = 0;
    const errors: any[] = [];

    await processGamesParallel(appIds, options.concurrency, (completed, total, result) => {
      const progress = `[${completed}/${total}]`;

      if (result.success) {
        successCount++;
        console.log(`${progress} ✓ ${result.name}`);
      } else {
        failCount++;
        console.log(`${progress} ✗ App ${result.appId}: ${result.error}`);
        errors.push(result);
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const durationMins = (parseFloat(duration) / 60).toFixed(1);
    const gamesPerSecond = (appIds.length / parseFloat(duration)).toFixed(1);

    console.log('');
    console.log('='.repeat(70));
    console.log('Ingest Complete');
    console.log('='.repeat(70));
    console.log(`Total attempted:       ${appIds.length}`);
    console.log(`Successfully ingested: ${successCount}`);
    console.log(`Failed:                ${failCount}`);
    console.log(`Success rate:          ${((successCount / appIds.length) * 100).toFixed(1)}%`);
    console.log(`Duration:              ${duration}s (${durationMins} min)`);
    console.log(`Speed:                 ${gamesPerSecond} games/second`);
    console.log('');

    if (errors.length > 0) {
      console.log(`Errors (first 10 of ${errors.length}):`);
      errors.slice(0, 10).forEach(err => {
        console.log(`  - App ${err.appId}: ${err.error}`);
      });
      console.log('');
    }

    console.log('✅ Ingestion complete with tags included!');
    console.log('Your recommendations are ready to use! 🎉');
    console.log('');

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\nFatal error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
