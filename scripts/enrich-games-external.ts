/**
 * Enrich Games with External API Data
 *
 * Adds data from:
 * - IGDB: themes, perspectives, game modes, similar games
 * - HowLongToBeat: completion times
 * - ProtonDB: Steam Deck/Linux compatibility
 *
 * Usage:
 *   npx tsx scripts/enrich-games-external.ts                    # All games
 *   npx tsx scripts/enrich-games-external.ts --limit=100        # First 100
 *   npx tsx scripts/enrich-games-external.ts --min-reviews=1000 # Popular games only
 *   npx tsx scripts/enrich-games-external.ts --source=igdb      # Only IGDB
 *   npx tsx scripts/enrich-games-external.ts --source=hltb      # Only HLTB
 *   npx tsx scripts/enrich-games-external.ts --source=protondb  # Only ProtonDB
 *   npx tsx scripts/enrich-games-external.ts --dry-run          # Preview only
 *
 * Required env vars for IGDB:
 *   TWITCH_CLIENT_ID
 *   TWITCH_CLIENT_SECRET
 */

import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { batchFetchIGDBBySteamIds, extractIGDBEnrichedData } from '../lib/igdb-api';
import { searchHLTB, extractHLTBEnrichedData } from '../lib/hltb-api';
import { fetchProtonDB, extractProtonDBEnrichedData } from '../lib/protondb-api';

interface Options {
  limit?: number;
  minReviews?: number;
  source?: 'igdb' | 'hltb' | 'protondb' | 'all';
  dryRun: boolean;
}

interface GameToEnrich {
  appId: bigint;
  name: string;
  metadata: any;
}

function parseArgs(): Options {
  const args = process.argv.slice(2);
  const options: Options = {
    source: 'all',
    dryRun: false,
  };

  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--min-reviews=')) {
      options.minReviews = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--source=')) {
      options.source = arg.split('=')[1] as any;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  }

  return options;
}

async function fetchGamesToEnrich(options: Options): Promise<GameToEnrich[]> {
  const games = await prisma.game.findMany({
    where: options.minReviews ? { reviewCount: { gte: options.minReviews } } : undefined,
    orderBy: { reviewCount: 'desc' },
    select: {
      appId: true,
      name: true,
      metadata: true,
    },
    take: options.limit,
  });

  return games.map(g => ({
    appId: g.appId,
    name: g.name,
    metadata: g.metadata || {},
  }));
}

async function enrichWithIGDB(games: GameToEnrich[], dryRun: boolean): Promise<number> {
  console.log('\n📚 Enriching with IGDB...');

  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
    console.log('⚠️  TWITCH_CLIENT_ID/SECRET not set, skipping IGDB');
    return 0;
  }

  // Filter games that don't have IGDB data yet
  const gamesNeedingIGDB = games.filter(g => !g.metadata.igdb_themes);
  const skipped = games.length - gamesNeedingIGDB.length;

  if (skipped > 0) {
    console.log(`   ⏭️  Skipping ${skipped} games (already have IGDB data)`);
  }
  console.log(`   ${gamesNeedingIGDB.length} games need IGDB data`);

  if (gamesNeedingIGDB.length === 0) {
    console.log('   ✓ All games already enriched with IGDB data');
    return 0;
  }

  // Batch fetch in chunks of 100 (IGDB limit)
  let enriched = 0;
  const batchSize = 100;

  for (let i = 0; i < gamesNeedingIGDB.length; i += batchSize) {
    const batch = gamesNeedingIGDB.slice(i, i + batchSize);
    const appIds = batch.map(g => Number(g.appId));

    console.log(`   Fetching IGDB batch ${Math.floor(i / batchSize) + 1}...`);

    const igdbData = await batchFetchIGDBBySteamIds(appIds);

    for (const game of batch) {
      const igdbGame = igdbData.get(Number(game.appId));
      if (!igdbGame) continue;

      const enrichedData = extractIGDBEnrichedData(igdbGame);

      if (enrichedData.themes.length === 0 && enrichedData.perspectives.length === 0) {
        continue;
      }

      if (dryRun) {
        console.log(`   [DRY] ${game.name}: ${enrichedData.themes.join(', ')} | ${enrichedData.perspectives.join(', ')}`);
      } else {
        await prisma.game.update({
          where: { appId: game.appId },
          data: {
            metadata: {
              ...game.metadata,
              igdb_themes: enrichedData.themes,
              igdb_perspectives: enrichedData.perspectives,
              igdb_game_modes: enrichedData.gameModes,
              igdb_similar_games: enrichedData.similarGameNames,
              igdb_keywords: enrichedData.keywords,
              igdb_rating: enrichedData.igdbRating,
            },
            updatedAt: new Date(),
          },
        });
      }

      enriched++;
    }

    // Rate limit between batches
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(`   ✓ Enriched ${enriched} games with IGDB data`);
  return enriched;
}

