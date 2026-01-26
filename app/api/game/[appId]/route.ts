import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/game/:appId
 * Fetch detailed game information by appId
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appId: string }> }
) {
  const startTime = Date.now();
  try {
    const { appId: appIdStr } = await params;
    console.log(`[Game API] Fetching game ${appIdStr}`);
    const appId = BigInt(appIdStr);

    const dbStart = Date.now();
    const game = await prisma.game.findUnique({
      where: { appId },
      select: {
        appId: true,
        name: true,
        type: true,
        releaseYear: true,
        reviewPositivePct: true,
        reviewCount: true,
        metacriticScore: true,
        isFree: true,
        metadata: true,
        createdAt: true,
      },
    });

    console.log(`[Game API] DB query took ${Date.now() - dbStart}ms`);

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    const metadata = game.metadata as any;

    // Format the response
    const gameData = {
      appId: game.appId.toString(),
      name: game.name,
      type: game.type,
      releaseYear: game.releaseYear,
      reviewScore: game.reviewPositivePct,
      reviewCount: game.reviewCount,
      metacriticScore: game.metacriticScore,
      isFree: game.isFree,

      // Extract metadata fields
      shortDescription: metadata?.short_description || null,
      detailedDescription: metadata?.detailed_description || null,
      headerImage: metadata?.header_image || null,
      screenshots: metadata?.screenshots || [],
      movies: metadata?.movies || [],

      // Price info
      price: metadata?.price_overview?.final_formatted || (game.isFree ? 'Free' : null),
      priceRaw: metadata?.price_overview?.final || null,
      discountPercent: metadata?.price_overview?.discount_percent || 0,

      // Categorization
      genres: metadata?.genres || [],
      categories: metadata?.categories || [],
      tags: metadata?.tags || [],

      // Credits
      developers: metadata?.developers || [],
      publishers: metadata?.publishers || [],

      // Platforms
      platforms: metadata?.platforms || null,

      // Requirements
      pcRequirements: metadata?.pc_requirements || null,
      macRequirements: metadata?.mac_requirements || null,
      linuxRequirements: metadata?.linux_requirements || null,

      // Release info
      releaseDate: metadata?.release_date || null,

      // Additional data
      website: metadata?.website || null,
      supportInfo: metadata?.support_info || null,

      // Recommendations count
      recommendations: metadata?.recommendations?.total || null,

      addedAt: game.createdAt.toISOString(),
    };

    console.log(`[Game API] Total request took ${Date.now() - startTime}ms`);
    return NextResponse.json(gameData);
  } catch (error) {
    console.error('Error fetching game details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game details' },
      { status: 500 }
    );
  }
}
