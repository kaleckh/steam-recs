/**
 * HowLongToBeat Unofficial API Client
 *
 * No official API - uses their search endpoint.
 * Be respectful with rate limits.
 *
 * Data provided:
 * - Main story completion time
 * - Main + extras time
 * - Completionist time
 * - Average playtime
 */

const HLTB_SEARCH_URL = 'https://howlongtobeat.com/api/search';
const REQUEST_DELAY_MS = 500;
let lastRequestTime = 0;

export interface HLTBGame {
  game_id: number;
  game_name: string;
  game_image: string;

  // Times in hours
  comp_main: number; // Main story
  comp_plus: number; // Main + extras
  comp_100: number; // Completionist
  comp_all: number; // All styles average

  // Additional
  review_score: number;
  profile_platform: string;
}

export interface HLTBEnrichedData {
  mainStoryHours: number | null;
  mainPlusExtrasHours: number | null;
  completionistHours: number | null;
  averageHours: number | null;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Search HowLongToBeat for a game by name
 */
export async function searchHLTB(gameName: string): Promise<HLTBGame | null> {
  try {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < REQUEST_DELAY_MS) {
      await sleep(REQUEST_DELAY_MS - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();

    // Clean game name for search
    const cleanName = gameName
      .replace(/[™®©]/g, '')
      .replace(/\s*:\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const response = await fetch(HLTB_SEARCH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; SteamRecommender/1.0)',
        'Referer': 'https://howlongtobeat.com/',
        'Origin': 'https://howlongtobeat.com',
      },
      body: JSON.stringify({
        searchType: 'games',
        searchTerms: cleanName.split(' '),
        searchPage: 1,
        size: 5,
        searchOptions: {
          games: {
            userId: 0,
            platform: '',
            sortCategory: 'popular',
            rangeCategory: 'main',
            rangeTime: { min: null, max: null },
            gameplay: { perspective: '', flow: '', genre: '' },
            rangeYear: { min: '', max: '' },
            modifier: '',
          },
          users: { sortCategory: 'postcount' },
          filter: '',
          sort: 0,
          randomizer: 0,
        },
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return null;
    }

    // Find best match by name similarity
    const results: HLTBGame[] = data.data;

    // Try exact match first
    const exactMatch = results.find(
      r => r.game_name.toLowerCase() === cleanName.toLowerCase()
    );
    if (exactMatch) return exactMatch;

    // Try starts-with match
    const startsMatch = results.find(r =>
      r.game_name.toLowerCase().startsWith(cleanName.toLowerCase().slice(0, 10))
    );
    if (startsMatch) return startsMatch;

    // Return first result if reasonably close
    const firstResult = results[0];
    const firstNameLower = firstResult.game_name.toLowerCase();
    const searchLower = cleanName.toLowerCase();

    // Check if first few words match
    const firstWords = searchLower.split(' ').slice(0, 2).join(' ');
    if (firstNameLower.includes(firstWords)) {
      return firstResult;
    }

    return null;
  } catch (error) {
    console.error(`HLTB search failed for "${gameName}":`, error);
    return null;
  }
}

/**
 * Convert HLTB seconds to hours (they sometimes return seconds, sometimes hours)
 */
function normalizeToHours(value: number): number | null {
  if (!value || value <= 0) return null;

  // If value is very large, it's probably in seconds
  if (value > 1000) {
    return Math.round(value / 3600 * 10) / 10; // Convert seconds to hours, 1 decimal
  }

  // Already in hours
  return Math.round(value * 10) / 10;
}

/**
 * Extract enriched data from HLTB result
 */
export function extractHLTBEnrichedData(game: HLTBGame | null): HLTBEnrichedData {
  if (!game) {
    return {
      mainStoryHours: null,
      mainPlusExtrasHours: null,
      completionistHours: null,
      averageHours: null,
    };
  }

  return {
    mainStoryHours: normalizeToHours(game.comp_main),
    mainPlusExtrasHours: normalizeToHours(game.comp_plus),
    completionistHours: normalizeToHours(game.comp_100),
    averageHours: normalizeToHours(game.comp_all),
  };
}

/**
 * Batch search HLTB for multiple games
 * Sequential with rate limiting
 */
export async function batchSearchHLTB(
  gameNames: Array<{ appId: number; name: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<Map<number, HLTBGame>> {
  const results = new Map<number, HLTBGame>();

  for (let i = 0; i < gameNames.length; i++) {
    const { appId, name } = gameNames[i];

    if (onProgress) {
      onProgress(i + 1, gameNames.length);
    }

    const game = await searchHLTB(name);
    if (game) {
      results.set(appId, game);
    }
  }

  return results;
}
