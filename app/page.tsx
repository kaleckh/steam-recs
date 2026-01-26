import Hero from '@/components/sections/Hero';
import ExampleRecsSection from '@/components/sections/ExampleRecsSection';
import HowItWorksSection from '@/components/sections/HowItWorksSection';
import SteamByTheNumbersSection from '@/components/sections/SteamByTheNumbersSection';
import Footer from '@/components/ui/Footer';
import AnimatedBackground from '@/components/ui/AnimatedBackground';

export default function Home() {
  return (
    <>
      <AnimatedBackground />
      <main className="relative">
        <Hero />
        <ExampleRecsSection />
        <HowItWorksSection />
        <SteamByTheNumbersSection />
      </main>
      <Footer />
    </>
  );
}
