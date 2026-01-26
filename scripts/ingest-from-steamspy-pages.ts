/**
 * Ingest Games from SteamSpy Paginated API
 *
 * Uses SteamSpy's paginated API to get ALL valid game AppIDs efficiently.
 * Much faster than scanning 1-3 million AppIDs!
 *
 * SteamSpy API Details:
 * - Request: https://steamspy.com/api.php?request=all&page=N
 * - Returns 1000 games per page
 * - Rate limit: 1 request per 60 seconds for 'all' requests
 * - Estimated total: ~150,000 games across ~150 pages
 *
 * Usage:
 *   # Ingest first 10 pages (10,000 games) - takes ~10 minutes
 *   tsx scripts/ingest-from-steamspy-pages.ts --pages=10
 *
 *   # Continue from page 10 (skip first 10,000 games)
 *   tsx scripts/ingest-from-steamspy-pages.ts --start-page=10 --pages=10
 *
 *   # Ingest ALL Steam games (150+ pages) - takes ~2.5 hours
 *   tsx scripts/ingest-from-steamspy-pages.ts --pages=200
 */

import { fetchSteamAppDetails, stripHtml, extractReleaseYear, fetchSteamReviewScore } from '../lib/steam-api';
import { fetchSteamSpyData, createEnrichedMetadata } from '../lib/steamspy-api';
import { generateGameEmbeddingOpenAI } from '../lib/embeddings';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

interface ScriptOptions {
  startPage: number;
  numPages: number;
  concurrency: number;
  skipExisting: boolean;
}

interface SteamSpyGameData {
  appid: number;
  name: string;
  [key: string]: any;
}

/**
 * Parse CLI arguments
 */
function parseArgs(): ScriptOptions {
  const args = process.argv.slice(2);
  const options: ScriptOptions = {
    startPage: 0,
    numPages: 10,
    concurrency: 3,
    skipExisting: true,
  };

  for (const arg of args) {
    if (arg.startsWith('--start-page=')) {
      options.startPage = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--pages=')) {
      options.numPages = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--concurrency=')) {
      options.concurrency = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--no-skip-existing') {
      options.skipExisting = false;
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
Ingest Games from SteamSpy Paginated API

Uses SteamSpy's official pagination to efficiently get all valid game AppIDs.
Much more efficient than brute-force AppID scanning!

Usage:
  tsx scripts/ingest-from-steamspy-pages.ts [OPTIONS]

Options:
  --start-page=N     Starting page number (default: 0)
  --pages=N          Number of pages to fetch (default: 10)
  --concurrency=N    Parallel workers for game ingestion (default: 3)
  --no-skip-existing Re-ingest games that already exist
  --help, -h         Show this help message

Examples:
  # First 10 pages (10,000 games)
  tsx scripts/ingest-from-steamspy-pages.ts --pages=10

  # Continue from page 10
  tsx scripts/ingest-from-steamspy-pages.ts --start-page=10 --pages=10

  # Get ALL Steam games (~150 pages)
  tsx scripts/ingest-from-steamspy-pages.ts --pages=200

Performance:
  - 1 page = 1000 AppIDs
  - Rate limit: 1 page per 60 seconds
  - 10 pages = ~10 minutes
  - 50 pages = ~50 minutes
  - 200 pages (all games) = ~3.5 hours
  - Can resume from any page if interrupted
`);
}

/**
 * Fetch one page from SteamSpy API
 */
async function fetchSteamSpyPage(pageNumber: number): Promise<SteamSpyGameData[]> {
  const url = `https://steamspy.com/api.php?request=all&page=${pageNumber}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`SteamSpy API returned ${response.status}`);
    }

    const data = await response.json();

    // Convert object to array
    const games: SteamSpyGameData[] = Object.entries(data).map(([appid, gameData]: [string, any]) => ({
      appid: parseInt(appid, 10),
      name: gameData.name || 'Unknown',
      ...gameData,
    }));

    return games;
  } catch (error) {
    console.error(`Failed to fetch page ${pageNumber}:`, error);
    return [];
  }
}

/**
 * Check if games already exist in database
 */
async function filterExistingAppIds(appIds: number[]): Promise<number[]> {
  if (appIds.length === 0) return [];

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
  return appIds.filter(id => !existingAppIds.has(id));
}

/**
 * Ingest a single game by AppID
 */
