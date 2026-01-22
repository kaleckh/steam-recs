'use client';

import { useState } from 'react';
import { GameDetail } from '@/app/game/[appId]/page';

interface GameVideoSectionProps {
  game: GameDetail;
}

export default function GameVideoSection({ game }: GameVideoSectionProps) {
  const [activeTab, setActiveTab] = useState<'steam' | 'youtube'>('steam');
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);

  const steamVideos = game.movies || [];
  const screenshots = game.screenshots || [];

  // Combine screenshots as fallback if no videos
  const displayMedia = steamVideos.length > 0 ? steamVideos : screenshots;

  return (
    <div className="bg-[#16202d] rounded">
      {/* Tab Headers */}
      <div className="flex border-b border-[#2a475e]">
        <button
          onClick={() => setActiveTab('steam')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'steam'
              ? 'text-white border-b-2 border-white'
              : 'text-[#8f98a0] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            Steam Page
          </div>
        </button>
        <button
          onClick={() => setActiveTab('youtube')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'youtube'
              ? 'text-white border-b-2 border-white'
              : 'text-[#8f98a0] hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            YouTube Videos
          </div>
        </button>
      </div>

      {/* Main Video Player */}
      <div className="relative aspect-video bg-black">
        {activeTab === 'steam' && steamVideos.length > 0 ? (
          <video
            key={selectedVideoIndex}
            className="w-full h-full"
            controls
            autoPlay
            muted
            poster={steamVideos[selectedVideoIndex]?.thumbnail}
          >
            <source
              src={steamVideos[selectedVideoIndex]?.webm?.max || steamVideos[selectedVideoIndex]?.mp4?.max}
              type="video/mp4"
            />
          </video>
        ) : activeTab === 'steam' && screenshots.length > 0 ? (
          <img
            src={screenshots[selectedVideoIndex]?.path_full}
            alt={game.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#8f98a0]">
            <p>No videos available</p>
          </div>
        )}

        {/* Video counter and mute button */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
          <div className="bg-black/70 px-3 py-1 rounded text-white text-sm">
            {selectedVideoIndex + 1} / {displayMedia.length}
          </div>
        </div>
      </div>

      {/* Video Thumbnails */}
      {displayMedia.length > 0 && (
        <div className="p-4">
          <div className="flex gap-2 overflow-x-auto">
            {displayMedia.slice(0, 11).map((media, index) => (
              <button
                key={index}
                onClick={() => setSelectedVideoIndex(index)}
                className={`flex-shrink-0 relative rounded overflow-hidden transition-all ${
                  selectedVideoIndex === index
                    ? 'ring-2 ring-white'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={'thumbnail' in media ? media.thumbnail : media.path_thumbnail}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-32 h-18 object-cover"
                />
                {'webm' in media || 'mp4' in media ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black/60 rounded-full p-2">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                      </svg>
                    </div>
                  </div>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
