'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Headline from '../ui/Headline';
import Subtext from '../ui/Subtext';
import StatsGrid from '../ui/StatsGrid';

export default function Hero() {
  const router = useRouter();
  const [steamInput, setSteamInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (steamInput.trim()) {
      router.push(`/profile?steamId=${encodeURIComponent(steamInput.trim())}`);
    }
  };

  const handleGetStarted = () => {
    router.push('/profile');
  };

  return (
    <section className="bg-gradient-to-b from-blue-50 to-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-12">
          {/* Hero Content */}
          <div className="space-y-6 max-w-3xl">
            <Headline>AI powered game recommendations</Headline>
            <Subtext>
              Add your Steam profile and get personalized recommendations
            </Subtext>
          </div>

          {/* Steam ID Input Form */}
          <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-4">
            <input
              type="text"
              value={steamInput}
              onChange={(e) => setSteamInput(e.target.value)}
              placeholder="Enter your Steam ID or profile URL"
              className="w-full px-8 py-6 text-lg text-gray-900 placeholder-gray-500 bg-white border-2 border-blue-300 rounded-xl shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 hover:border-blue-400"
              aria-label="Enter your Steam ID to get recommendations"
            />
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={!steamInput.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
              >
                Get Recommendations
              </button>
              <button
                type="button"
                onClick={handleGetStarted}
                className="flex-1 bg-white hover:bg-gray-50 text-blue-600 font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl border-2 border-blue-600 transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300"
              >
                Get Started
              </button>
            </div>
          </form>

          {/* Stats Grid */}
          <StatsGrid />
        </div>
      </div>
    </section>
  );
}
