'use client';

interface ErrorDisplayProps {
  error: string;
  onRetry?: () => void;
}

export default function ErrorDisplay({ error, onRetry }: ErrorDisplayProps) {
  return (
    <div className="w-full max-w-2xl mx-auto py-12">
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl shadow-lg p-8">
        <div className="flex flex-col items-center space-y-6 text-center">
          {/* Error Icon */}
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Error Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">
              Oops! Something went wrong
            </h2>
            <p className="text-lg text-red-800">{error}</p>
          </div>

          {/* Retry Button */}
          {onRetry && (
            <button
              onClick={onRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
              Try Again
            </button>
          )}

          {/* Help Text */}
          <div className="bg-white border border-red-200 rounded-lg p-4 w-full">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Common Issues:
            </h3>
            <ul className="text-sm text-gray-700 space-y-1 text-left">
              <li>• Make sure your Steam profile is set to Public</li>
              <li>• Check that your Steam ID or URL is correct</li>
              <li>
                • Your Steam ID should be 17 digits (e.g., 76561198012345678)
              </li>
              <li>• Profile URLs should include steamcommunity.com</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
