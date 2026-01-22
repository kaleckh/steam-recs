/**
 * SteamSpy API Client
 *
 * SteamSpy provides user-generated tags and additional metadata not available in Steam API.
 * FREE to use, no API key required.
 *
 * Documentation: https://steamspy.com/api.php
 * Rate limit: Be respectful, add delays between requests
 */

const STEAMSPY_API_BASE = 'https://steamspy.com/api.php';
const REQUEST_DELAY_MS = 1000; // 1 second between requests
let lastRequestTime = 0;

export interface SteamSpyAppData {
  appid: number;
  name: string;

  // User-generated tags (MOST VALUABLE DATA)
  tags: Record<string, number>; // { "Souls-like": 4821, "Difficult": 3201 }

  // Ownership estimates
  owners: string; // e.g., "2,000,000 .. 5,000,000"
  owners_variance: number;

  // Player statistics
  players_forever: number; // Total unique players
  players_2weeks: number; // Active players last 2 weeks
  average_forever: number; // Average playtime (minutes)
  average_2weeks: number; // Average playtime last 2 weeks
  median_forever: number; // Median playtime (minutes)
  median_2weeks: number;

  // Review data
  positive: number; // Positive reviews count
  negative: number; // Negative reviews count

  // Release info
  initialprice: number; // Price in cents (USD)
  price: number; // Current price in cents
  discount: number; // Discount percentage

  // Metadata
  developer: string;
  publisher: string;
  genre: string; // Comma-separated
  ccu: number; // Current concurrent users (updated hourly)
  languages: string; // Comma-separated

  // Score (calculated by SteamSpy)
  score_rank: string; // Percentile ranking
  userscore: number; // 0-100 user score
}

/**
 * Sleep utility for rate limiting.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch game data from SteamSpy API.
 *
 * @param appId - Steam application ID
 * @returns SteamSpy data or null if not found/error
 */
export async function fetchSteamSpyData(
  appId: number
): Promise<SteamSpyAppData | null> {
  try {
    // Rate limiting: ensure minimum delay between requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < REQUEST_DELAY_MS) {
      await sleep(REQUEST_DELAY_MS - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();

    const url = `${STEAMSPY_API_BASE}?request=appdetails&appid=${appId}`;

    console.log(`Fetching SteamSpy data for appId: ${appId}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SteamRecommender/1.0)',
      },
    });

    if (!response.ok) {
      console.error(`SteamSpy API error for ${appId}: HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();

    // SteamSpy returns empty object for invalid/not found apps
    if (!data || !data.appid || Object.keys(data).length < 5) {
      console.warn(`No SteamSpy data found for appId: ${appId}`);
      return null;
    }

    return data as SteamSpyAppData;
  } catch (error) {
    console.error(`Failed to fetch SteamSpy data for ${appId}:`, error);
    return null;
  }
}

/**
 * Extract top user tags from SteamSpy data.
 * Tags are sorted by vote count (most popular first).
 *
 * @param steamSpyData - SteamSpy app data
 * @param limit - Maximum number of tags to return (default: 15)
 * @returns Array of tag names, sorted by popularity
 */
export function extractTopTags(
  steamSpyData: SteamSpyAppData | null,
  limit: number = 15
): string[] {
  if (!steamSpyData || !steamSpyData.tags) {
    return [];
  }

  // Convert tags object to array and sort by vote count
  const tagEntries = Object.entries(steamSpyData.tags);

  if (tagEntries.length === 0) {
    return [];
  }

  // Sort by vote count (descending)
  tagEntries.sort((a, b) => b[1] - a[1]);

  // Take top N tags
  return tagEntries.slice(0, limit).map(([tag]) => tag);
}

/**
 * Calculate review score percentage from SteamSpy data.
 * More reliable than Steam's recommendations count.
 *
 * @param steamSpyData - SteamSpy app data
 * @returns Positive review percentage (0-100) or null
 */
export function calculateReviewScore(
  steamSpyData: SteamSpyAppData | null
): number | null {
  if (!steamSpyData) {
    return null;
  }

  const { positive, negative } = steamSpyData;

  if (positive === undefined || negative === undefined) {
    return null;
  }

  const total = positive + negative;

  if (total === 0) {
    return null;
  }

  return Math.round((positive / total) * 100);
}

/**
 * Parse ownership range into estimated number.
 * Returns the midpoint of the range.
 *
 * Example: "2,000,000 .. 5,000,000" -> 3,500,000
 */
export function parseOwnershipEstimate(owners: string): number | null {
  if (!owners) return null;

  // Format: "X .. Y" or "X ± Y%"
  const rangeMatch = owners.match(/^([\d,]+)\s*\.\.\s*([\d,]+)$/);

  if (rangeMatch) {
    const min = parseInt(rangeMatch[1].replace(/,/g, ''), 10);
    const max = parseInt(rangeMatch[2].replace(/,/g, ''), 10);
    return Math.round((min + max) / 2);
  }

  // Try parsing as single number
  const singleMatch = owners.match(/^([\d,]+)$/);
  if (singleMatch) {
    return parseInt(singleMatch[1].replace(/,/g, ''), 10);
  }

  return null;
}

/**
 * Batch fetch SteamSpy data for multiple apps.
 * Includes automatic rate limiting.
 *
 * @param appIds - Array of Steam app IDs
 * @param onProgress - Optional callback for progress updates
 * @returns Map of appId -> SteamSpy data
 */
export async function batchFetchSteamSpyData(
  appIds: number[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<number, SteamSpyAppData>> {
  const results = new Map<number, SteamSpyAppData>();

  for (let i = 0; i < appIds.length; i++) {
    const appId = appIds[i];

    if (onProgress) {
      onProgress(i + 1, appIds.length);
    }

    const data = await fetchSteamSpyData(appId);

    if (data) {
      results.set(appId, data);
    }
  }

  return results;
}

/**
 * Get enriched metadata combining SteamSpy data.
 * Use this to augment Steam API data with tags and stats.
 */
export function createEnrichedMetadata(steamSpyData: SteamSpyAppData | null): {
  tags: string[];
  reviewScore: number | null;
  ownershipEstimate: number | null;
  averagePlaytime: number | null; // In hours
  medianPlaytime: number | null; // In hours
} {
  if (!steamSpyData) {
    return {
      tags: [],
      reviewScore: null,
      ownershipEstimate: null,
      averagePlaytime: null,
      medianPlaytime: null,
    };
  }

  return {
    tags: extractTopTags(steamSpyData, 15),
    reviewScore: calculateReviewScore(steamSpyData),
    ownershipEstimate: parseOwnershipEstimate(steamSpyData.owners),
    averagePlaytime: steamSpyData.average_forever
      ? Math.round(steamSpyData.average_forever / 60)
      : null,
    medianPlaytime: steamSpyData.median_forever
      ? Math.round(steamSpyData.median_forever / 60)
      : null,
  };
}
