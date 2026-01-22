import { prisma } from '../lib/prisma';

/**
 * Backfill script to fetch prices for existing games missing price_overview data
 *
 * Usage: npx tsx scripts/backfill-prices.ts
 */

interface SteamPriceResponse {
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
    };
  };
}

async function fetchPriceData(appId: string): Promise<any | null> {
  try {
    const response = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appId}&filters=price_overview`,
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

    const data: SteamPriceResponse = await response.json();
    const appData = data[appId];

    if (!appData?.success || !appData.data) {
      return null;
    }

    return appData.data.price_overview || null;
  } catch (error) {
    console.error(`Failed to fetch price for app ${appId}:`, error);
    return null;
  }
}

async function main() {
  console.log('🔍 Finding games without price data...\n');

  // Find all games - we'll filter for missing price_overview in JavaScript
  // Prisma doesn't support checking for missing JSON keys easily
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

  // Filter games that don't have price_overview in metadata
  const gamesWithoutPrices = allGames.filter((game) => {
    const metadata = game.metadata as any;
    return !metadata || !metadata.price_overview;
  });

  console.log(`Found ${gamesWithoutPrices.length} games without price data\n`);

  if (gamesWithoutPrices.length === 0) {
    console.log('✅ All games already have price data!');
    await prisma.$disconnect();
    return;
  }

  let processed = 0;
  let updated = 0;
  let failed = 0;
  let skipped = 0;

  const DELAY_MS = 1500; // 1.5 seconds between requests to avoid rate limiting

  for (const game of gamesWithoutPrices) {
    const appId = game.appId.toString();
    processed++;

    console.log(`[${processed}/${gamesWithoutPrices.length}] Processing: ${game.name} (${appId})`);

    // Fetch price data from Steam
    const priceOverview = await fetchPriceData(appId);

    if (priceOverview === null) {
      console.log(`  ⚠️  No price data available\n`);
      skipped++;
    } else {
      // Update the game's metadata with price_overview
      try {
        const currentMetadata = (game.metadata as any) || {};
        const updatedMetadata = {
          ...currentMetadata,
          price_overview: priceOverview,
        };

        await prisma.game.update({
          where: { appId: game.appId },
          data: {
            metadata: updatedMetadata,
          },
        });

        const priceStr = priceOverview.final_formatted || 'Free';
        console.log(`  ✅ Updated with price: ${priceStr}\n`);
        updated++;
      } catch (error) {
        console.error(`  ❌ Failed to update database:`, error);
        console.log('');
        failed++;
      }
    }

    // Rate limiting: wait between requests
    if (processed < gamesWithoutPrices.length) {
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
