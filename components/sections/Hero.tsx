import Headline from '../ui/Headline';
import Subtext from '../ui/Subtext';
import StatsGrid from '../ui/StatsGrid';

export default function Hero() {
  return (
    <section className="bg-gradient-to-b from-blue-50 to-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-12">
          {/* Hero Content */}
          <div className="space-y-6 max-w-3xl">
            <Headline>Ai powered game recommendations</Headline>
            <Subtext>
              add your steam tag and lets get started
            </Subtext>
          </div>

          {/* Steam ID Input */}
          <div className="w-full max-w-2xl">
            <input
              type="text"
              placeholder="Enter your Steam ID or profile URL"
              className="w-full px-8 py-6 text-lg text-gray-900 placeholder-gray-500 bg-white border-2 border-blue-300 rounded-xl shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-400 focus:border-blue-500 transition-all duration-200 hover:border-blue-400"
              aria-label="Enter your Steam ID to get recommendations"
            />
          </div>

          {/* Stats Grid */}
          <StatsGrid />
        </div>
      </div>
    </section>
  );
}
