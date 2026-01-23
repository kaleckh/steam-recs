'use client';

import { useEffect, useState } from 'react';

interface LoadingStateProps {
  steamId?: string;
}

const LOADING_MESSAGES = [
  { text: 'Establishing connection to Steam API...', icon: 'CONN' },
  { text: 'Fetching game library data...', icon: 'SYNC' },
  { text: 'Parsing playtime metrics...', icon: 'PROC' },
  { text: 'Calculating preference weights...', icon: 'CALC' },
  { text: 'Generating vector embeddings...', icon: 'VECT' },
  { text: 'Running similarity algorithms...', icon: 'ALGO' },
];

export default function LoadingState({ steamId }: LoadingStateProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [bootLines, setBootLines] = useState<string[]>([]);

  useEffect(() => {
    // Boot sequence messages
    const bootMessages = [
      'STEAM_REC v2.4.1 INITIALIZING...',
      'Loading neural network modules...',
      'Vector database connected',
      'Embedding model: xenova/all-MiniLM-L6-v2',
      `Target profile: ${steamId || 'UNKNOWN'}`,
      '----------------------------------------',
    ];

    // Add boot lines one by one
    bootMessages.forEach((msg, i) => {
      setTimeout(() => {
        setBootLines(prev => [...prev, msg]);
      }, i * 400);
    });

    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 3;
      });
    }, 500);

    // Cycle through messages
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [steamId]);

  return (
    <div className="w-full max-w-2xl mx-auto animate-slide-up">
      <div className="terminal-box rounded-lg overflow-hidden">
        {/* Terminal Header */}
        <div className="terminal-header">
          <span className="text-gray-400 text-sm font-mono ml-16">PROFILE_ANALYZER.exe</span>
        </div>

        {/* Terminal Body */}
        <div className="p-8 font-mono">
          {/* Boot Sequence */}
          <div className="mb-6 space-y-1 text-sm">
            {bootLines.map((line, i) => (
              <p key={i} className={`${line.startsWith('---') ? 'text-terminal-border' : 'text-gray-500'}`}>
                {!line.startsWith('---') && <span className="text-neon-green mr-2">[OK]</span>}
                {line}
              </p>
            ))}
          </div>

          {/* Current Operation */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-12 h-12">
                {/* Outer ring */}
                <div className="absolute inset-0 border-2 border-neon-cyan/20 rounded-full" />
                {/* Spinning ring */}
                <div className="absolute inset-0 border-2 border-transparent border-t-neon-cyan rounded-full animate-spin" />
                {/* Center icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-neon-cyan text-xs font-bold">
                    {LOADING_MESSAGES[messageIndex].icon}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-white text-lg font-semibold orbitron">
                  PROCESSING
                </p>
                <p className="text-neon-cyan text-sm">
                  {LOADING_MESSAGES[messageIndex].text}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative">
              <div className="h-3 progress-bar-retro rounded overflow-hidden">
                <div
                  className="h-full progress-fill-cyan transition-all duration-500 relative overflow-hidden"
                  style={{ width: `${progress}%` }}
                >
                  {/* Animated stripes */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(0,0,0,0.3) 10px, rgba(0,0,0,0.3) 20px)',
                      animation: 'stripe-scroll 1s linear infinite',
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>0%</span>
                <span className="text-neon-cyan">{Math.round(progress)}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Stats Display */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-terminal-dark border border-terminal-border rounded-lg p-4">
              <div className="text-2xl font-bold text-neon-green orbitron animate-pulse">
                ---
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Games</div>
            </div>
            <div className="bg-terminal-dark border border-terminal-border rounded-lg p-4">
              <div className="text-2xl font-bold text-neon-magenta orbitron animate-pulse">
                ---
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Hours</div>
            </div>
            <div className="bg-terminal-dark border border-terminal-border rounded-lg p-4">
              <div className="text-2xl font-bold text-neon-cyan orbitron animate-pulse">
                ---
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">Matches</div>
            </div>
          </div>

          {/* Tip */}
          <div className="mt-6 p-4 bg-terminal-dark border border-neon-yellow/20 rounded-lg">
            <p className="text-sm text-neon-yellow flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Analysis takes 30-60 seconds depending on library size
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes stripe-scroll {
          from { background-position: 0 0; }
          to { background-position: 40px 0; }
        }
      `}</style>
    </div>
  );
}
