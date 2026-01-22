/**
 * Ingest Popular Steam Games
 *
 * Fetches the most popular/played games from Steam first.
 * Much more efficient than ingesting random games.
 *
 * Strategy:
 * 1. Get top played games from SteamSpy
 * 2. Sort by player count
 * 3. Ingest the most popular ones first
 *
 * Usage:
 *   # Top 1000 most popular games
 *   tsx scripts/ingest-popular-games.ts --limit=1000
 *
 *   # Top 5000 games
 *   tsx scripts/ingest-popular-games.ts --limit=5000
 *
 *   # All games with 10k+ players
 *   tsx scripts/ingest-popular-games.ts --min-players=10000
 */

import { batchIngestGamesViaAPI } from '../lib/steam-ingest';

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
}

/**
 * Parse CLI arguments
 */
function parseArgs(): IngestOptions {
  const args = process.argv.slice(2);
  const options: IngestOptions = {
    limit: 1000, // Default: top 1000 games
    minPlayers: 0,
  };

  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--min-players=')) {
      options.minPlayers = parseInt(arg.split('=')[1], 10);
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
Ingest Popular Steam Games

Fetches and ingests the most popular/played games from Steam.
Much more efficient than random sampling.

Usage:
  tsx scripts/ingest-popular-games.ts [OPTIONS]

Options:
  --limit=N          Number of top games to ingest (default: 1000)
  --min-players=N    Only ingest games with N+ total players
  --help, -h         Show this help message

Examples:
  tsx scripts/ingest-popular-games.ts --limit=1000
  tsx scripts/ingest-popular-games.ts --limit=5000
  tsx scripts/ingest-popular-games.ts --min-players=50000

Recommended Limits:
  1000:  Top AAA + popular indie games (good starting point)
  5000:  Comprehensive coverage of well-known games
  10000: Very extensive catalog
  50000+: Diminishing returns, many obscure/abandoned games
`);
}

/**
 * Fetch all games from SteamSpy and sort by popularity
 */
async function fetchPopularGames(options: IngestOptions): Promise<number[]> {
  console.log('Fetching game list from SteamSpy...');
  console.log('(This may take 30-60 seconds)');

  try {
    const response = await fetch('https://steamspy.com/api.php?request=all');

    if (!response.ok) {
      throw new Error(`SteamSpy API error: ${response.status}`);
    }

    const data: SteamSpyAllGamesResponse = await response.json();

    console.log(`Fetched ${Object.keys(data).length.toLocaleString()} games from SteamSpy`);

    // Convert to array and filter
    const games = Object.values(data)
      .filter(game => {
        // Filter out games with insufficient data
        if (!game.appid || !game.name) return false;

        // Filter by minimum players
        if (options.minPlayers > 0 && game.players_forever < options.minPlayers) {
          return false;
        }

        return true;
      });

    console.log(`After filtering: ${games.length.toLocaleString()} games`);

    // Sort by total players (descending)
    games.sort((a, b) => b.players_forever - a.players_forever);

    // Take top N
    const topGames = games.slice(0, options.limit);

    console.log(`\nTop ${topGames.length} games selected`);
    console.log('Sample of top 10:');
    topGames.slice(0, 10).forEach((game, i) => {
      const players = (game.players_forever || 0).toLocaleString();
      console.log(`  ${i + 1}. ${game.name} (${players} players)`);
    });

    return topGames.map(g => g.appid);
  } catch (error) {
    console.error('Failed to fetch popular games:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(70));
  console.log('Ingest Popular Steam Games');
  console.log('='.repeat(70));
  console.log('');

  const options = parseArgs();
  const startTime = Date.now();

  try {
    // Fetch popular games list
    const appIds = await fetchPopularGames(options);

    if (appIds.length === 0) {
      console.error('\nNo games selected for ingestion');
      process.exit(1);
    }

    console.log('\n' + '='.repeat(70));
    console.log('Starting game ingestion...');
    console.log('='.repeat(70));
    console.log('');

    // Run batch ingest
    const result = await batchIngestGamesViaAPI(appIds, {
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      batchSize: 50,
      delayBetweenSteamRequests: 1500,
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const durationMins = (parseFloat(duration) / 60).toFixed(1);

    console.log('');
    console.log('='.repeat(70));
    console.log('Ingest Complete');
    console.log('='.repeat(70));
    console.log(`Total attempted:       ${appIds.length} games`);
    console.log(`Successfully ingested: ${result.processed} games`);
    console.log(`Failed:                ${result.failed} games`);
    console.log(`Success rate:          ${((result.processed / appIds.length) * 100).toFixed(1)}%`);
    console.log(`Duration:              ${duration}s (${durationMins} min)`);
    console.log('');

    if (result.errors.length > 0) {
      console.log(`Errors (showing first 20 of ${result.errors.length}):`);
      result.errors.slice(0, 20).forEach((error) => {
        console.log(`  - App ${error.appId}: ${error.error}`);
      });
      console.log('');
    }

    console.log('✅ Next step: Run the tag update script to add SteamSpy tags:');
    console.log('   npx tsx scripts/update-games-with-tags-parallel.ts --concurrency=5');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\nFatal error during ingest:', error);
    process.exit(1);
  }
}

main();
