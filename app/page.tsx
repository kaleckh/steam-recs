import Hero from '@/components/sections/Hero';
import ExampleRecsSection from '@/components/sections/ExampleRecsSection';
import HowItWorksSection from '@/components/sections/HowItWorksSection';
import SteamByTheNumbersSection from '@/components/sections/SteamByTheNumbersSection';
import AnimatedBackground from '@/components/ui/AnimatedBackground';

export default function Home() {
  return (
    <>
      <AnimatedBackground />
      <div className="relative">
        <Hero />
        <ExampleRecsSection />
        <HowItWorksSection />
        <SteamByTheNumbersSection />
      </div>
    </>
  );
}
