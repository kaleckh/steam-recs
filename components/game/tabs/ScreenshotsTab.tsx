'use client';

import { useState } from 'react';
import { GameDetail } from '@/app/game/[appId]/page';

interface ScreenshotsTabProps {
  game: GameDetail;
}

export default function ScreenshotsTab({ game }: ScreenshotsTabProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const screenshots = game.screenshots || [];

  if (screenshots.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No screenshots available for this game.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 text-4xl font-light"
          >
            ×
          </button>
          <img
            src={selectedImage}
            alt="Screenshot"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Screenshots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {screenshots.map((screenshot, index) => (
          <div
            key={screenshot.id || index}
            className="group relative cursor-pointer rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            onClick={() => setSelectedImage(screenshot.path_full)}
          >
            <img
              src={screenshot.path_thumbnail || screenshot.path_full}
              alt={`Screenshot ${index + 1}`}
              className="w-full aspect-video object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
              <svg
                className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
