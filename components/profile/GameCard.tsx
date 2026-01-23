'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GameRecommendation, submitFeedback, type FeedbackType } from '@/lib/api-client';

interface GameCardProps {
  game: GameRecommendation;
  userId?: string;
  isPremium?: boolean;
  onFeedbackSubmitted?: (feedbackType: FeedbackType, appId: string) => void;
  onPremiumRequired?: () => void;
}

export default function GameCard({
  game,
  userId,
  isPremium = false,
  onFeedbackSubmitted,
  onPremiumRequired,
}: GameCardProps) {
  const steamUrl = `https://store.steampowered.com/app/${game.appId}`;
  const similarityPercent = Math.round(game.similarity * 100);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<FeedbackType | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Determine similarity color
  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return 'text-green-600 bg-green-100';
    if (similarity >= 0.6) return 'text-blue-600 bg-blue-100';
    if (similarity >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  // Handle feedback submission
  const handleFeedback = async (
    e: React.MouseEvent,
    type: FeedbackType
  ) => {
    e.preventDefault(); // Prevent navigation to Steam
    e.stopPropagation();

    if (!isPremium) {
      onPremiumRequired?.();
      return;
    }

    if (!userId || isSubmitting) return;

    setIsSubmitting(true);

    const result = await submitFeedback(userId, game.appId, type);

    if (result.success) {
      setFeedbackGiven(type);

      // Fade out ALL rated games (like, love, dislike, not_interested)
      setIsFadingOut(true);

      // Wait for fade animation, then notify parent
      setTimeout(() => {
        onFeedbackSubmitted?.(type, game.appId);
      }, 500);
    } else if (result.requiresPremium) {
      onPremiumRequired?.();
    }

    setIsSubmitting(false);
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 border border-gray-200 hover:border-blue-400 ${
        isFadingOut ? 'opacity-0 scale-90 -translate-y-4 pointer-events-none' : 'opacity-100 scale-100 translate-y-0'
      }`}
    >
      <a
        href={steamUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group block"
      >
        {/* Header Image */}
        {game.headerImage ? (
          <div className="relative h-48 overflow-hidden bg-gray-200">
            <img
              src={game.headerImage}
              alt={game.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            {/* Similarity Badge */}
            <div className="absolute top-3 right-3">
              <div
                className={`${getSimilarityColor(game.similarity)} px-3 py-1 rounded-full text-sm font-bold shadow-lg`}
              >
                {similarityPercent}% Match
              </div>
            </div>
          </div>
        ) : (
          <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <span className="text-gray-500 text-lg font-medium">
              No Image Available
            </span>
          </div>
        )}

        {/* Content */}
        <div className="p-5 space-y-3">
          {/* Game Name */}
          <h3 className="text-lg font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {game.name}
          </h3>

          {/* Genres */}
          {game.genres && game.genres.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {game.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {game.shortDescription && (
            <p className="text-sm text-gray-600 line-clamp-3">
              {game.shortDescription}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            {/* Review Score */}
            {game.reviewScore !== null && (
              <div className="flex items-center space-x-1">
                <svg
                  className={`w-5 h-5 ${game.reviewScore >= 80 ? 'text-green-600' : game.reviewScore >= 60 ? 'text-yellow-600' : 'text-red-600'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
                <span className="text-sm font-semibold text-gray-700">
                  {game.reviewScore}%
                </span>
                {game.reviewCount !== null && game.reviewCount > 0 && (
                  <span className="text-xs text-gray-500">
                    ({game.reviewCount.toLocaleString()})
                  </span>
                )}
              </div>
            )}

            {/* Release Year */}
            {game.releaseYear && (
              <span className="text-sm text-gray-500">{game.releaseYear}</span>
            )}

            {/* Price or Free Tag */}
            {game.isFree && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-bold">
                FREE
              </span>
            )}
            {!game.isFree && game.price && (
              <span className="text-sm font-bold text-blue-600">{game.price}</span>
            )}
          </div>

          {/* Developers */}
          {game.developers && game.developers.length > 0 && (
            <div className="pt-2">
              <p className="text-xs text-gray-500">
                by {game.developers.slice(0, 2).join(', ')}
              </p>
            </div>
          )}
        </div>
      </a>

      {/* Action Buttons */}
      <div className="px-5 pb-5 pt-0 space-y-2">
        {/* View Details Button */}
        <Link
          href={`/game/${game.appId}`}
          className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg font-medium text-sm transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          View Details
        </Link>

        {/* Feedback Buttons (Premium Only) */}
        {userId && isPremium && (
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-200">
              <button
                onClick={(e) => handleFeedback(e, 'love')}
                disabled={isSubmitting}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  feedbackGiven === 'love'
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-pink-100 hover:text-pink-700'
                } disabled:opacity-50`}
              >
                ❤️ Love
              </button>
              <button
                onClick={(e) => handleFeedback(e, 'like')}
                disabled={isSubmitting}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  feedbackGiven === 'like'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700'
                } disabled:opacity-50`}
              >
                👍
              </button>
              <button
                onClick={(e) => handleFeedback(e, 'dislike')}
                disabled={isSubmitting}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  feedbackGiven === 'dislike'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700'
                } disabled:opacity-50`}
              >
                👎
              </button>
              <button
                onClick={(e) => handleFeedback(e, 'not_interested')}
                disabled={isSubmitting}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  feedbackGiven === 'not_interested'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50`}
                title="Never show this game again"
              >
                🚫
              </button>
            </div>
        )}

        {/* Non-premium upgrade prompt */}
        {userId && !isPremium && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onPremiumRequired?.();
            }}
            className="w-full py-2 px-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-lg font-semibold text-sm hover:from-yellow-500 hover:to-yellow-600 transition-all flex items-center justify-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            Upgrade to Premium to rate games
          </button>
        )}
      </div>
    </div>
  );
}
