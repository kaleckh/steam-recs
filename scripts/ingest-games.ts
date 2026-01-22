/**
 * Advanced Steam game ingestion script
 * 
 * Usage:
 *   # Ingest 100 random games (default)
 *   tsx scripts/ingest-games.ts
 * 
 *   # Ingest specific number of games
 *   tsx scripts/ingest-games.ts --limit=200
 * 
 *   # Chunk large ingests (for resuming)
 *   tsx scripts/ingest-games.ts --limit=50 --start-index=100
 * 
 *   # Random sampling for diverse dataset
 *   tsx scripts/ingest-games.ts --limit=500 --random
 * 
 *   # Specific app IDs (legacy mode)
 *   tsx scripts/ingest-games.ts 730 570 440
 */

import * as fs from 'fs';
import * as path from 'path';
import { batchIngestGamesViaAPI } from '../lib/steam-ingest';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const APP_LIST_CACHE = path.join(CACHE_DIR, 'steam-app-list.json');
const DEFAULT_LIMIT = 100;
const DEFAULT_START_INDEX = 0;

interface SteamApp {
  appid: number;
  name: string;
}

interface SteamAppListResponse {
  applist: {
    apps: SteamApp[];
  };
}

interface IngestOptions {
  limit: number;
  startIndex: number;
  random: boolean;
  specificAppIds?: number[];
}

/**
 * Parse CLI arguments
 */
