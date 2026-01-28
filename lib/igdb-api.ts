/**
 * IGDB API Client (via Twitch)
 *
 * IGDB is owned by Twitch and requires OAuth authentication.
 * Free tier: 4 requests/second
 *
 * Setup:
 * 1. Create app at https://dev.twitch.tv/console/apps
 * 2. Set TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET in .env
 *
 * Docs: https://api-docs.igdb.com/
 */

const IGDB_API_BASE = 'https://api.igdb.com/v4';
const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';

let cachedToken: { token: string; expiresAt: number } | null = null;

export interface IGDBGame {
  id: number;
  name: string;

  // Themes (dark fantasy, sci-fi, post-apocalyptic, etc.)
  themes?: Array<{ id: number; name: string }>;

  // Player perspectives (first-person, third-person, isometric, side-view, etc.)
  player_perspectives?: Array<{ id: number; name: string }>;

  // Game modes (single player, multiplayer, co-op, battle royale, MMO)
  game_modes?: Array<{ id: number; name: string }>;

  // Similar games
  similar_games?: Array<{ id: number; name: string }>;

  // Genres (for cross-reference)
  genres?: Array<{ id: number; name: string }>;

  // Keywords (more granular than genres)
  keywords?: Array<{ id: number; name: string }>;

  // External IDs (Steam, GOG, etc.)
  external_games?: Array<{
    category: number; // 1 = Steam
    uid: string; // Steam AppID
  }>;

  // Ratings
  rating?: number; // 0-100 user rating
  rating_count?: number;
  aggregated_rating?: number; // Critic rating

  // Release
  first_release_date?: number; // Unix timestamp
}

export interface IGDBEnrichedData {
  themes: string[];
  perspectives: string[];
  gameModes: string[];
  similarGameNames: string[];
  keywords: string[];
  igdbRating: number | null;
  igdbRatingCount: number | null;
}

/**
 * Get OAuth token from Twitch
 */
async function getAccessToken(): Promise<string> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET in environment');
  }

  // Return cached token if still valid
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token;
  }

  const response = await fetch(TWITCH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    throw new Error(`Twitch OAuth failed: ${response.status}`);
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.token;
}

/**
 * Search IGDB by Steam AppID
 */
export async function fetchIGDBBySteamId(steamAppId: number): Promise<IGDBGame | null> {
  try {
    const token = await getAccessToken();
    const clientId = process.env.TWITCH_CLIENT_ID!;

    // First, find the IGDB game ID from Steam external ID
    const externalResponse = await fetch(`${IGDB_API_BASE}/external_games`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: `fields game; where category = 1 & uid = "${steamAppId}"; limit 1;`,
    });

    if (!externalResponse.ok) {
      return null;
    }

    const externalData = await externalResponse.json();
    if (!externalData || externalData.length === 0) {
      return null;
    }

    const igdbGameId = externalData[0].game;

    // Fetch full game data
    const gameResponse = await fetch(`${IGDB_API_BASE}/games`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: `
        fields name, themes.name, player_perspectives.name, game_modes.name,
               similar_games.name, genres.name, keywords.name,
               rating, rating_count, aggregated_rating, first_release_date;
        where id = ${igdbGameId};
      `,
    });

    if (!gameResponse.ok) {
      return null;
    }

    const gameData = await gameResponse.json();
    return gameData[0] || null;
  } catch (error) {
    console.error(`IGDB fetch failed for Steam ${steamAppId}:`, error);
    return null;
  }
}

/**
 * Batch fetch IGDB data for multiple Steam AppIDs
 * Uses websites table (type 13 = Steam store) to find games
 *
 * Note: IGDB doesn't have a direct Steam ID lookup, so we query websites
 * and match by URL pattern. This is done in smaller sub-batches.
 */
