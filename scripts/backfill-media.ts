/**
 * Backfill missing media (screenshots, movies, header images) from Steam API
 *
 * Usage:
 *   npx tsx scripts/backfill-media.ts              # Check and fix all games missing media
 *   npx tsx scripts/backfill-media.ts --dry-run    # Just report which games are missing media
 *   npx tsx scripts/backfill-media.ts --limit=100  # Process only first 100 games
 *   npx tsx scripts/backfill-media.ts --min-reviews=1000  # Only games with 1000+ reviews
 *   npx tsx scripts/backfill-media.ts --batch=50          # Batch size (default: 20)
 *
 * Note: Steam API rate limits aggressively (~200 req/5min). Script uses 2s delays between requests.
 */

import 'dotenv/config';
import { fetchSteamAppDetails } from '../lib/steam-api';
import { prisma } from '../lib/prisma';

interface GameWithMetadata {
  appId: bigint;
  name: string;
  reviewCount: number | null;
  metadata: any;
}

interface MediaStatus {
  hasHeaderImage: boolean;
  hasScreenshots: boolean;
  hasMovies: boolean;
  screenshotCount: number;
  movieCount: number;
}

function checkMediaStatus(metadata: any): MediaStatus {
  return {
    hasHeaderImage: !!metadata?.header_image,
    hasScreenshots: Array.isArray(metadata?.screenshots) && metadata.screenshots.length > 0,
    hasMovies: Array.isArray(metadata?.movies) && metadata.movies.length > 0,
    screenshotCount: metadata?.screenshots?.length || 0,
    movieCount: metadata?.movies?.length || 0,
  };
}

async function findGamesMissingMedia(limit?: number, minReviews?: number): Promise<GameWithMetadata[]> {
  // Get all games ordered by review count (most popular first)
  const games = await prisma.game.findMany({
    where: minReviews ? { reviewCount: { gte: minReviews } } : undefined,
    orderBy: { reviewCount: 'desc' },
    select: {
      appId: true,
      name: true,
      reviewCount: true,
      metadata: true,
    },
    take: limit ? limit * 10 : undefined, // Get more than limit since we filter
  });

  // Filter to games missing media
  const gamesMissingMedia: GameWithMetadata[] = [];

  for (const game of games) {
    const status = checkMediaStatus(game.metadata);

    // Consider a game "missing media" if it doesn't have screenshots
    // (most games should have screenshots if their Steam page is set up)
    if (!status.hasScreenshots) {
      gamesMissingMedia.push(game as GameWithMetadata);
      if (limit && gamesMissingMedia.length >= limit) break;
    }
  }

  return gamesMissingMedia;
}

