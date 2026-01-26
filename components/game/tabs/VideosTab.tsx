'use client';

import { useState, useEffect, useRef } from 'react';
import { GameDetail } from '@/app/game/[appId]/page';

interface VideosTabProps {
  game: GameDetail;
  autoPlay?: boolean;
}

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
}

interface SteamMovie {
  id: number;
  name: string;
  thumbnail: string;
  webm?: { 480: string; max: string };
  mp4?: { 480: string; max: string };
}

export default function VideosTab({ game, autoPlay = false }: VideosTabProps) {
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedSteamVideo, setSelectedSteamVideo] = useState<SteamMovie | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const steamTrailers = game.movies || [];

  // Auto-play first Steam video on mount
  useEffect(() => {
    if (autoPlay && steamTrailers.length > 0 && !selectedSteamVideo) {
      setSelectedSteamVideo(steamTrailers[0]);
    }
  }, [autoPlay, steamTrailers, selectedSteamVideo]);

  useEffect(() => {
    async function fetchYouTubeVideos() {
      try {
        const query = `${game.name} gameplay`;
        const response = await fetch(`/api/youtube?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.success && data.videos) {
          setYoutubeVideos(data.videos);
        }
      } catch (error) {
        console.error('Failed to fetch YouTube videos:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchYouTubeVideos();
  }, [game.name]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-neon-cyan/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-neon-cyan rounded-full animate-spin" />
          </div>
          <p className="text-neon-cyan font-mono text-sm">LOADING VIDEOS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Steam Video Player */}
      {selectedSteamVideo && (
        <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl mb-8 bg-black">
          <video
            ref={videoRef}
            src={selectedSteamVideo.mp4?.max || selectedSteamVideo.mp4?.['480'] || selectedSteamVideo.webm?.max || selectedSteamVideo.webm?.['480']}
            controls
            autoPlay
            className="w-full h-full"
          />
          <button
            onClick={() => setSelectedSteamVideo(null)}
            className="absolute top-4 right-4 bg-black/80 hover:bg-black text-white px-4 py-2 rounded-lg transition-colors z-10"
          >
            Close
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 pointer-events-none">
            <p className="text-white font-medium">{selectedSteamVideo.name}</p>
          </div>
        </div>
      )}

      {/* YouTube Video Player */}
      {selectedVideo && !selectedSteamVideo && (
        <div className="relative aspect-video rounded-lg overflow-hidden shadow-2xl mb-8">
          <iframe
            src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`}
            title="Video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
          <button
            onClick={() => setSelectedVideo(null)}
            className="absolute top-4 right-4 bg-black/80 hover:bg-black text-white px-4 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {/* Steam Official Trailers */}
      {steamTrailers.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-4 orbitron flex items-center gap-2">
            <span className="text-neon-green">&gt;</span> OFFICIAL TRAILERS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {steamTrailers.map((trailer) => (
              <div
                key={trailer.id}
                onClick={() => {
                  setSelectedVideo(null);
                  setSelectedSteamVideo(trailer);
                }}
                className={`group relative cursor-pointer rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 ${
                  selectedSteamVideo?.id === trailer.id ? 'ring-2 ring-neon-cyan' : ''
                }`}
              >
                <img
                  src={trailer.thumbnail}
                  alt={trailer.name}
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-white opacity-80 group-hover:opacity-100 transition-opacity"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                  <p className="text-white font-medium text-sm truncate">{trailer.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* YouTube Videos */}
      {youtubeVideos.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-4 orbitron flex items-center gap-2">
            <span className="text-neon-orange">&gt;</span> COMMUNITY VIDEOS
            <span className="px-2 py-0.5 text-[10px] font-mono bg-red-500/20 text-red-400 border border-red-500/50 rounded">
              YOUTUBE
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {youtubeVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => {
                  setSelectedSteamVideo(null);
                  setSelectedVideo(video.id);
                }}
                className="group relative cursor-pointer rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-all flex items-center justify-center">
                  <svg
                    className="w-16 h-16 text-white opacity-80 group-hover:opacity-100 transition-opacity"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
                  <p className="text-white font-medium text-sm line-clamp-2">{video.title}</p>
                  <p className="text-gray-300 text-xs mt-1">{video.channelTitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {steamTrailers.length === 0 && youtubeVideos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 font-mono">[INFO] No videos available for this game</p>
        </div>
      )}
    </div>
  );
}
