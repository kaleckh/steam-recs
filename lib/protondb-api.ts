/**
 * ProtonDB API Client
 *
 * ProtonDB provides community ratings for Linux/Steam Deck compatibility.
 * No API key required, but be respectful with rate limits.
 *
 * Ratings: Native, Platinum, Gold, Silver, Bronze, Borked, Pending
 */

const PROTONDB_API_BASE = 'https://www.protondb.com/api/v1/reports/summaries';
const REQUEST_DELAY_MS = 200;
let lastRequestTime = 0;

export type ProtonDBTier = 'native' | 'platinum' | 'gold' | 'silver' | 'bronze' | 'borked' | 'pending' | null;

export interface ProtonDBSummary {
  tier: ProtonDBTier;
  score: number; // 0-1 score
  total: number; // Total reports
  trendingTier: ProtonDBTier;
  bestReportedTier: ProtonDBTier;
}

export interface ProtonDBEnrichedData {
  protonTier: ProtonDBTier;
  protonScore: number | null; // 0-100
  steamDeckCompatible: boolean; // Gold or better
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch ProtonDB summary for a Steam game
 */
export async function fetchProtonDB(steamAppId: number): Promise<ProtonDBSummary | null> {
  try {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < REQUEST_DELAY_MS) {
      await sleep(REQUEST_DELAY_MS - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();

    const url = `${PROTONDB_API_BASE}/${steamAppId}.json`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SteamRecommender/1.0)',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No data for this game
        return null;
      }
      return null;
    }

    const data = await response.json();

    return {
      tier: data.tier || null,
      score: data.score || 0,
      total: data.total || 0,
      trendingTier: data.trendingTier || null,
      bestReportedTier: data.bestReportedTier || null,
    };
  } catch (error) {
    // ProtonDB often returns 404 for games without reports
    return null;
  }
}

/**
 * Extract enriched data from ProtonDB summary
 */
export function extractProtonDBEnrichedData(summary: ProtonDBSummary | null): ProtonDBEnrichedData {
  if (!summary) {
    return {
      protonTier: null,
      protonScore: null,
      steamDeckCompatible: false,
    };
  }

  // Steam Deck compatible = Gold, Platinum, or Native
  const compatibleTiers: ProtonDBTier[] = ['native', 'platinum', 'gold'];
  const steamDeckCompatible = summary.tier ? compatibleTiers.includes(summary.tier) : false;

  return {
    protonTier: summary.tier,
    protonScore: summary.score ? Math.round(summary.score * 100) : null,
    steamDeckCompatible,
  };
}

/**
 * Batch fetch ProtonDB data for multiple games
 */
export async function batchFetchProtonDB(
  steamAppIds: number[],
  onProgress?: (current: number, total: number) => void
): Promise<Map<number, ProtonDBSummary>> {
  const results = new Map<number, ProtonDBSummary>();

  for (let i = 0; i < steamAppIds.length; i++) {
    const appId = steamAppIds[i];

    if (onProgress) {
      onProgress(i + 1, steamAppIds.length);
    }

    const summary = await fetchProtonDB(appId);
    if (summary) {
      results.set(appId, summary);
    }
  }

  return results;
}

/**
 * Get human-readable tier description
 */
export function getTierDescription(tier: ProtonDBTier): string {
  switch (tier) {
    case 'native':
      return 'Native Linux support';
    case 'platinum':
      return 'Runs perfectly';
    case 'gold':
      return 'Runs great after tweaks';
    case 'silver':
      return 'Runs with minor issues';
    case 'bronze':
      return 'Runs with significant issues';
    case 'borked':
      return 'Does not run';
    case 'pending':
      return 'Awaiting reports';
    default:
      return 'Unknown';
  }
}
