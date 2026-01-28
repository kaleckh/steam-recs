/**
 * Quick test script to debug IGDB API
 */
import 'dotenv/config';

const IGDB_API_BASE = 'https://api.igdb.com/v4';
const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';

async function getAccessToken(): Promise<string> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  console.log('Client ID:', clientId ? `${clientId.slice(0, 5)}...` : 'MISSING');
  console.log('Client Secret:', clientSecret ? `${clientSecret.slice(0, 5)}...` : 'MISSING');

  const response = await fetch(TWITCH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      grant_type: 'client_credentials',
    }),
  });

  console.log('Token response status:', response.status);
  const data = await response.json();
  console.log('Token response:', JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(`Twitch OAuth failed: ${response.status} - ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

async function testIGDB() {
  console.log('='.repeat(60));
  console.log('IGDB API Test - New Method');
  console.log('='.repeat(60));

  try {
    const token = await getAccessToken();
    console.log('\nGot token:', token.slice(0, 10) + '...');

    const clientId = process.env.TWITCH_CLIENT_ID!;

    // Test the new batch method with known Steam IDs
    const testSteamIds = [220, 570, 730, 440];  // HL2, Dota 2, CS:GO, TF2
    console.log('\n--- Testing batch fetch with Steam IDs:', testSteamIds);

    // Build URL patterns - match exact ID (with trailing slash or end of string)
    const urlPatterns = testSteamIds.map(id => `(url ~ *"/app/${id}" | url ~ *"/app/${id}/"*)`).join(' | ');
    console.log('Query:', `fields game, url; where type = 13 & (${urlPatterns}); limit 20;`);

    const websiteResponse = await fetch(`${IGDB_API_BASE}/websites`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: `fields game, url; where type = 13 & (${urlPatterns}); limit 20;`,
    });

    console.log('Website response status:', websiteResponse.status);
    const websiteData = await websiteResponse.json();
    console.log('Found websites:', JSON.stringify(websiteData, null, 2));

    if (!websiteData || websiteData.length === 0) {
      console.log('No websites found!');
      return;
    }

    // Extract game IDs and Steam IDs
    const steamToIgdb = new Map<number, number>();
    const igdbIds: number[] = [];

    for (const website of websiteData) {
      // Match exact Steam ID (at end or followed by /)
      const match = website.url.match(/\/app\/(\d+)(?:\/|$)/);
      if (match) {
        const steamId = parseInt(match[1], 10);
        if (testSteamIds.includes(steamId) && !steamToIgdb.has(steamId)) {
          steamToIgdb.set(steamId, website.game);
          if (!igdbIds.includes(website.game)) {
            igdbIds.push(website.game);
          }
        }
      }
    }

    console.log('\nSteam to IGDB mapping:', Object.fromEntries(steamToIgdb));
    console.log('IGDB IDs to fetch:', igdbIds);

    // Fetch game details
    const gameResponse = await fetch(`${IGDB_API_BASE}/games`, {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain',
      },
      body: `
        fields name, themes.name, player_perspectives.name, game_modes.name;
        where id = (${igdbIds.join(',')});
        limit 20;
      `,
    });

    console.log('Games response status:', gameResponse.status);
    const games = await gameResponse.json();

    console.log('\n--- Results ---');
    for (const game of games) {
      console.log(`\n${game.name} (IGDB ID: ${game.id})`);
      console.log(`  Themes: ${game.themes?.map((t: any) => t.name).join(', ') || 'none'}`);
      console.log(`  Perspectives: ${game.player_perspectives?.map((p: any) => p.name).join(', ') || 'none'}`);
      console.log(`  Game Modes: ${game.game_modes?.map((m: any) => m.name).join(', ') || 'none'}`);
    }

    console.log('\n✅ IGDB API is working with new method!');
    console.log(`Found ${games.length} games out of ${testSteamIds.length} requested`);

  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

testIGDB();
