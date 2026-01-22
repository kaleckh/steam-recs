'use client';

import { useState, useEffect } from 'react';
import { GameDetail } from '@/app/game/[appId]/page';

interface VideosTabProps {
  game: GameDetail;
}

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
}

export default function VideosTab({ game }: VideosTabProps) {
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    // Fetch YouTube videos for this game
    async function fetchYouTubeVideos() {
      // Skip if no API key configured
      if (!process.env.NEXT_PUBLIC_YOUTUBE_API_KEY) {
        console.log('YouTube API key not configured - showing Steam trailers only');
        setIsLoading(false);
        return;
      }

      try {
        const query = encodeURIComponent(`${game.name} gameplay`);
        const response = await fetch(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=12&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
        );

        if (response.ok) {
          const data = await response.json();
          const videos: YouTubeVideo[] = data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
          }));
          setYoutubeVideos(videos);
        }
      } catch (error) {
        console.error('Failed to fetch YouTube videos:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchYouTubeVideos();
  }, [game.name]);

  // Steam trailers first
  const steamTrailers = game.movies || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Selected Video Player */}
      {selectedVideo && (
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
          <h3 className="text-2xl font-bold text-white mb-4">Official Trailers</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {steamTrailers.map((trailer) => (
              <div
                key={trailer.id}
                className="group relative cursor-pointer rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
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
          <h3 className="text-2xl font-bold text-white mb-4">
            Community Videos & Gameplay
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {youtubeVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => setSelectedVideo(video.id)}
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
          <p className="text-gray-400 text-lg">No videos available for this game.</p>
        </div>
      )}
    </div>
  );
}