async function ingestSingleGame(appId: number): Promise<{
  success: boolean;
  appId: number;
  name?: string;
  error?: string;
  skipped?: boolean;
}> {
  try {
    // Fetch Steam data
    const steamData = await fetchSteamAppDetails(appId);

    if (!steamData) {
      return { success: false, appId, error: 'No data from Steam API', skipped: true };
    }

    // Only ingest actual games
    if (steamData.type !== 'game') {
      return { success: false, appId, error: `Not a game (type: ${steamData.type})`, skipped: true };
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

    // Generate embedding (1536-dim via OpenAI)
    const embedding = await generateGameEmbeddingOpenAI({
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
 * Process games with controlled concurrency
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

    // Stagger requests
    const chunkResults = await Promise.all(
      chunk.map((appId, index) => {
        return new Promise(resolve => {
          setTimeout(async () => {
            const result = await ingestSingleGame(appId);
            resolve(result);
          }, index * 1000);
        });
      })
    );

    results.push(...chunkResults);
    completed += chunk.length;

    chunkResults.forEach(result => {
      onProgress(completed, appIds.length, result);
    });

    // Delay between chunks
    if (i + concurrency < appIds.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(70));
  console.log('Ingest Games from SteamSpy Paginated API');
  console.log('='.repeat(70));
  console.log('');

  const options = parseArgs();
  const startTime = Date.now();

  console.log(`Starting page: ${options.startPage}`);
  console.log(`Number of pages: ${options.numPages}`);
  console.log(`Expected games: ~${options.numPages * 1000}`);
  console.log(`Concurrency: ${options.concurrency} parallel workers`);
  console.log(`Skip existing: ${options.skipExisting ? 'Yes' : 'No'}`);
  console.log('');

  console.log('⏱️  Rate limit: 1 page per 60 seconds');
  console.log(`⏱️  Estimated time: ~${options.numPages} minutes for page fetching`);
  console.log('');

  try {
    let totalAppIdsFetched = 0;
    let totalProcessed = 0;
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;
    const errors: any[] = [];

    console.log('='.repeat(70));
    console.log('Fetching and ingesting games (streaming mode)');
    console.log('='.repeat(70));
    console.log('');

    // Process each page immediately after fetching
    for (let page = options.startPage; page < options.startPage + options.numPages; page++) {
      const pageStartTime = Date.now();
      console.log(`[Page ${page}] Fetching AppIDs from SteamSpy...`);

      const games = await fetchSteamSpyPage(page);

      if (games.length === 0) {
        console.log(`[Page ${page}] ⚠️  No games returned - reached end of catalog`);
        break;
      }

      let appIds = games.map(g => g.appid);
      totalAppIdsFetched += appIds.length;

      const elapsed = ((Date.now() - pageStartTime) / 1000).toFixed(1);
      console.log(`[Page ${page}] ✓ Fetched ${appIds.length} AppIDs in ${elapsed}s`);

      // Filter existing games for this page
      if (options.skipExisting) {
        const beforeFilter = appIds.length;
        appIds = await filterExistingAppIds(appIds);
        const skipped = beforeFilter - appIds.length;
        if (skipped > 0) {
          console.log(`[Page ${page}] Skipping ${skipped} existing games`);
        }
      }

      if (appIds.length === 0) {
        console.log(`[Page ${page}] All games already exist, moving to next page`);
        console.log('');
        continue;
      }

      console.log(`[Page ${page}] Ingesting ${appIds.length} new games...`);
      console.log('');

      // Ingest this page's games
      await processGamesParallel(appIds, options.concurrency, (completed, total, result) => {
        totalProcessed++;
        const progress = `[Page ${page}] [${completed}/${total}]`;

        if (result.success) {
          successCount++;
          console.log(`${progress} ✓ ${result.name}`);
        } else if (result.skipped) {
          skipCount++;
          // Don't log skipped games
        } else {
          failCount++;
          console.log(`${progress} ✗ App ${result.appId}: ${result.error}`);
          errors.push(result);
        }
      });

      console.log(`[Page ${page}] ✓ Page complete (${successCount} total successful so far)`);
      console.log('');
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const durationMins = (parseFloat(duration) / 60).toFixed(1);
    const durationHours = (parseFloat(duration) / 3600).toFixed(2);

    console.log('');
    console.log('='.repeat(70));
    console.log('Ingest Complete');
    console.log('='.repeat(70));
    console.log(`Pages fetched:         ${options.numPages}`);
    console.log(`AppIDs fetched:        ${totalAppIdsFetched.toLocaleString()}`);
    console.log(`AppIDs processed:      ${totalProcessed.toLocaleString()}`);
    console.log(`Successfully ingested: ${successCount.toLocaleString()} games`);
    console.log(`Skipped (not games):   ${skipCount.toLocaleString()}`);
    console.log(`Failed:                ${failCount.toLocaleString()}`);
    console.log(`Success rate:          ${totalProcessed > 0 ? ((successCount / totalProcessed) * 100).toFixed(1) : '0.0'}%`);
    console.log(`Duration:              ${duration}s (${durationMins} min / ${durationHours} hrs)`);
    console.log('');

    if (errors.length > 0 && errors.length <= 20) {
      console.log(`Errors (${errors.length} total):`);
      errors.forEach(err => {
        console.log(`  - App ${err.appId}: ${err.error}`);
      });
      console.log('');
    }

    console.log('✅ Ingest complete!');
    console.log('');

    const nextPage = options.startPage + options.numPages;
    console.log(`To continue: tsx scripts/ingest-from-steamspy-pages.ts --start-page=${nextPage} --pages=${options.numPages}`);
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
