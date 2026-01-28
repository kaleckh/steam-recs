/**
 * Sync media data from local database to production
 *
 * This script:
 * 1. Finds games in production that are missing media (screenshots)
 * 2. Checks if those games have media in the local database
 * 3. Copies the media data from local to production
 *
 * Usage:
 *   npx tsx scripts/sync-media-to-prod.ts              # Sync all
 *   npx tsx scripts/sync-media-to-prod.ts --dry-run    # Just report
 *   npx tsx scripts/sync-media-to-prod.ts --limit=100  # Limit to 100 games
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

// Local database (from .env)
const localPrisma = new PrismaClient({
  log: ['error'],
});

// Production database
const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgres://postgres:hammkal000.@db.kirzojwgulrxazfckdgo.supabase.co:6543/postgres?pgbouncer=true&statement_cache_size=0',
    },
  },
  log: ['error'],
});

interface GameMedia {
  appId: bigint;
  name: string;
  metadata: any;
}

function hasMedia(metadata: any): boolean {
  return Array.isArray(metadata?.screenshots) && metadata.screenshots.length > 0;
}

async function findProdGamesMissingMedia(limit?: number): Promise<GameMedia[]> {
  console.log('Querying production database for games missing media...');

  const games = await prodPrisma.game.findMany({
    orderBy: { reviewCount: 'desc' },
    select: {
      appId: true,
      name: true,
      metadata: true,
    },
    take: limit ? limit * 5 : 10000, // Get more than limit since we filter
  });

  const missingMedia: GameMedia[] = [];
  for (const game of games) {
    if (!hasMedia(game.metadata)) {
      missingMedia.push(game as GameMedia);
      if (limit && missingMedia.length >= limit) break;
    }
  }

  return missingMedia;
}

async function getLocalGameMedia(appIds: bigint[]): Promise<Map<string, any>> {
  console.log(`Fetching media for ${appIds.length} games from local database...`);

  const games = await localPrisma.game.findMany({
    where: {
      appId: { in: appIds },
    },
    select: {
      appId: true,
      metadata: true,
    },
  });

  const mediaMap = new Map<string, any>();
  for (const game of games) {
    if (hasMedia(game.metadata)) {
      mediaMap.set(game.appId.toString(), game.metadata);
    }
  }

  return mediaMap;
}

async function updateProdGameMedia(appId: bigint, localMetadata: any, prodMetadata: any): Promise<boolean> {
  try {
    // Merge media fields from local into prod metadata
    const updatedMetadata = {
      ...prodMetadata,
      header_image: localMetadata.header_image || prodMetadata.header_image,
      screenshots: localMetadata.screenshots || prodMetadata.screenshots || [],
      movies: localMetadata.movies || prodMetadata.movies || [],
      background: localMetadata.background || prodMetadata.background,
      background_raw: localMetadata.background_raw || prodMetadata.background_raw,
      capsule_image: localMetadata.capsule_image || prodMetadata.capsule_image,
      capsule_imagev5: localMetadata.capsule_imagev5 || prodMetadata.capsule_imagev5,
    };

    await prodPrisma.game.update({
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

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : undefined;

  console.log('='.repeat(60));
  console.log('SYNC MEDIA FROM LOCAL TO PRODUCTION');
  console.log('='.repeat(60));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will update production)'}`);
  if (limit) console.log(`Limit: ${limit} games`);
  console.log('');

  try {
    // Step 1: Find games in production missing media
    const prodGamesMissingMedia = await findProdGamesMissingMedia(limit);
    console.log(`\nFound ${prodGamesMissingMedia.length} games in production missing media\n`);

    if (prodGamesMissingMedia.length === 0) {
      console.log('No games need media sync!');
      return;
    }

    // Step 2: Check which of these have media in local
    const appIds = prodGamesMissingMedia.map(g => g.appId);
    const localMediaMap = await getLocalGameMedia(appIds);
    console.log(`\nFound ${localMediaMap.size} games with media in local database\n`);

    // Step 3: Filter to games we can sync
    const gamesToSync = prodGamesMissingMedia.filter(g =>
      localMediaMap.has(g.appId.toString())
    );

    console.log(`${gamesToSync.length} games can be synced\n`);

    if (gamesToSync.length === 0) {
      console.log('No games to sync - local database also missing media for these games.');
      return;
    }

    // Show preview
    console.log('Games to sync (first 20):');
    console.log('-'.repeat(60));
    for (const game of gamesToSync.slice(0, 20)) {
      const localMeta = localMediaMap.get(game.appId.toString());
      console.log(
        `${game.appId.toString().padStart(10)} | ` +
        `Screenshots: ${localMeta?.screenshots?.length || 0} | ` +
        `Movies: ${localMeta?.movies?.length || 0} | ` +
        `${game.name.substring(0, 40)}`
      );
    }
    if (gamesToSync.length > 20) {
      console.log(`... and ${gamesToSync.length - 20} more`);
    }
    console.log('');

    if (dryRun) {
      console.log('DRY RUN - No changes made. Remove --dry-run to sync.');
      return;
    }

    // Step 4: Sync the media
    console.log('Syncing media to production...\n');

    let updated = 0;
    let failed = 0;
    const batchSize = 50;

    for (let i = 0; i < gamesToSync.length; i += batchSize) {
      const batch = gamesToSync.slice(i, i + batchSize);

      for (const game of batch) {
        const localMeta = localMediaMap.get(game.appId.toString());
        const success = await updateProdGameMedia(game.appId, localMeta, game.metadata);

        if (success) {
          updated++;
          if (updated % 100 === 0) {
            console.log(`  Progress: ${updated}/${gamesToSync.length} updated`);
          }
        } else {
          failed++;
        }
      }

      // Small delay between batches to avoid overwhelming the database
      if (i + batchSize < gamesToSync.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Updated: ${updated}`);
    console.log(`Failed: ${failed}`);
    console.log(`Skipped (no local media): ${prodGamesMissingMedia.length - gamesToSync.length}`);

  } finally {
    await localPrisma.$disconnect();
    await prodPrisma.$disconnect();
  }
}

main().catch(console.error);
