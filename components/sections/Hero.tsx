'use client';

import { useRouter } from 'next/navigation';

export default function Hero() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/profile');
  };

  return (
    <section className="py-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-10">
          {/* Hero Content */}
          <div className="space-y-6 max-w-4xl">
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white drop-shadow-lg leading-tight">
              Find Your Next Favorite Game
            </h1>
            <p className="text-2xl md:text-3xl text-[#c7d5e0] max-w-3xl mx-auto">
              AI-powered recommendations based on your Steam library
            </p>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-[#06BFFF] to-[#2571CE] hover:from-[#1999FF] hover:to-[#1C5FA8] text-white text-xl font-bold py-6 px-12 rounded-xl shadow-2xl hover:shadow-[#66c0f4]/50 transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#66c0f4]/50"
          >
            Get My Recommendations
          </button>

          {/* Subtext */}
          <p className="text-[#8f98a0] text-sm">
            Free • No signup required • Takes 30 seconds
          </p>
        </div>
      </div>
    </section>
  );
}
