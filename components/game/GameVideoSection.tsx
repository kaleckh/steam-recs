'use client';

import { useState } from 'react';
import { GameDetail } from '@/app/game/[appId]/page';

interface GameVideoSectionProps {
  game: GameDetail;
}

export default function GameVideoSection({ game }: GameVideoSectionProps) {
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);

  const steamVideos = game.movies || [];
  const screenshots = game.screenshots || [];

  // Combine videos and screenshots
  const allMedia = [
    ...steamVideos.map(v => ({ ...v, type: 'video' as const })),
    ...screenshots.map(s => ({ ...s, type: 'screenshot' as const })),
  ];

  const currentMedia = allMedia[selectedMediaIndex];

  return (
    <div className="terminal-box rounded-lg overflow-hidden">
      {/* Terminal Header */}
      <div className="terminal-header">
        <span className="text-gray-400 text-sm font-mono ml-16">MEDIA_VIEWER.exe</span>
      </div>

      {/* Main Video/Image Player */}
      <div className="relative aspect-video bg-black">
        {currentMedia?.type === 'video' ? (
          <video
            key={selectedMediaIndex}
            className="w-full h-full"
            controls
            autoPlay
            muted
            poster={(currentMedia as any).thumbnail}
          >
            <source
              src={(currentMedia as any).webm?.max || (currentMedia as any).mp4?.max}
              type="video/mp4"
            />
          </video>
        ) : currentMedia?.type === 'screenshot' ? (
          <img
            src={(currentMedia as any).path_full}
            alt={game.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 font-mono">
            <p>NO MEDIA AVAILABLE</p>
          </div>
        )}

        {/* Media counter */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="bg-terminal-dark/90 px-3 py-1 rounded text-neon-cyan text-sm font-mono border border-terminal-border">
            {selectedMediaIndex + 1} / {allMedia.length}
          </div>
        </div>
      </div>

      {/* Thumbnails */}
      {allMedia.length > 0 && (
        <div className="p-4 bg-terminal-dark border-t border-terminal-border">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {allMedia.slice(0, 12).map((media, index) => (
              <button
                key={index}
                onClick={() => setSelectedMediaIndex(index)}
                className={`flex-shrink-0 relative rounded overflow-hidden transition-all border-2 ${
                  selectedMediaIndex === index
                    ? 'border-neon-cyan box-glow-cyan'
                    : 'border-terminal-border opacity-60 hover:opacity-100 hover:border-gray-500'
                }`}
              >
                <img
                  src={media.type === 'video' ? (media as any).thumbnail : (media as any).path_thumbnail}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-28 h-16 object-cover"
                />
                {media.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-terminal-dark/80 rounded-full p-1.5 border border-neon-cyan/50">
                      <svg className="w-3 h-3 text-neon-cyan" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
