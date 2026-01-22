/**
 * Steam Web API client for fetching user library and playtime data.
 * Requires Steam Web API Key (free from: https://steamcommunity.com/dev/apikey)
 * Documentation: https://developer.valvesoftware.com/wiki/Steam_Web_API
 */

const STEAM_WEB_API_BASE = 'https://api.steampowered.com';

export interface SteamOwnedGame {
  appid: number;
  name: string;
  playtime_forever: number; // Total playtime in minutes
  playtime_windows_forever?: number;
  playtime_mac_forever?: number;
  playtime_linux_forever?: number;
  playtime_deck_forever?: number;
  playtime_2weeks?: number; // Playtime in last 2 weeks (minutes)
  rtime_last_played?: number; // Unix timestamp of last play
  img_icon_url?: string;
  img_logo_url?: string;
  has_community_visible_stats?: boolean;
}

export interface SteamPlayerSummary {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  personastate: number;
  communityvisibilitystate: number;
  profilestate: number;
  lastlogoff?: number;
  commentpermission?: number;
  realname?: string;
  timecreated?: number;
  loccountrycode?: string;
}

export interface SteamUserAchievements {
  steamID: string;
  gameName: string;
  achievements: Array<{
    apiname: string;
    achieved: number; // 0 or 1
    unlocktime: number; // Unix timestamp
    name?: string;
    description?: string;
  }>;
  success: boolean;
}

/**
 * Get owned games for a Steam user with playtime data.
 * Requires user's profile to be public.
 *
 * @param steamId - Steam user ID (64-bit SteamID)
 * @param apiKey - Steam Web API key
 * @returns List of owned games with playtime
 */
export async function getSteamOwnedGames(
  steamId: string,
  apiKey: string
): Promise<SteamOwnedGame[]> {
  try {
    const url = new URL(`${STEAM_WEB_API_BASE}/IPlayerService/GetOwnedGames/v0001/`);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('steamid', steamId);
    url.searchParams.append('include_appinfo', '1'); // Include game names
    url.searchParams.append('include_played_free_games', '1'); // Include F2P games
    url.searchParams.append('format', 'json');

    console.log(`Fetching Steam library for user: ${steamId}`);
    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Steam API error: HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.response) {
      throw new Error('Invalid Steam API response format');
    }

    if (!data.response.games) {
      // User may have private profile or no games
      console.warn(`No games found for Steam user ${steamId} (profile may be private)`);
      return [];
    }

    return data.response.games as SteamOwnedGame[];
  } catch (error) {
    console.error(`Failed to fetch Steam library for ${steamId}:`, error);
    throw error;
  }
}

/**
 * Get player summary (profile info) for a Steam user.
 *
 * @param steamId - Steam user ID
 * @param apiKey - Steam Web API key
 * @returns Player profile summary
 */
export async function getSteamPlayerSummary(
  steamId: string,
  apiKey: string
): Promise<SteamPlayerSummary | null> {
  try {
    const url = new URL(`${STEAM_WEB_API_BASE}/ISteamUser/GetPlayerSummaries/v0002/`);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('steamids', steamId);
    url.searchParams.append('format', 'json');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Steam API error: HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.response?.players?.[0]) {
      return null;
    }

    return data.response.players[0] as SteamPlayerSummary;
  } catch (error) {
    console.error(`Failed to fetch Steam player summary for ${steamId}:`, error);
    return null;
  }
}

/**
 * Get user achievements for a specific game.
 * Used to calculate engagement/completion metrics.
 *
 * @param steamId - Steam user ID
 * @param appId - Game app ID
 * @param apiKey - Steam Web API key
 * @returns Achievement data or null if unavailable
 */
export async function getSteamUserGameAchievements(
  steamId: string,
  appId: number,
  apiKey: string
): Promise<{ earned: number; total: number } | null> {
  try {
    const url = new URL(`${STEAM_WEB_API_BASE}/ISteamUserStats/GetPlayerAchievements/v0001/`);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('steamid', steamId);
    url.searchParams.append('appid', appId.toString());
    url.searchParams.append('format', 'json');

    const response = await fetch(url.toString());

    if (!response.ok) {
      // Many games don't have achievements, this is normal
      return null;
    }

    const data = await response.json();

    if (!data.playerstats?.success || !data.playerstats?.achievements) {
      return null;
    }

    const achievements = data.playerstats.achievements;
    const earned = achievements.filter((a: any) => a.achieved === 1).length;
    const total = achievements.length;

    return { earned, total };
  } catch (error) {
    // Silently fail - achievements are optional
    return null;
  }
}

/**
 * Resolve Steam vanity URL to SteamID64.
 * Allows users to input their custom Steam URL instead of numeric ID.
 *
 * Example: "gabelogannewell" -> "76561197960287930"
 *
 * @param vanityUrl - Steam vanity URL (custom name)
 * @param apiKey - Steam Web API key
 * @returns SteamID64 or null if not found
 */
export async function resolveSteamVanityUrl(
  vanityUrl: string,
  apiKey: string
): Promise<string | null> {
  try {
    const url = new URL(`${STEAM_WEB_API_BASE}/ISteamUser/ResolveVanityURL/v0001/`);
    url.searchParams.append('key', apiKey);
    url.searchParams.append('vanityurl', vanityUrl);
    url.searchParams.append('format', 'json');

    const response = await fetch(url.toString());

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.response?.success === 1 && data.response?.steamid) {
      return data.response.steamid;
    }

    return null;
  } catch (error) {
    console.error(`Failed to resolve vanity URL ${vanityUrl}:`, error);
    return null;
  }
}

/**
 * Extract SteamID from various input formats.
 * Handles:
 * - Direct SteamID64: "76561197960287930"
 * - Profile URL: "https://steamcommunity.com/profiles/76561197960287930/"
 * - Vanity URL: "https://steamcommunity.com/id/gabelogannewell/"
 * - Just vanity name: "gabelogannewell"
 *
 * @param input - User input (ID, URL, or vanity name)
 * @param apiKey - Steam Web API key (needed for vanity URL resolution)
 * @returns SteamID64 or null if invalid
 */
export async function extractSteamId(
  input: string,
  apiKey: string
): Promise<string | null> {
  // Clean whitespace
  input = input.trim();

  // Case 1: Direct SteamID64 (17 digits starting with 7656119...)
  if (/^765611\d{11}$/.test(input)) {
    return input;
  }

  // Case 2: Profile URL with SteamID
  const profileMatch = input.match(/steamcommunity\.com\/profiles\/(\d+)/);
  if (profileMatch) {
    return profileMatch[1];
  }

  // Case 3: Vanity URL or vanity name
  const vanityMatch = input.match(/steamcommunity\.com\/id\/([^/]+)/);
  const vanityName = vanityMatch ? vanityMatch[1] : input;

  // Resolve vanity URL to SteamID
  return await resolveSteamVanityUrl(vanityName, apiKey);
}

/**
 * Validate if a Steam profile is public and accessible.
 *
 * @param steamId - Steam user ID
 * @param apiKey - Steam Web API key
 * @returns true if profile is public and has games data
 */
export async function isSteamProfilePublic(
  steamId: string,
  apiKey: string
): Promise<boolean> {
  try {
    const summary = await getSteamPlayerSummary(steamId, apiKey);

    if (!summary) {
      return false;
    }

    // communityvisibilitystate: 3 = public, 1 = private
    if (summary.communityvisibilitystate !== 3) {
      return false;
    }

    // Try to fetch games to confirm access
    const games = await getSteamOwnedGames(steamId, apiKey);
    return games.length > 0;
  } catch (error) {
    return false;
  }
}
