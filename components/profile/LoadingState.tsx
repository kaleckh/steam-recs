'use client';

import { useEffect, useState } from 'react';

interface LoadingStateProps {
  steamId?: string;
}

const LOADING_MESSAGES = [
  'Connecting to Steam API...',
  'Fetching your game library...',
  'Analyzing playtime data...',
  'Calculating preference weights...',
  'Generating AI-powered vector embeddings...',
  'Finding perfect matches...',
];

export default function LoadingState({ steamId }: LoadingStateProps) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto py-12">
      <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
        <div className="flex flex-col items-center space-y-6">
          {/* Spinner */}
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            </div>
          </div>

          {/* Messages */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Analyzing Your Profile
            </h2>
            {steamId && (
              <p className="text-sm text-gray-600">Steam ID: {steamId}</p>
            )}
            <p className="text-lg text-blue-600 font-medium min-h-[28px] transition-all duration-500">
              {LOADING_MESSAGES[messageIndex]}
            </p>
          </div>

          {/* Progress indicator */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full animate-pulse w-2/3"></div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 w-full">
            <p className="text-sm text-blue-800 text-center">
              This usually takes 30-60 seconds depending on your library size.
              <br />
              We're analyzing your games and generating personalized
              recommendations!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
