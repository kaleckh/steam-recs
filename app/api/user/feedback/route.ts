/**
 * User Feedback API Endpoint
 *
 * POST /api/user/feedback - Submit feedback on a game (PREMIUM ONLY)
 * GET /api/user/feedback?userId=xxx - Get user's feedback history
 * DELETE /api/user/feedback?userId=xxx&appId=yyy - Remove feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  submitFeedback,
  getUserFeedback,
  deleteFeedback,
  type FeedbackType,
} from '@/lib/vector-learning';

/**
 * POST /api/user/feedback
 *
 * Submit feedback on a game (premium only)
 *
 * Body:
 * {
 *   userId: string,
 *   appId: number,
 *   feedbackType: 'like' | 'dislike' | 'not_interested' | 'love'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { userId, appId, feedbackType } = body;

    // Validate input
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid or missing userId' },
        { status: 400 }
      );
    }

    if (!appId || typeof appId !== 'number') {
      return NextResponse.json(
        { error: 'Invalid or missing appId' },
        { status: 400 }
      );
    }

    const validFeedbackTypes: FeedbackType[] = [
      'like',
      'dislike',
      'not_interested',
      'love',
    ];
    if (!validFeedbackTypes.includes(feedbackType)) {
      return NextResponse.json(
        {
          error: `Invalid feedbackType. Must be one of: ${validFeedbackTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Submit feedback and update learned vector
    const result = await submitFeedback(
      userId,
      BigInt(appId),
      feedbackType as FeedbackType
    );

    if (!result.success) {
      // Check if error is due to premium requirement
      if (result.error?.includes('Premium subscription required')) {
        return NextResponse.json(
          {
            error: result.error,
            requiresPremium: true,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        { error: result.error || 'Failed to submit feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      vectorUpdated: result.vectorUpdated,
      message: 'Feedback submitted successfully',
    });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/user/feedback?userId=xxx&limit=50
 *
 * Get user's feedback history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    const feedback = await getUserFeedback(userId, limit);

    return NextResponse.json({
      success: true,
      feedback: feedback.map(f => ({
        appId: f.appId.toString(), // Convert BigInt to string for JSON
        feedbackType: f.feedbackType,
        createdAt: f.createdAt.toISOString(),
        gameName: f.gameName,
      })),
      count: feedback.length,
    });
  } catch (error) {
    console.error('Get feedback API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/feedback?userId=xxx&appId=yyy
 *
 * Remove feedback for a game
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const appIdStr = searchParams.get('appId');

    if (!userId || !appIdStr) {
      return NextResponse.json(
        { error: 'Missing userId or appId parameter' },
        { status: 400 }
      );
    }

    const appId = BigInt(appIdStr);

    const success = await deleteFeedback(userId, appId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete feedback' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback deleted successfully',
    });
  } catch (error) {
    console.error('Delete feedback API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
