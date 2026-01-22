/**
 * Steam Store API client for fetching game details.
 * Documentation: https://partner.steamgames.com/doc/store/getappdetails
 */

const STEAM_API_BASE = 'https://store.steampowered.com/api/appdetails';
const REQUEST_DELAY_MS = 1500; // Steam rate limit: ~1 request per 1.5 seconds
let lastRequestTime = 0;

export interface SteamAppDetails {
  type: string;
  name: string;
  steam_appid: number;
  is_free: boolean;
  detailed_description?: string;
  short_description?: string;
  about_the_game?: string;
  supported_languages?: string;
  header_image?: string;
  capsule_image?: string;
  website?: string;
  developers?: string[];
  publishers?: string[];
  platforms?: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
  metacritic?: {
    score: number;
    url: string;
  };
  categories?: Array<{
    id: number;
    description: string;
  }>;
  genres?: Array<{
    id: string;
    description: string;
  }>;
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
  recommendations?: {
    total: number;
  };
  achievements?: {
    total: number;
    highlighted?: Array<{
      name: string;
      path: string;
    }>;
  };
  release_date?: {
    coming_soon: boolean;
    date: string;
  };
  support_info?: {
    url: string;
    email: string;
  };
  background?: string;
  background_raw?: string;
  content_descriptors?: {
    ids: number[];
    notes?: string;
  };
  price_overview?: {
    currency: string;
    initial: number;
    final: number;
    discount_percent: number;
    initial_formatted?: string;
    final_formatted?: string;
  };
  packages?: number[];
  package_groups?: any[];
  dlc?: number[];
  reviews?: string;
  controller_support?: string;
  required_age?: number | string;
  legal_notice?: string;
}

interface SteamApiResponse {
  [appId: string]: {
    success: boolean;
    data?: SteamAppDetails;
  };
}

/**
 * Sleep utility for rate limiting.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Fetch game details from Steam Store API with rate limiting.
 * @param appId - Steam application ID
 * @returns Game details or null if not found/error
 */
