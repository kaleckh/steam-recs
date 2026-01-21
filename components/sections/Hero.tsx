import Headline from '../ui/Headline';
import Subtext from '../ui/Subtext';
import StatsGrid from '../ui/StatsGrid';
import CTAButton from '../ui/CTAButton';

export default function Hero() {
  return (
    <section className="bg-gradient-to-b from-blue-50 to-white py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center space-y-12">
          {/* Hero Content */}
          <div className="space-y-6 max-w-3xl">
            <Headline>Find Your Next Favorite Game</Headline>
            <Subtext>
              Stop scrolling through endless Steam listings. Get personalized recommendations in seconds.
            </Subtext>
          </div>

          {/* CTA Button */}
          <CTAButton 
            href="/api/auth/steam" 
            ariaLabel="Sign in with Steam to get recommendations"
          >
            Sign in with Steam
          </CTAButton>

          {/* Stats Grid */}
          <StatsGrid />
        </div>
      </div>
    </section>
  );
}
