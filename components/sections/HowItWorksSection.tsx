'use client';

import { useEffect, useRef, useState } from 'react';

const steps = [
  {
    number: '01',
    title: 'CONNECT',
    subtitle: 'Steam Profile',
    description: 'Enter your Steam ID or profile URL. Your library stays completely private.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    color: 'cyan',
  },
  {
    number: '02',
    title: 'ANALYZE',
    subtitle: 'Neural Processing',
    description: 'Our AI examines your playtime, genres, and preferences to build your taste profile.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    color: 'orange',
  },
  {
    number: '03',
    title: 'DISCOVER',
    subtitle: 'Perfect Matches',
    description: 'Get personalized recommendations including hidden gems and trending titles.',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    color: 'green',
  },
];

export default function HowItWorksSection() {
  const [visibleSteps, setVisibleSteps] = useState<boolean[]>([false, false, false]);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger the animations
            steps.forEach((_, index) => {
              setTimeout(() => {
                setVisibleSteps((prev) => {
                  const newVisible = [...prev];
                  newVisible[index] = true;
                  return newVisible;
                });
              }, index * 200);
            });
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'cyan':
        return {
          border: 'border-neon-cyan',
          text: 'text-neon-cyan',
          bg: 'bg-neon-cyan/10',
          glow: 'box-glow-cyan',
        };
      case 'orange':
        return {
          border: 'border-neon-orange',
          text: 'text-neon-orange',
          bg: 'bg-neon-orange/10',
          glow: 'box-glow-orange',
        };
      case 'green':
        return {
          border: 'border-neon-green',
          text: 'text-neon-green',
          bg: 'bg-neon-green/10',
          glow: 'box-glow-green',
        };
      default:
        return {
          border: 'border-neon-cyan',
          text: 'text-neon-cyan',
          bg: 'bg-neon-cyan/10',
          glow: 'box-glow-cyan',
        };
    }
  };

  return (
    <section ref={sectionRef} className="py-32 px-4 sm:px-6 lg:px-8 relative">
      {/* Background decoration */}
      <div className="absolute inset-0 grid-pattern opacity-50" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <span className="pixel-font text-xs text-neon-orange tracking-widest uppercase mb-4 block">
            // PROCESS
          </span>
          <h2 className="orbitron text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
            HOW IT <span className="text-neon-cyan glow-cyan">WORKS</span>
          </h2>
          <p className="text-lg text-gray-400 font-mono max-w-2xl mx-auto">
            <span className="text-neon-green">&gt;</span> Three simple steps to discover your next obsession
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const colors = getColorClasses(step.color);
            return (
              <div
                key={step.number}
                className={`
                  transform transition-all duration-700
                  ${visibleSteps[index] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
                `}
              >
                <div className={`terminal-box rounded-lg overflow-hidden h-full group hover:${colors.glow} transition-all duration-300`}>
                  {/* Card Header */}
                  <div className={`px-6 py-4 border-b border-terminal-border flex items-center justify-between`}>
                    <span className={`orbitron text-3xl font-black ${colors.text}`}>
                      {step.number}
                    </span>
                    <div className={`w-12 h-12 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center ${colors.text}`}>
                      {step.icon}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6">
                    <h3 className={`orbitron text-2xl font-bold ${colors.text} mb-1`}>
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-500 font-mono mb-4 uppercase tracking-wider">
                      {step.subtitle}
                    </p>
                    <p className="text-gray-400 font-mono text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Progress indicator */}
                  <div className="px-6 pb-6">
                    <div className="h-1 progress-bar-retro rounded overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 delay-500 ${
                          visibleSteps[index] ? 'w-full' : 'w-0'
                        } ${step.color === 'cyan' ? 'progress-fill-cyan' : step.color === 'orange' ? 'progress-fill-orange' : 'progress-fill-green'}`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Connecting lines (desktop only) */}
        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 w-2/3 h-0.5 bg-terminal-border -z-10" style={{ marginTop: '2rem' }}>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-neon-cyan box-glow-cyan" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-neon-orange box-glow-orange" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-neon-green box-glow-green" />
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <a
            href="/profile"
            className="inline-flex items-center gap-3 btn-arcade rounded-lg py-4 px-10 text-lg"
          >
            <span>START ANALYSIS</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