function parseArgs(): IngestOptions {
  const args = process.argv.slice(2);
  const options: IngestOptions = {
    limit: DEFAULT_LIMIT,
    startIndex: DEFAULT_START_INDEX,
    random: false,
  };

  // Check for numeric app IDs (legacy mode)
  const numericArgs = args.filter(arg => /^\d+$/.test(arg)).map(Number);
  if (numericArgs.length > 0) {
    options.specificAppIds = numericArgs;
    return options;
  }

  // Parse named arguments
  for (const arg of args) {
    if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10) || DEFAULT_LIMIT;
    } else if (arg.startsWith('--start-index=')) {
      options.startIndex = parseInt(arg.split('=')[1], 10) || DEFAULT_START_INDEX;
    } else if (arg === '--random') {
      options.random = true;
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
Steam Game Ingest Script

Usage:
  tsx scripts/ingest-games.ts [OPTIONS]

Options:
  --limit=N          Number of games to ingest (default: ${DEFAULT_LIMIT})
  --start-index=N    Starting index in app list (default: ${DEFAULT_START_INDEX})
  --random           Randomly shuffle games for diverse sampling
  --help, -h         Show this help message

Legacy mode (specific app IDs):
  tsx scripts/ingest-games.ts 730 570 440

Examples:
  tsx scripts/ingest-games.ts --limit=200 --random
  tsx scripts/ingest-games.ts --limit=50 --start-index=100
  tsx scripts/ingest-games.ts 730 570 440 1172470
`);
}

/**
 * Fetch full Steam app list from API and cache it locally
 */
async function fetchSteamAppList(): Promise<SteamApp[]> {
  console.log('Fetching Steam app list from API...');
  
  const apiKey = process.env.STEAM_API_KEY;
  const url = apiKey
    ? `https://api.steampowered.com/ISteamApps/GetAppList/v2/?key=${apiKey}`
    : 'https://api.steampowered.com/ISteamApps/GetAppList/v2/';

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Steam API returned ${response.status}`);
    }

    const data: SteamAppListResponse = await response.json();
    const apps = data.applist.apps;

    console.log(`Fetched ${apps.length.toLocaleString()} apps from Steam API`);
    
    // Cache for future use
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
    fs.writeFileSync(APP_LIST_CACHE, JSON.stringify(apps, null, 2));
    console.log(`Cached app list to ${APP_LIST_CACHE}`);

    return apps;
  } catch (error) {
    console.error('Failed to fetch Steam app list:', error);
    throw error;
  }
}

/**
 * Load Steam app list from cache or fetch if not cached
 */
async function loadSteamAppList(): Promise<SteamApp[]> {
  if (fs.existsSync(APP_LIST_CACHE)) {
    console.log('Loading app list from cache...');
    const cached = JSON.parse(fs.readFileSync(APP_LIST_CACHE, 'utf-8'));
    console.log(`Loaded ${cached.length.toLocaleString()} apps from cache`);
    return cached;
  }

  return fetchSteamAppList();
}

/**
 * Filter app list to prioritize actual games
 * Heuristics: exclude obvious non-games by name patterns
 */
function filterLikelyGames(apps: SteamApp[]): SteamApp[] {
  const excludePatterns = [
    /soundtrack/i,
    /ost$/i,
    /demo$/i,
    /beta$/i,
    /test/i,
    /trailer/i,
    /dlc$/i,
    /- dlc/i,
    /dedicated server/i,
    /server$/i,
    /sdk$/i,
    /editor$/i,
    /benchmark/i,
  ];

  return apps.filter(app => {
    // Exclude apps with suspicious names
    if (excludePatterns.some(pattern => pattern.test(app.name))) {
      return false;
    }
    
    // Exclude very short/empty names
    if (!app.name || app.name.trim().length < 2) {
      return false;
    }

    return true;
  });
}

/**
 * Shuffle array using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Select apps to ingest based on options
 */
async function selectAppsToIngest(options: IngestOptions): Promise<number[]> {
  // Legacy mode: specific app IDs
  if (options.specificAppIds && options.specificAppIds.length > 0) {
    console.log('\nUsing specific app IDs (legacy mode)');
    return options.specificAppIds;
  }

  // Load full app list
  const allApps = await loadSteamAppList();
  
  // Filter to likely games
  console.log('\nFiltering to likely games...');
  const likelyGames = filterLikelyGames(allApps);
  console.log(`Filtered to ${likelyGames.length.toLocaleString()} likely games`);

  // Shuffle if random sampling requested
  let apps = likelyGames;
  if (options.random) {
    console.log('Shuffling for random sampling...');
    apps = shuffleArray(apps);
  }

  // Apply start index and limit
  const selected = apps.slice(options.startIndex, options.startIndex + options.limit);
  
  console.log(`\nSelected ${selected.length} games`);
  if (options.startIndex > 0) {
    console.log(`  Starting from index: ${options.startIndex}`);
  }
  if (options.random) {
    console.log('  Sampling: Random');
  }

  return selected.map(app => app.appid);
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Steam Game Ingest Script');
  console.log('='.repeat(60));

  const options = parseArgs();
  const startTime = Date.now();

  try {
    // Select apps to ingest
    const appIds = await selectAppsToIngest(options);

    if (appIds.length === 0) {
      console.error('\nNo apps selected for ingestion');
      process.exit(1);
    }

    console.log('\nStarting batch ingest...');
    console.log(`Total apps: ${appIds.length}`);
    if (appIds.length <= 20) {
      console.log('App IDs:', appIds.join(', '));
    }
    console.log('');

    // Run batch ingest
    const result = await batchIngestGamesViaAPI(appIds, {
      baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      batchSize: 50,
      delayBetweenSteamRequests: 1500, // 1.5s to avoid rate limiting
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const durationMins = (parseFloat(duration) / 60).toFixed(1);

    console.log('');
    console.log('='.repeat(60));
    console.log('Ingest Complete');
    console.log('='.repeat(60));
    console.log(`Total attempted:  ${appIds.length} games`);
    console.log(`Successfully ingested: ${result.processed} games`);
    console.log(`Failed:           ${result.failed} games`);
    console.log(`Success rate:     ${((result.processed / appIds.length) * 100).toFixed(1)}%`);
    console.log(`Duration:         ${duration}s (${durationMins} min)`);

    if (result.errors.length > 0) {
      console.log('');
      console.log(`Errors (showing first 20 of ${result.errors.length}):`);
      result.errors.slice(0, 20).forEach((error) => {
        console.log(`  - App ${error.appId}: ${error.error}`);
      });
      
      if (result.errors.length > 20) {
        console.log(`  ... and ${result.errors.length - 20} more errors`);
      }
    }

    console.log('');

    // Exit with appropriate code
    // Don't fail if some games couldn't be ingested (common for Steam API)
    // Only fail if < 50% success rate
    const successRate = result.processed / appIds.length;
    if (successRate < 0.5) {
      console.error('Less than 50% success rate - check errors above');
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('\nFatal error during ingest:', error);
    process.exit(1);
  }
}

main();
