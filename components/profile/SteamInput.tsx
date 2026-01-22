'use client';

import { useState } from 'react';

interface SteamInputProps {
  onSubmit: (steamInput: string) => void;
  isLoading?: boolean;
}

export default function SteamInput({ onSubmit, isLoading }: SteamInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input.trim());
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="steam-input"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Enter your Steam Profile
          </label>
          <input
            id="steam-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Steam ID, profile URL, or custom URL"
            disabled={isLoading}
            className="w-full px-6 py-4 text-lg text-gray-900 placeholder-gray-500 bg-white border-2 border-blue-300 rounded-xl shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 hover:border-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Enter your Steam ID to get recommendations"
          />
          <p className="mt-2 text-sm text-gray-600">
            Examples: 76561198012345678, steamcommunity.com/id/yourname, or
            just "yourname"
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Analyzing Profile...
            </span>
          ) : (
            'Analyze My Profile'
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          Make sure your profile is public
        </h3>
        <p className="text-sm text-blue-700">
          To analyze your library, your Steam profile must be set to Public in
          your Privacy Settings. We only read your game library and playtime -
          no personal data is stored.
        </p>
      </div>
    </div>
  );
}
