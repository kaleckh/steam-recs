/**
 * Ingest Games by AppID Range (Brute Force)
 *
 * Scans through Steam AppIDs sequentially and ingests any valid games found.
 * This bypasses SteamSpy's 1000-game limit and can find ALL Steam games.
 *
 * Usage:
 *   # Scan AppIDs 1-10000 with 5 workers
 *   tsx scripts/ingest-by-appid-range.ts --start=1 --end=10000 --concurrency=5
 *
 *   # Continue from where you left off
 *   tsx scripts/ingest-by-appid-range.ts --start=10001 --end=50000 --concurrency=5
 *
 *   # Aggressive: scan 100k AppIDs
 *   tsx scripts/ingest-by-appid-range.ts --start=1 --end=100000 --concurrency=10
 */

import { fetchSteamAppDetails, stripHtml, extractReleaseYear, fetchSteamReviewScore } from '../lib/steam-api';
import { fetchSteamSpyData, createEnrichedMetadata } from '../lib/steamspy-api';
import { generateGameEmbedding } from '../lib/embeddings';
import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';

interface ScanOptions {
  startAppId: number;
  endAppId: number;
  concurrency: number;
  skipExisting: boolean;
}

/**
 * Parse CLI arguments
 */
function parseArgs(): ScanOptions {
  const args = process.argv.slice(2);
  const options: ScanOptions = {
    startAppId: 1,
    endAppId: 10000,
    concurrency: 5,
    skipExisting: true,
  };

  for (const arg of args) {
    if (arg.startsWith('--start=')) {
      options.startAppId = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--end=')) {
      options.endAppId = parseInt(arg.split('=')[1], 10);
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
Ingest Games by AppID Range (Brute Force Scanner)

Scans through Steam AppIDs sequentially and ingests valid games.
Bypasses SteamSpy's 1000-game limit.

Usage:
  tsx scripts/ingest-by-appid-range.ts [OPTIONS]

Options:
  --start=N          Starting AppID (default: 1)
  --end=N            Ending AppID (default: 10000)
  --concurrency=N    Parallel workers (default: 5, safe: 3-10)
  --no-skip-existing Re-ingest games that already exist
  --help, -h         Show this help message

Examples:
  tsx scripts/ingest-by-appid-range.ts --start=1 --end=10000 --concurrency=5
  tsx scripts/ingest-by-appid-range.ts --start=10001 --end=50000 --concurrency=10
  tsx scripts/ingest-by-appid-range.ts --start=1 --end=3000000 --concurrency=5

Tips:
  - Steam has ~150k valid games out of ~3 million AppIDs
  - Most AppIDs are invalid (DLC, tools, demos, etc.)
  - Expect ~5% success rate
  - Save your progress and continue in batches
  - 10k AppIDs takes ~30-60 minutes depending on concurrency

Speed Estimates:
  10,000 AppIDs:   ~30-60 min  (~500 valid games found)
  50,000 AppIDs:   ~3-5 hours  (~2,500 valid games found)
  100,000 AppIDs:  ~6-10 hours (~5,000 valid games found)
`);
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

    // Only ingest actual games (not DLC, demos, etc.)
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
 * Process AppIDs with controlled concurrency
 */
async function processAppIdsParallel(
  appIds: number[],
  concurrency: number,
  onProgress: (completed: number, total: number, result: any) => void
): Promise<any[]> {
  const results: any[] = [];
  let completed = 0;

  for (let i = 0; i < appIds.length; i += concurrency) {
    const chunk = appIds.slice(i, i + concurrency);

    // Stagger requests to avoid rate limits
    const chunkResults = await Promise.all(
      chunk.map((appId, index) => {
        return new Promise(resolve => {
          setTimeout(async () => {
            const result = await ingestSingleGame(appId);
            resolve(result);
          }, index * 1000); // 1000ms stagger (increased from 500ms)
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
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay (increased from 1s)
    }
  }

  return results;
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(70));
  console.log('Ingest Games by AppID Range (Brute Force Scanner)');
  console.log('='.repeat(70));
  console.log('');

  const options = parseArgs();
  const startTime = Date.now();

  console.log(`AppID Range: ${options.startAppId.toLocaleString()} → ${options.endAppId.toLocaleString()}`);
  console.log(`Concurrency: ${options.concurrency} parallel workers`);
  console.log(`Skip existing: ${options.skipExisting ? 'Yes' : 'No'}`);
  console.log('');

  const totalAppIds = options.endAppId - options.startAppId + 1;
  console.log(`Total AppIDs to scan: ${totalAppIds.toLocaleString()}`);
  console.log('Expected ~5% success rate (most AppIDs are invalid)');
  console.log('');

  try {
    // Generate list of AppIDs to scan
    let appIdsToScan: number[] = [];
    for (let id = options.startAppId; id <= options.endAppId; id++) {
      appIdsToScan.push(id);
    }

    // Filter out existing games if enabled
    if (options.skipExisting) {
      console.log('Checking database for existing games...');
      const originalCount = appIdsToScan.length;
      appIdsToScan = await filterExistingAppIds(appIdsToScan);
      const skippedCount = originalCount - appIdsToScan.length;
      console.log(`  Skipping ${skippedCount.toLocaleString()} existing games`);
      console.log(`  Will scan ${appIdsToScan.length.toLocaleString()} AppIDs`);
      console.log('');

      if (appIdsToScan.length === 0) {
        console.log('✅ All games in this range already exist!');
        process.exit(0);
      }
    }

    console.log('='.repeat(70));
    console.log('Starting AppID scan...');
    console.log('='.repeat(70));
    console.log('');

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;
    const errors: any[] = [];

    await processAppIdsParallel(appIdsToScan, options.concurrency, (completed, total, result) => {
      const progress = `[${completed}/${total}]`;
      const percent = ((completed / total) * 100).toFixed(1);

      if (result.success) {
        successCount++;
        console.log(`${progress} (${percent}%) ✓ ${result.name}`);
      } else if (result.skipped) {
        skipCount++;
        // Don't log skipped games (too noisy)
      } else {
        failCount++;
        console.log(`${progress} (${percent}%) ✗ App ${result.appId}: ${result.error}`);
        errors.push(result);
      }
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const durationMins = (parseFloat(duration) / 60).toFixed(1);
    const durationHours = (parseFloat(duration) / 3600).toFixed(2);
    const appIdsPerSecond = (appIdsToScan.length / parseFloat(duration)).toFixed(1);

    console.log('');
    console.log('='.repeat(70));
    console.log('Scan Complete');
    console.log('='.repeat(70));
    console.log(`AppIDs scanned:        ${appIdsToScan.length.toLocaleString()}`);
    console.log(`Successfully ingested: ${successCount.toLocaleString()} games`);
    console.log(`Skipped (not games):   ${skipCount.toLocaleString()}`);
    console.log(`Failed:                ${failCount.toLocaleString()}`);
    console.log(`Success rate:          ${((successCount / appIdsToScan.length) * 100).toFixed(1)}%`);
    console.log(`Duration:              ${duration}s (${durationMins} min / ${durationHours} hrs)`);
    console.log(`Speed:                 ${appIdsPerSecond} AppIDs/second`);
    console.log('');

    if (errors.length > 0 && errors.length <= 20) {
      console.log(`Errors (${errors.length} total):`);
      errors.forEach(err => {
        console.log(`  - App ${err.appId}: ${err.error}`);
      });
      console.log('');
    }

    console.log('✅ AppID scan complete!');
    console.log('');
    console.log(`Next range: --start=${options.endAppId + 1} --end=${options.endAppId + 10000}`);
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
