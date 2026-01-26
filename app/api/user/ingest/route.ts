import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  extractSteamId,
  getSteamOwnedGames,
  getSteamPlayerSummary,
  getSteamUserGameAchievements,
} from '@/lib/steam-user-api';
import { updateUserPreferenceVector, UserGameData } from '@/lib/user-preference-vector';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/user/ingest
 *
 * Ingest a user's Steam library and generate personalized preference vector.
 *
 * Body:
 * - steamInput: string (Steam ID, profile URL, or vanity URL)
 * - options?: {
 *     fetchAchievements?: boolean (default: false, slower but more accurate)
 *     recencyDecayMonths?: number (default: 24)
 *     enableGenreDiversification?: boolean (default: true)
 *     minPlaytimeHours?: number (default: 0.5)
 *   }
 *
 * Returns:
 * - userId: string
 * - steamId: string
 * - gamesImported: number
 * - gamesAnalyzed: number
 * - totalPlaytimeHours: number
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    if (!body.steamInput || typeof body.steamInput !== 'string') {
      return NextResponse.json(
        { error: 'steamInput is required (Steam ID, profile URL, or vanity name)' },
        { status: 400 }
      );
    }

    const steamApiKey = process.env.STEAM_API_KEY;
    if (!steamApiKey) {
      return NextResponse.json(
        { error: 'Steam API key not configured. Add STEAM_API_KEY to .env' },
        { status: 500 }
      );
    }

    // Extract Steam ID from input
    const steamId = await extractSteamId(body.steamInput, steamApiKey);

    if (!steamId) {
      return NextResponse.json(
        { error: 'Invalid Steam ID or profile not found' },
        { status: 404 }
      );
    }

    // Get player profile summary (includes username and avatar)
    const playerSummary = await getSteamPlayerSummary(steamId, steamApiKey);

    if (!playerSummary) {
      return NextResponse.json(
        { error: 'Could not fetch Steam profile. Please try again.' },
        { status: 404 }
      );
    }

    // Check if profile is public (communityvisibilitystate: 3 = public)
    if (playerSummary.communityvisibilitystate !== 3) {
      return NextResponse.json(
        {
          error: 'Steam profile is private. Please set profile to public.',
          steamId,
        },
        { status: 403 }
      );
    }

    // Fetch user's game library
    console.log(`Fetching library for Steam ID: ${steamId}`);
    const ownedGames = await getSteamOwnedGames(steamId, steamApiKey);

    if (ownedGames.length === 0) {
      return NextResponse.json(
        { error: 'No games found in Steam library', steamId },
        { status: 404 }
      );
    }

    console.log(`Found ${ownedGames.length} games in library`);

    // Check for authenticated user
    const supabase = await createClient();
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();

    let userProfile;

    if (supabaseUser) {
      // User is authenticated - link Steam to their existing profile
      userProfile = await prisma.userProfile.findUnique({
        where: { supabaseUserId: supabaseUser.id },
      });

      if (userProfile) {
        // Update the existing profile with the Steam ID
        userProfile = await prisma.userProfile.update({
          where: { id: userProfile.id },
          data: { steamId },
        });
      } else {
        // Create new profile with both Supabase and Steam IDs
        userProfile = await prisma.userProfile.create({
          data: {
            supabaseUserId: supabaseUser.id,
            steamId,
            email: supabaseUser.email,
          },
        });
      }
    } else {
      // Legacy flow: unauthenticated user - create new profile each time
      userProfile = await prisma.userProfile.create({
        data: { steamId },
      });
    }

    const userId = userProfile.id;

    // Fetch achievement data (if enabled)
    const fetchAchievements = body.options?.fetchAchievements === true;

    // Import games to database
    const userGamesData: UserGameData[] = [];

    for (const game of ownedGames) {
      // Skip games with zero playtime
      if (game.playtime_forever === 0) {
        continue;
      }

      // Get game metadata from our database
      const existingGame = await prisma.game.findUnique({
        where: { appId: BigInt(game.appid) },
        select: {
          appId: true,
          metadata: true,
        },
      });

      if (!existingGame) {
        // Game not in our database yet - skip for now
        // In production, you might queue it for ingestion
        console.log(`Skipping game ${game.appid} (not in database)`);
        continue;
      }

      // Fetch achievements (optional, slower)
      let achievementsEarned: number | undefined;
      let achievementsTotal: number | undefined;

      if (fetchAchievements) {
        const achData = await getSteamUserGameAchievements(
          steamId,
          game.appid,
          steamApiKey
        );

        if (achData) {
          achievementsEarned = achData.earned;
          achievementsTotal = achData.total;
        }
      }

      // Extract genres from metadata
      const metadata = existingGame.metadata as any;
      const genres = metadata?.genres || [];

      // Convert last played timestamp
      const lastPlayed = game.rtime_last_played
        ? new Date(game.rtime_last_played * 1000)
        : undefined;

      // Store in user_games table
      await prisma.userGame.upsert({
        where: {
          userId_appId: {
            userId,
            appId: BigInt(game.appid),
          },
        },
        update: {
          playtimeMinutes: game.playtime_forever,
          playtimeRecent: game.playtime_2weeks,
          lastPlayed,
          achievementsEarned,
          achievementsTotal,
        },
        create: {
          userId,
          appId: BigInt(game.appid),
          playtimeMinutes: game.playtime_forever,
          playtimeRecent: game.playtime_2weeks,
          lastPlayed,
          achievementsEarned,
          achievementsTotal,
        },
      });

      // Add to vector generation data
      userGamesData.push({
        appId: BigInt(game.appid),
        playtimeMinutes: game.playtime_forever,
        lastPlayed,
        achievementsEarned,
        achievementsTotal,
        genres,
      });
    }

    console.log(`Imported ${userGamesData.length} games for user ${userId}`);

    // Generate preference vector
    const vectorOptions = {
      recencyDecayMonths: body.options?.recencyDecayMonths,
      enableGenreDiversification: body.options?.enableGenreDiversification,
      minPlaytimeHours: body.options?.minPlaytimeHours,
      enableQualityWeighting: fetchAchievements, // Only use quality weighting if we have achievement data
    };

    const result = await updateUserPreferenceVector(
      userId,
      userGamesData,
      vectorOptions
    );

    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Failed to generate preference vector',
          details: result.error,
          gamesImported: userGamesData.length,
        },
        { status: 500 }
      );
    }

    // Calculate total playtime
    const totalPlaytimeHours = userGamesData.reduce(
      (sum, game) => sum + game.playtimeMinutes / 60,
      0
    );

    return NextResponse.json({
      success: true,
      userId,
      steamId,
      username: playerSummary.personaname,
      avatarUrl: playerSummary.avatarfull,
      gamesImported: userGamesData.length,
      gamesAnalyzed: result.gamesAnalyzed,
      totalPlaytimeHours: Math.round(totalPlaytimeHours),
      message: `Successfully imported ${userGamesData.length} games and generated personalized recommendations`,
    });
  } catch (error) {
    console.error('User ingestion error:', error);

    return NextResponse.json(
      {
        error: 'Failed to import user library',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
