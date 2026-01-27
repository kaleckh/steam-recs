'use client';

import { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { GameDetail } from '@/app/game/[appId]/page';

interface GameVideoSectionProps {
  game: GameDetail;
}

type TabType = 'steam' | 'youtube';

export default function GameVideoSection({ game }: GameVideoSectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('steam');
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [youtubeVideos, setYoutubeVideos] = useState<Array<{ id: string; title: string; thumbnail: string }>>([]);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [isLoadingYoutube, setIsLoadingYoutube] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const steamVideos = game.movies || [];
  const screenshots = game.screenshots || [];

  // Combine videos and screenshots for Steam tab
  const allSteamMedia = [
    ...steamVideos.map(v => ({ ...v, type: 'video' as const })),
    ...screenshots.map(s => ({ ...s, type: 'screenshot' as const })),
  ];

  const currentMedia = allSteamMedia[selectedMediaIndex];

  // Handle HLS video playback for Steam videos
  useEffect(() => {
    if (activeTab !== 'steam' || currentMedia?.type !== 'video' || !videoRef.current) return;

    const video = videoRef.current;
    const hlsUrl = (currentMedia as any).hls_h264;

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (hlsUrl) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
        });
        hlsRef.current = hls;

        hls.loadSource(hlsUrl);
        hls.attachMedia(video);

        // Autoplay when manifest is ready
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {
            // Autoplay blocked - user will need to click
          });
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            console.error('HLS fatal error:', data);
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = hlsUrl;
        video.play().catch(() => {});
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeTab, currentMedia, selectedMediaIndex]);

  // Fetch YouTube videos when tab is clicked
  const fetchYoutubeVideos = async () => {
    if (youtubeVideos.length > 0 || isLoadingYoutube) return;

    setIsLoadingYoutube(true);
    try {
      const response = await fetch(`/api/youtube?q=${encodeURIComponent(game.name + ' game trailer')}`);
      if (response.ok) {
        const data = await response.json();
        setYoutubeVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Failed to fetch YouTube videos:', error);
    } finally {
      setIsLoadingYoutube(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'youtube') {
      fetchYoutubeVideos();
    }
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => handleTabChange('steam')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-all ${
            activeTab === 'steam'
              ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan'
              : 'bg-terminal-dark text-gray-500 border border-terminal-border hover:text-gray-300 hover:border-gray-500'
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
            <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5"/>
            <ellipse cx="12" cy="12" rx="4" ry="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
          Steam Page
        </button>
        <button
          onClick={() => handleTabChange('youtube')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-all ${
            activeTab === 'youtube'
              ? 'bg-red-500/20 text-red-500 border border-red-500'
              : 'bg-terminal-dark text-gray-500 border border-terminal-border hover:text-gray-300 hover:border-gray-500'
          }`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          YouTube Videos
        </button>
      </div>

      {/* Content */}
      {activeTab === 'steam' ? (
        <div className="space-y-3">
          {/* Main display */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {currentMedia?.type === 'video' ? (
              <video
                ref={videoRef}
                key={selectedMediaIndex}
                className="w-full h-full"
                controls
                autoPlay
                muted
                playsInline
                poster={(currentMedia as any).thumbnail}
              />
            ) : currentMedia?.type === 'screenshot' ? (
              <img
                src={(currentMedia as any).path_full}
                alt={game.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 font-mono">
                <p>No media available</p>
              </div>
            )}
          </div>

          {/* Thumbnail row */}
          {allSteamMedia.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {allSteamMedia.map((media, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedMediaIndex(index)}
                  className={`flex-shrink-0 relative rounded-lg overflow-hidden transition-all border-2 ${
                    selectedMediaIndex === index
                      ? 'border-neon-cyan shadow-lg shadow-neon-cyan/20'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={media.type === 'video' ? (media as any).thumbnail : (media as any).path_thumbnail}
                    alt={`Media ${index + 1}`}
                    className="w-28 h-16 object-cover"
                  />
                  {media.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black/60 rounded-full p-1">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        // YouTube tab content - Grid layout
        <div>
          {isLoadingYoutube ? (
            <div className="flex justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 border-4 border-red-500/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-transparent border-t-red-500 rounded-full animate-spin" />
                </div>
                <p className="text-gray-400 font-mono text-sm">Loading YouTube videos...</p>
              </div>
            </div>
          ) : youtubeVideos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {youtubeVideos.map((video) => (
                <div key={video.id} className="group">
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-terminal-border hover:border-red-500/50 transition-all">
                    {playingVideoId === video.id ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <button
                        onClick={() => setPlayingVideoId(video.id)}
                        className="w-full h-full relative"
                      >
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-all">
                          <div className="bg-red-600 rounded-full p-3 group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
                            </svg>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-gray-300 font-mono line-clamp-2 group-hover:text-white transition-colors">
                    {video.title}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex justify-center py-12">
              <p className="text-gray-500 font-mono">No YouTube videos found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
