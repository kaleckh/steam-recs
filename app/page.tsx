import Hero from '@/components/sections/Hero';
import DiscoverSection from '@/components/sections/DiscoverSection';
import SteamByTheNumbersSection from '@/components/sections/SteamByTheNumbersSection';
import DailyChallengeSection from '@/components/sections/DailyChallengeSection';
import Footer from '@/components/ui/Footer';

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <DiscoverSection />
        <SteamByTheNumbersSection />
        <DailyChallengeSection />
      </main>
      <Footer />
    </>
  );
}