export async function batchFetchIGDBBySteamIds(steamAppIds: number[]): Promise<Map<number, IGDBGame>> {
  const results = new Map<number, IGDBGame>();

  if (steamAppIds.length === 0) return results;

  try {
    const token = await getAccessToken();
    const clientId = process.env.TWITCH_CLIENT_ID!;

    // Process in smaller sub-batches to avoid query limits
    // IGDB website wildcard queries work best with fewer items
    const subBatchSize = 20;
    const steamIdSet = new Set(steamAppIds);

    for (let i = 0; i < steamAppIds.length; i += subBatchSize) {
      const subBatch = steamAppIds.slice(i, i + subBatchSize);

      // Build URL patterns for this sub-batch
      // Match exact Steam app ID (with trailing slash or end of string)
      const urlPatterns = subBatch.map(id => `(url ~ *"/app/${id}" | url ~ *"/app/${id}/"*)`).join(' | ');

      const websiteResponse = await fetch(`${IGDB_API_BASE}/websites`, {
        method: 'POST',
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'text/plain',
        },
        body: `fields game, url; where type = 13 & (${urlPatterns}); limit 100;`,
      });

      if (!websiteResponse.ok) {
        continue;
      }

      const websiteData = await websiteResponse.json();
      if (!websiteData || websiteData.length === 0) {
        continue;
      }

      // Map Steam IDs to IGDB game IDs by parsing the URL
      const steamToIgdb = new Map<number, number>();
      const igdbIds: number[] = [];

      for (const website of websiteData) {
        // Match Steam app ID at the end of URL or followed by /
        const match = website.url.match(/\/app\/(\d+)(?:\/|$)/);
        if (match) {
          const steamId = parseInt(match[1], 10);
          // Verify this is one of the IDs we're looking for (not a substring match)
          if (steamIdSet.has(steamId) && subBatch.includes(steamId) && !steamToIgdb.has(steamId)) {
            steamToIgdb.set(steamId, website.game);
            if (!igdbIds.includes(website.game)) {
              igdbIds.push(website.game);
            }
          }
        }
      }

      if (igdbIds.length === 0) continue;

      // Fetch game details
      const gameResponse = await fetch(`${IGDB_API_BASE}/games`, {
        method: 'POST',
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'text/plain',
        },
        body: `
          fields name, themes.name, player_perspectives.name, game_modes.name,
                 similar_games.name, genres.name, keywords.name,
                 rating, rating_count, aggregated_rating, first_release_date;
          where id = (${igdbIds.join(',')});
          limit 100;
        `,
      });

      if (!gameResponse.ok) {
        continue;
      }

      const games: IGDBGame[] = await gameResponse.json();

      // Map back to Steam IDs
      const igdbToGame = new Map<number, IGDBGame>();
      for (const game of games) {
        igdbToGame.set(game.id, game);
      }

      for (const [steamId, igdbId] of steamToIgdb) {
        const game = igdbToGame.get(igdbId);
        if (game) {
          results.set(steamId, game);
        }
      }

      // Small delay between sub-batches to respect rate limits
      if (i + subBatchSize < steamAppIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  } catch (error) {
    console.error('IGDB batch fetch failed:', error);
    return results;
  }
}

/**
 * Extract enriched data from IGDB game
 */
export function extractIGDBEnrichedData(game: IGDBGame | null): IGDBEnrichedData {
  if (!game) {
    return {
      themes: [],
      perspectives: [],
      gameModes: [],
      similarGameNames: [],
      keywords: [],
      igdbRating: null,
      igdbRatingCount: null,
    };
  }

  return {
    themes: game.themes?.map(t => t.name) || [],
    perspectives: game.player_perspectives?.map(p => p.name) || [],
    gameModes: game.game_modes?.map(m => m.name) || [],
    similarGameNames: game.similar_games?.slice(0, 5).map(s => s.name) || [],
    keywords: game.keywords?.slice(0, 10).map(k => k.name) || [],
    igdbRating: game.rating ? Math.round(game.rating) : null,
    igdbRatingCount: game.rating_count || null,
  };
}