async function enrichWithHLTB(games: GameToEnrich[], dryRun: boolean): Promise<number> {
  console.log('\n⏱️  Enriching with HowLongToBeat...');

  // Filter games that don't have HLTB data yet
  const gamesNeedingHLTB = games.filter(g => !g.metadata.hltb_main_hours);
  const skipped = games.length - gamesNeedingHLTB.length;

  if (skipped > 0) {
    console.log(`   ⏭️  Skipping ${skipped} games (already have HLTB data)`);
  }
  console.log(`   ${gamesNeedingHLTB.length} games need HLTB data`);

  if (gamesNeedingHLTB.length === 0) {
    console.log('   ✓ All games already enriched with HLTB data');
    return 0;
  }

  let enriched = 0;

  for (let i = 0; i < gamesNeedingHLTB.length; i++) {
    const game = gamesNeedingHLTB[i];

    if (i > 0 && i % 50 === 0) {
      console.log(`   Progress: ${i}/${gamesNeedingHLTB.length}`);
    }

    const hltbGame = await searchHLTB(game.name);
    if (!hltbGame) continue;

    const enrichedData = extractHLTBEnrichedData(hltbGame);

    if (!enrichedData.mainStoryHours && !enrichedData.averageHours) {
      continue;
    }

    if (dryRun) {
      console.log(`   [DRY] ${game.name}: Main ${enrichedData.mainStoryHours}h, 100% ${enrichedData.completionistHours}h`);
    } else {
      await prisma.game.update({
        where: { appId: game.appId },
        data: {
          metadata: {
            ...game.metadata,
            hltb_main_hours: enrichedData.mainStoryHours,
            hltb_plus_hours: enrichedData.mainPlusExtrasHours,
            hltb_complete_hours: enrichedData.completionistHours,
            hltb_average_hours: enrichedData.averageHours,
          },
          updatedAt: new Date(),
        },
      });
    }

    enriched++;
  }

  console.log(`   ✓ Enriched ${enriched} games with HLTB data`);
  return enriched;
}

async function enrichWithProtonDB(games: GameToEnrich[], dryRun: boolean): Promise<number> {
  console.log('\n🐧 Enriching with ProtonDB...');

  // Filter games that don't have ProtonDB data yet
  const gamesNeedingProton = games.filter(g => !g.metadata.proton_tier);
  const skipped = games.length - gamesNeedingProton.length;

  if (skipped > 0) {
    console.log(`   ⏭️  Skipping ${skipped} games (already have ProtonDB data)`);
  }
  console.log(`   ${gamesNeedingProton.length} games need ProtonDB data`);

  if (gamesNeedingProton.length === 0) {
    console.log('   ✓ All games already enriched with ProtonDB data');
    return 0;
  }

  let enriched = 0;

  for (let i = 0; i < gamesNeedingProton.length; i++) {
    const game = gamesNeedingProton[i];

    if (i > 0 && i % 100 === 0) {
      console.log(`   Progress: ${i}/${gamesNeedingProton.length}`);
    }

    const protonData = await fetchProtonDB(Number(game.appId));
    if (!protonData) continue;

    const enrichedData = extractProtonDBEnrichedData(protonData);

    if (!enrichedData.protonTier) {
      continue;
    }

    if (dryRun) {
      console.log(`   [DRY] ${game.name}: ${enrichedData.protonTier} (Deck: ${enrichedData.steamDeckCompatible ? '✓' : '✗'})`);
    } else {
      await prisma.game.update({
        where: { appId: game.appId },
        data: {
          metadata: {
            ...game.metadata,
            proton_tier: enrichedData.protonTier,
            proton_score: enrichedData.protonScore,
            steam_deck_compatible: enrichedData.steamDeckCompatible,
          },
          updatedAt: new Date(),
        },
      });
    }

    enriched++;
  }

  console.log(`   ✓ Enriched ${enriched} games with ProtonDB data`);
  return enriched;
}

async function main() {
  console.log('='.repeat(60));
  console.log('ENRICH GAMES WITH EXTERNAL API DATA');
  console.log('='.repeat(60));

  const options = parseArgs();

  console.log(`\nMode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Source: ${options.source}`);
  if (options.limit) console.log(`Limit: ${options.limit}`);
  if (options.minReviews) console.log(`Min reviews: ${options.minReviews}`);

  console.log('\nFetching games...');
  const games = await fetchGamesToEnrich(options);
  console.log(`Found ${games.length} games to process`);

  const stats = {
    igdb: 0,
    hltb: 0,
    protondb: 0,
  };

  try {
    if (options.source === 'all' || options.source === 'igdb') {
      stats.igdb = await enrichWithIGDB(games, options.dryRun);
    }

    if (options.source === 'all' || options.source === 'hltb') {
      stats.hltb = await enrichWithHLTB(games, options.dryRun);
    }

    if (options.source === 'all' || options.source === 'protondb') {
      stats.protondb = await enrichWithProtonDB(games, options.dryRun);
    }

    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Games processed: ${games.length}`);
    console.log(`IGDB enriched: ${stats.igdb}`);
    console.log(`HLTB enriched: ${stats.hltb}`);
    console.log(`ProtonDB enriched: ${stats.protondb}`);

    if (options.dryRun) {
      console.log('\nThis was a dry run. Remove --dry-run to apply changes.');
    } else {
      console.log('\n✅ Enrichment complete!');
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
