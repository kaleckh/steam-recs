import { prisma } from '../lib/prisma';

/**
 * Backfill script to fetch prices, screenshots, and movies for existing games
 *
 * Usage: npx tsx scripts/backfill-prices.ts
 */

interface SteamMediaResponse {
  [appId: string]: {
    success: boolean;
    data?: {
      price_overview?: {
        currency: string;
        initial: number;
        final: number;
        discount_percent: number;
        initial_formatted: string;
        final_formatted: string;
      };
      is_free?: boolean;
      screenshots?: Array<{
        id: number;
        path_thumbnail: string;
        path_full: string;
      }>;
      movies?: Array<{
        id: number;
        name: string;
        thumbnail: string;
        webm?: {
          480?: string;
          max?: string;
        };
        mp4?: {
          480?: string;
          max?: string;
        };
        highlight: boolean;
      }>;
    };
  };
}

async function fetchMediaData(appId: string): Promise<{
  price_overview?: any;
  screenshots?: any[];
  movies?: any[];
  pc_requirements?: any;
  mac_requirements?: any;
  linux_requirements?: any;
  background?: string;
  background_raw?: string;
  legal_notice?: string;
  supported_languages?: string;
  controller_support?: string;
} | null> {
  try {
    const response = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appId}&filters=price_overview,screenshots,movies,platforms,pc_requirements,mac_requirements,linux_requirements,background,background_raw,legal_notice,supported_languages,controller_support`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SteamRecsBot/1.0)',
        },
      }
    );

    if (!response.ok) {
      console.error(`Steam API returned ${response.status} for app ${appId}`);
      return null;
    }

    const data: SteamMediaResponse = await response.json();
    const appData = data[appId];

    if (!appData?.success || !appData.data) {
      return null;
    }

    return {
      price_overview: appData.data.price_overview || null,
      screenshots: appData.data.screenshots || [],
      movies: appData.data.movies || [],
      pc_requirements: (appData.data as any).pc_requirements || null,
      mac_requirements: (appData.data as any).mac_requirements || null,
      linux_requirements: (appData.data as any).linux_requirements || null,
      background: (appData.data as any).background || null,
      background_raw: (appData.data as any).background_raw || null,
      legal_notice: (appData.data as any).legal_notice || null,
      supported_languages: (appData.data as any).supported_languages || null,
      controller_support: (appData.data as any).controller_support || null,
    };
  } catch (error) {
    console.error(`Failed to fetch data for app ${appId}:`, error);
    return null;
  }
}

async function main() {
  console.log('🔍 Finding games without price/media data...\n');

  // Find all games - we'll filter for missing data in JavaScript
  const allGames = await prisma.game.findMany({
    select: {
      appId: true,
      name: true,
      metadata: true,
    },
    orderBy: {
      appId: 'asc',
    },
  });

  // Filter games that don't have price_overview, screenshots, or movies
  const gamesNeedingUpdate = allGames.filter((game) => {
    const metadata = game.metadata as any;
    return !metadata || !metadata.price_overview || !metadata.screenshots || !metadata.movies;
  });

  console.log(`Found ${gamesNeedingUpdate.length} games needing price/media updates\n`);

  if (gamesNeedingUpdate.length === 0) {
    console.log('✅ All games already have price and media data!');
    await prisma.$disconnect();
    return;
  }

  let processed = 0;
  let updated = 0;
  let failed = 0;
  let skipped = 0;

  const DELAY_MS = 1500; // 1.5 seconds between requests to avoid rate limiting

  for (const game of gamesNeedingUpdate) {
    const appId = game.appId.toString();
    processed++;

    console.log(`[${processed}/${gamesNeedingUpdate.length}] Processing: ${game.name} (${appId})`);

    // Fetch price and media data from Steam
    const mediaData = await fetchMediaData(appId);

    if (mediaData === null) {
      console.log(`  ⚠️  No data available\n`);
      skipped++;
    } else {
      // Update the game's metadata with new data
      try {
        const currentMetadata = (game.metadata as any) || {};
        const updatedMetadata = {
          ...currentMetadata,
          price_overview: mediaData.price_overview || currentMetadata.price_overview,
          screenshots: mediaData.screenshots || currentMetadata.screenshots || [],
          movies: mediaData.movies || currentMetadata.movies || [],
          pc_requirements: mediaData.pc_requirements || currentMetadata.pc_requirements,
          mac_requirements: mediaData.mac_requirements || currentMetadata.mac_requirements,
          linux_requirements: mediaData.linux_requirements || currentMetadata.linux_requirements,
          background: mediaData.background || currentMetadata.background,
          background_raw: mediaData.background_raw || currentMetadata.background_raw,
          legal_notice: mediaData.legal_notice || currentMetadata.legal_notice,
          supported_languages: mediaData.supported_languages || currentMetadata.supported_languages,
          controller_support: mediaData.controller_support || currentMetadata.controller_support,
        };

        await prisma.game.update({
          where: { appId: game.appId },
          data: {
            metadata: updatedMetadata,
          },
        });

        const priceStr = mediaData.price_overview?.final_formatted || 'Free';
        const screenshotCount = mediaData.screenshots?.length || 0;
        const movieCount = mediaData.movies?.length || 0;
        console.log(`  ✅ Updated - Price: ${priceStr}, Screenshots: ${screenshotCount}, Movies: ${movieCount}\n`);
        updated++;
      } catch (error) {
        console.error(`  ❌ Failed to update database:`, error);
        console.log('');
        failed++;
      }
    }

    // Rate limiting: wait between requests
    if (processed < gamesNeedingUpdate.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Backfill Complete!');
  console.log('='.repeat(60));
  console.log(`Total games processed: ${processed}`);
  console.log(`✅ Successfully updated: ${updated}`);
  console.log(`⚠️  Skipped (no data): ${skipped}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(60) + '\n');

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  prisma.$disconnect();
  process.exit(1);
});