async function updateGameMedia(appId: bigint, metadata: any, steamData: any): Promise<boolean> {
  try {
    // Merge new media data into existing metadata
    const updatedMetadata = {
      ...metadata,
      header_image: steamData.header_image || metadata.header_image,
      screenshots: steamData.screenshots || metadata.screenshots || [],
      movies: steamData.movies || metadata.movies || [],
      background: steamData.background || metadata.background,
      background_raw: steamData.background_raw || metadata.background_raw,
      capsule_image: steamData.capsule_image || metadata.capsule_image,
      capsule_imagev5: steamData.capsule_imagev5 || metadata.capsule_imagev5,
    };

    await prisma.game.update({
      where: { appId },
      data: {
        metadata: updatedMetadata,
        updatedAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error(`  Error updating ${appId}:`, error);
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(appId: number, retries = 3): Promise<any> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const data = await fetchSteamAppDetails(appId);
      return data;
    } catch (error: any) {
      const is429 = error?.message?.includes('429') || error?.status === 429;
      if (is429 && attempt < retries - 1) {
        const backoff = Math.pow(2, attempt + 1) * 2000; // 4s, 8s, 16s
        console.log(`  Rate limited on ${appId}, waiting ${backoff / 1000}s...`);
        await sleep(backoff);
      } else if (attempt === retries - 1) {
        throw error;
      }
    }
  }
  return null;
}

async function processGame(
  game: GameWithMetadata,
  stats: { updated: number; failed: number; noData: number; rateLimited: number }
): Promise<boolean> {
  try {
    const steamData = await fetchWithRetry(Number(game.appId));

    if (!steamData) {
      stats.noData++;
      return false;
    }

    const hasMedia =
      (Array.isArray(steamData.screenshots) && steamData.screenshots.length > 0) ||
      (Array.isArray(steamData.movies) && steamData.movies.length > 0);

    if (!hasMedia) {
      stats.noData++;
      return false;
    }

    const success = await updateGameMedia(game.appId, game.metadata, steamData);
    if (success) {
      stats.updated++;
      console.log(`  ✓ ${game.appId}: ${steamData.screenshots?.length || 0} screenshots, ${steamData.movies?.length || 0} movies`);
    } else {
      stats.failed++;
    }
    return false;
  } catch (error: any) {
    if (error?.message?.includes('429') || error?.status === 429) {
      stats.rateLimited++;
      console.log(`  ⚠ Rate limited on ${game.appId}`);
      return true; // Hit rate limit
    } else {
      stats.failed++;
    }
    return false;
  }
}

async function processGameBatch(
  games: GameWithMetadata[],
  stats: { updated: number; failed: number; noData: number; rateLimited: number },
  batchNum: number,
  totalBatches: number
): Promise<boolean> {
  let hitRateLimit = false;

  // Process sequentially with delay between each request
  for (const game of games) {
    const wasRateLimited = await processGame(game, stats);
    if (wasRateLimited) {
      hitRateLimit = true;
      // Extra pause if we hit rate limit
      await sleep(5000);
    }
    // 2 second delay between each request
    await sleep(2000);
  }

  console.log(`[Batch ${batchNum}/${totalBatches}] Updated: ${stats.updated}, No data: ${stats.noData}, Failed: ${stats.failed}, Rate limited: ${stats.rateLimited}`);
  return hitRateLimit;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const minReviewsArg = args.find(a => a.startsWith('--min-reviews='));

  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;
  const minReviews = minReviewsArg ? parseInt(minReviewsArg.split('=')[1], 10) : undefined;

  console.log('='.repeat(60));
  console.log('BACKFILL MEDIA SCRIPT');
  console.log('='.repeat(60));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will update database)'}`);
  if (limit) console.log(`Limit: ${limit} games`);
  if (minReviews) console.log(`Min reviews: ${minReviews}`);
  console.log('');

  console.log('Finding games missing media...');
  const gamesMissingMedia = await findGamesMissingMedia(limit, minReviews);

  console.log(`\nFound ${gamesMissingMedia.length} games missing media\n`);

  if (gamesMissingMedia.length === 0) {
    console.log('No games need media backfill!');
    await prisma.$disconnect();
    return;
  }

  // Show summary
  console.log('Games missing media (sorted by review count):');
  console.log('-'.repeat(60));

  for (const game of gamesMissingMedia.slice(0, 20)) {
    const status = checkMediaStatus(game.metadata);
    console.log(
      `${game.appId.toString().padStart(10)} | ${(game.reviewCount || 0).toString().padStart(8)} reviews | ` +
      `Header: ${status.hasHeaderImage ? '✓' : '✗'} | ` +
      `Screenshots: ${status.screenshotCount} | ` +
      `Movies: ${status.movieCount} | ` +
      `${game.name.substring(0, 30)}`
    );
  }

  if (gamesMissingMedia.length > 20) {
    console.log(`... and ${gamesMissingMedia.length - 20} more`);
  }

  console.log('');

  if (dryRun) {
    console.log('DRY RUN - No changes made. Remove --dry-run to update games.');
    await prisma.$disconnect();
    return;
  }

  // Parse batch size from args
  const batchSizeArg = args.find(a => a.startsWith('--batch='));
  const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1], 10) : 20;

  console.log(`Fetching media from Steam API (batch size: ${batchSize}, 2s between requests)...\n`);

  const stats = { updated: 0, failed: 0, noData: 0, rateLimited: 0 };
  const totalBatches = Math.ceil(gamesMissingMedia.length / batchSize);
  let batchDelay = 5000; // Start with 5s between batches

  for (let i = 0; i < gamesMissingMedia.length; i += batchSize) {
    const batch = gamesMissingMedia.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;

    const hitRateLimit = await processGameBatch(batch, stats, batchNum, totalBatches);

    // Adaptive delay - increase if we hit rate limits
    if (hitRateLimit) {
      batchDelay = Math.min(batchDelay * 2, 30000); // Max 30s
      console.log(`  Increasing batch delay to ${batchDelay / 1000}s`);
    } else if (batchDelay > 5000) {
      batchDelay = Math.max(batchDelay - 1000, 5000); // Gradually reduce
    }

    if (i + batchSize < gamesMissingMedia.length) {
      await sleep(batchDelay);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Updated: ${stats.updated}`);
  console.log(`No data from Steam: ${stats.noData}`);
  console.log(`Failed: ${stats.failed}`);
  console.log(`Rate limited: ${stats.rateLimited}`);

  await prisma.$disconnect();
}

main().catch(console.error);