export async function fetchSteamAppDetails(
  appId: number
): Promise<SteamAppDetails | null> {
  try {
    // Rate limiting: ensure minimum delay between requests
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < REQUEST_DELAY_MS) {
      await sleep(REQUEST_DELAY_MS - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();

    const url = `${STEAM_API_BASE}?appids=${appId}`;
    
    console.log(`Fetching Steam data for appId: ${appId}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SteamRecommender/1.0)',
      },
    });

    if (!response.ok) {
      console.error(`Steam API error for ${appId}: HTTP ${response.status}`);
      return null;
    }

    const data: SteamApiResponse = await response.json();
    const appData = data[appId.toString()];

    if (!appData) {
      console.error(`No data returned for appId: ${appId}`);
      return null;
    }

    if (!appData.success) {
      console.error(`Steam API returned success=false for appId: ${appId}`);
      return null;
    }

    if (!appData.data) {
      console.error(`Steam API returned no data for appId: ${appId}`);
      return null;
    }

    return appData.data;
  } catch (error) {
    console.error(`Failed to fetch Steam data for ${appId}:`, error);
    return null;
  }
}

/**
 * Strip HTML tags from text.
 */
export function stripHtml(html: string | undefined): string | undefined {
  if (!html) return undefined;
  return html
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Extract release year from Steam's date string.
 * Formats can be: "Dec 2023", "23 Dec, 2023", "2023", "Coming soon", etc.
 */
export function extractReleaseYear(releaseDate?: {
  coming_soon: boolean;
  date: string;
}): number | null {
  if (!releaseDate || releaseDate.coming_soon) {
    return null;
  }

  const dateStr = releaseDate.date;
  if (!dateStr) return null;

  // Try to extract 4-digit year
  const yearMatch = dateStr.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    return parseInt(yearMatch[0], 10);
  }

  return null;
}

/**
 * Major publishers (AAA) for indie detection heuristic.
 */
const MAJOR_PUBLISHERS = [
  'Valve', 'Electronic Arts', 'EA', 'Activision', 'Blizzard',
  'Ubisoft', 'Take-Two', '2K Games', 'Rockstar Games',
  'Square Enix', 'Bandai Namco', 'SEGA', 'Capcom', 'Konami',
  'Sony', 'Microsoft', 'Xbox Game Studios', 'Bethesda',
  'Warner Bros', 'Epic Games', 'Nintendo',
];

/**
 * Fetch accurate review score from Steam Reviews API.
 * This is more reliable than the recommendations field in appdetails.
 *
 * @param appId - Steam application ID
 * @returns Review score (0-100) or null if unavailable
 */
export async function fetchSteamReviewScore(
  appId: number
): Promise<{
  reviewPositivePct: number | null;
  reviewCount: number;
} | null> {
  try {
    const url = `https://store.steampowered.com/appreviews/${appId}?json=1&filter=all&language=all&num_per_page=0`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SteamRecommender/1.0)',
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.success || !data.query_summary) {
      return null;
    }

    const summary = data.query_summary;
    const totalReviews = summary.total_reviews || 0;

    if (totalReviews === 0) {
      return { reviewPositivePct: null, reviewCount: 0 };
    }

    const totalPositive = summary.total_positive || 0;
    const reviewPositivePct = Math.round((totalPositive / totalReviews) * 100);

    return {
      reviewPositivePct,
      reviewCount: totalReviews,
    };
  } catch (error) {
    console.error(`Failed to fetch review score for ${appId}:`, error);
    return null;
  }
}

/**
 * Calculate review metrics from Steam data.
 * Note: appdetails doesn't provide positive/negative split.
 * Use fetchSteamReviewScore() for accurate percentage.
 */
export function calculateReviewMetrics(recommendations?: {
  total: number;
}): {
  totalReviews: number;
  positivePct: number | null;
} {
  if (!recommendations || !recommendations.total) {
    return { totalReviews: 0, positivePct: null };
  }

  return {
    totalReviews: recommendations.total,
    positivePct: null, // Use fetchSteamReviewScore() for accurate score
  };
}

/**
 * Calculate niche score based on review count.
 * Higher score = more niche (fewer reviews).
 * Formula: 1 / log10(reviews + 10), normalized to 0-1 range.
 * 
 * Examples:
 * - 10 reviews → 0.91 (very niche)
 * - 100 reviews → 0.50 (niche)
 * - 1,000 reviews → 0.33 (somewhat popular)
 * - 10,000 reviews → 0.25 (popular)
 * - 100,000+ reviews → 0.17-0.20 (very popular)
 */
export function calculateNicheScore(totalReviews: number): number {
  if (totalReviews <= 0) return 1.0; // No reviews = maximum niche
  
  // Inverse log formula
  const rawScore = 1 / Math.log10(totalReviews + 10);
  
  // Normalize to 0-1 range
  // log10(10) = 1, so min is 1/1 = 1.0 (at ~0 reviews)
  // log10(1000010) ≈ 6, so 1/6 ≈ 0.17 (at 1M reviews)
  // Clamp between 0-1
  return Math.max(0, Math.min(1, rawScore));
}

/**
 * Detect if game is likely indie based on developer/publisher info.
 * Heuristic approach - not 100% accurate but useful.
 */
export function isLikelyIndie(
  developers?: string[],
  publishers?: string[]
): boolean {
  // No developer info = unknown, default to false
  if (!developers || developers.length === 0) {
    return false;
  }
  
  // More than 2 developers = likely not indie
  if (developers.length > 2) {
    return false;
  }
  
  // Check if published by a major publisher
  if (publishers && publishers.length > 0) {
    const hasMajorPublisher = publishers.some(pub =>
      MAJOR_PUBLISHERS.some(major =>
        pub.toLowerCase().includes(major.toLowerCase())
      )
    );
    
    if (hasMajorPublisher) {
      return false;
    }
  }
  
  // Self-published or small publisher + 1-2 devs = likely indie
  return true;
}

/**
 * Detect multiplayer capability from categories.
 */
export function hasMultiplayerSupport(categories?: Array<{ description: string }>): boolean {
  if (!categories || categories.length === 0) return false;
  
  const multiplayerKeywords = [
    'multi-player',
    'multiplayer', 
    'co-op',
    'online',
    'pvp',
    'mmo',
    'cross-platform multiplayer',
  ];
  
  return categories.some(cat =>
    multiplayerKeywords.some(keyword =>
      cat.description.toLowerCase().includes(keyword)
    )
  );
}

/**
 * Create content rating summary from descriptors.
 */
export function createContentRatingSummary(
  contentDescriptors?: {
    ids: number[];
    notes?: string;
  }
): string | null {
  if (!contentDescriptors) return null;
  
  const parts: string[] = [];
  
  // Add notes if available (human-readable)
  if (contentDescriptors.notes) {
    parts.push(contentDescriptors.notes);
  }
  
  // Add IDs as fallback
  if (contentDescriptors.ids && contentDescriptors.ids.length > 0) {
    // Steam content descriptor IDs:
    // 1 = Violence, 2 = Sexual Content, 3 = Adult Only Sexual Content
    // 4 = Nudity, 5 = Gambling, etc.
    const idStr = contentDescriptors.ids.join(', ');
    if (!contentDescriptors.notes) {
      parts.push(`Content IDs: ${idStr}`);
    }
  }
  
  return parts.length > 0 ? parts.join(' | ') : null;
}
