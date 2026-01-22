/**
 * Utility functions for ingesting games from Steam API
 */

interface SteamAppDetails {
  steam_appid: number;
  name: string;
  type?: string;
  short_description?: string;
  detailed_description?: string;
  genres?: Array<{ description: string }>;
  categories?: Array<{ description: string }>;
  developers?: string[];
  publishers?: string[];
  [key: string]: any;
}

interface SteamApiResponse {
  [appId: string]: {
    success: boolean;
    data?: SteamAppDetails;
  };
}

/**
 * Fetch game details from Steam API
 */
export async function fetchSteamGameDetails(appId: number): Promise<SteamAppDetails | null> {
  try {
    const response = await fetch(
      `https://store.steampowered.com/api/appdetails?appids=${appId}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SteamRecsBot/1.0)',
        },
      }
    );

    if (!response.ok) {
      console.error(`Steam API returned ${response.status} for app ${appId}`);
      throw new Error(`Steam API returned ${response.status}`);
    }

    const data: SteamApiResponse = await response.json();
    const appData = data[appId.toString()];

    if (!appData?.success || !appData.data) {
      console.error(`Steam API returned no data for app ${appId}:`, JSON.stringify(appData));
      return null;
    }

    return appData.data;
  } catch (error) {
    console.error(`Failed to fetch Steam game ${appId}:`, error);
    return null;
  }
}

/**
 * Convert Steam API data to ingest format
 */
export function convertSteamDataToIngestFormat(steamData: SteamAppDetails) {
  const genres = steamData.genres?.map((g) => g.description) || [];

  return {
    appId: steamData.steam_appid,
    name: steamData.name,
    description: steamData.short_description || steamData.detailed_description,
    metadata: {
      type: steamData.type,
      genres,
      categories: steamData.categories?.map((c) => c.description) || [],
      developers: steamData.developers || [],
      publishers: steamData.publishers || [],
      price_overview: steamData.price_overview || null, // Add price data
      // Store additional metadata as needed
    },
  };
}

/**
 * Ingest a single game via the API route
 */
export async function ingestGameViaAPI(
  appId: number,
  baseUrl = 'http://localhost:3000'
): Promise<void> {
  // Fetch from Steam
  const steamData = await fetchSteamGameDetails(appId);
  
  if (!steamData) {
    throw new Error(`Failed to fetch game ${appId} from Steam`);
  }

  // Convert to ingest format
  const gameData = convertSteamDataToIngestFormat(steamData);

  // Call our ingest API
  const response = await fetch(`${baseUrl}/api/games/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(gameData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Ingest API error: ${error.error || response.statusText}`);
  }
}

/**
 * Batch ingest games via the API route
 * Fetches from Steam and sends to ingest API in batches
 */
export async function batchIngestGamesViaAPI(
  appIds: number[],
  options: {
    baseUrl?: string;
    batchSize?: number;
    delayBetweenSteamRequests?: number;
  } = {}
): Promise<{
  processed: number;
  failed: number;
  errors: Array<{ appId: number; error: string }>;
}> {
  const {
    baseUrl = 'http://localhost:3000',
    batchSize = 50,
    delayBetweenSteamRequests = 1500, // Steam rate limiting
  } = options;

  const games = [];
  const errors: Array<{ appId: number; error: string }> = [];

  // Fetch from Steam with rate limiting
  for (let i = 0; i < appIds.length; i++) {
    const appId = appIds[i];
    
    try {
      console.log(`Fetching Steam data for ${appId} (${i + 1}/${appIds.length})...`);
      const steamData = await fetchSteamGameDetails(appId);
      
      if (!steamData) {
        errors.push({ appId, error: 'Failed to fetch from Steam' });
        continue;
      }

      games.push(convertSteamDataToIngestFormat(steamData));

      // Rate limiting: wait between requests
      if (i < appIds.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenSteamRequests));
      }
    } catch (error) {
      errors.push({
        appId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Send to ingest API in batches
  const ingestResults = {
    processed: 0,
    failed: 0,
  };

  for (let i = 0; i < games.length; i += batchSize) {
    const batch = games.slice(i, i + batchSize);
    
    try {
      console.log(`Ingesting batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(games.length / batchSize)}...`);
      console.log(`Batch contains ${batch.length} games:`, batch.map(g => `${g.appId}:${g.name}`).join(', '));
      
      const response = await fetch(`${baseUrl}/api/games/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ games: batch }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}):`, errorText);
        throw new Error(`API returned ${response.status}`);
      }

      const result = await response.json();
      ingestResults.processed += result.processed || 0;
      ingestResults.failed += result.failed || 0;

      if (result.errors) {
        errors.push(...result.errors);
      }
    } catch (error) {
      // If batch fails entirely, mark all as failed
      batch.forEach((game) => {
        errors.push({
          appId: game.appId,
          error: error instanceof Error ? error.message : String(error),
        });
      });
      ingestResults.failed += batch.length;
    }
  }

  return {
    processed: ingestResults.processed,
    failed: ingestResults.failed + errors.length,
    errors,
  };
}
