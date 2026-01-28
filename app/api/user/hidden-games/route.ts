import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/user/hidden-games?userId=xxx
 *
 * Get list of hidden game IDs for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const hiddenFeedback = await prisma.userFeedback.findMany({
      where: {
        userId,
        feedbackType: 'hidden',
      },
      select: {
        appId: true,
      },
    });

    const hiddenAppIds = hiddenFeedback.map(f => f.appId.toString());

    return NextResponse.json({
      success: true,
      hiddenAppIds,
      count: hiddenAppIds.length,
    });
  } catch (error) {
    console.error('Failed to fetch hidden games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hidden games' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/hidden-games
 *
 * Hide or unhide a game for a user
 * Body: { userId: string, appId: string, action: 'hide' | 'unhide' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, appId, action } = body;

    if (!userId || !appId || !action) {
      return NextResponse.json(
        { error: 'userId, appId, and action are required' },
        { status: 400 }
      );
    }

    if (action !== 'hide' && action !== 'unhide') {
      return NextResponse.json(
        { error: 'action must be "hide" or "unhide"' },
        { status: 400 }
      );
    }

    const appIdBigInt = BigInt(appId);

    if (action === 'hide') {
      // Upsert hidden feedback
      await prisma.userFeedback.upsert({
        where: {
          userId_appId: {
            userId,
            appId: appIdBigInt,
          },
        },
        update: {
          feedbackType: 'hidden',
        },
        create: {
          userId,
          appId: appIdBigInt,
          feedbackType: 'hidden',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Game hidden',
        appId,
      });
    } else {
      // Remove hidden feedback
      await prisma.userFeedback.deleteMany({
        where: {
          userId,
          appId: appIdBigInt,
          feedbackType: 'hidden',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Game unhidden',
        appId,
      });
    }
  } catch (error) {
    console.error('Failed to update hidden game:', error);
    return NextResponse.json(
      { error: 'Failed to update hidden game' },
      { status: 500 }
    );
  }
}
