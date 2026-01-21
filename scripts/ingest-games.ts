/**
 * Example script to batch ingest games from Steam API
 * 
 * Usage:
 *   tsx scripts/ingest-games.ts
 * 
 * Or to run with specific app IDs:
 *   tsx scripts/ingest-games.ts 730 570 440
 */

import { batchIngestGamesViaAPI } from '../lib/steam-ingest';

// Example popular Steam game IDs
const POPULAR_GAME_IDS = [
  730,    // Counter-Strike 2
  570,    // Dota 2
  440,    // Team Fortress 2
  1172470, // Apex Legends
];

async function main() {
  // Use command line arguments if provided, otherwise use default list
  const appIdsFromArgs = process.argv.slice(2).map(Number).filter((n) => !isNaN(n));
  const appIds = appIdsFromArgs.length > 0 ? appIdsFromArgs : POPULAR_GAME_IDS;

  console.log(`Starting batch ingest for ${appIds.length} games...`);
  console.log('App IDs:', appIds.join(', '));
  console.log('');

  const startTime = Date.now();

  try {
    const result = await batchIngestGamesViaAPI(appIds, {
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      batchSize: 50,
      delayBetweenSteamRequests: 1500, // 1.5s between Steam requests to avoid rate limiting
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('');
    console.log('=== Ingest Complete ===');
    console.log(`Total: ${appIds.length} games`);
    console.log(`Processed: ${result.processed} games`);
    console.log(`Failed: ${result.failed} games`);
    console.log(`Duration: ${duration}s`);

    if (result.errors.length > 0) {
      console.log('');
      console.log('Errors:');
      result.errors.forEach((error) => {
        console.log(`  - App ${error.appId}: ${error.error}`);
      });
    }

    // Exit with error code if any failures
    if (result.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Fatal error during ingest:', error);
    process.exit(1);
  }
}

main();
