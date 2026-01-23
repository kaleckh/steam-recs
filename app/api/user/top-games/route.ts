import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/user/top-games?userId=xxx&limit=5
 *
 * Get user's top played games with metadata
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Fetch user's top games by playtime with game metadata
    const topGames = await prisma.userGame.findMany({
      where: { userId },
      orderBy: { playtimeForever: 'desc' },
      take: limit,
      include: {
        game: {
          select: {
            appId: true,
            name: true,
            metadata: true,
          },
        },
      },
    });

    const games = topGames.map((ug) => ({
      appId: ug.game.appId.toString(),
      name: ug.game.name,
      playtimeHours: Math.round(ug.playtimeForever / 60),
      headerImage: (ug.game.metadata as any)?.header_image || (ug.game.metadata as any)?.headerImage,
    }));

    return NextResponse.json({
      success: true,
      games,
    });
  } catch (error) {
    console.error('Top games API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
