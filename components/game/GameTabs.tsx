'use client';

import { useState } from 'react';
import { GameDetail } from '@/app/game/[appId]/page';
import VideosTab from './tabs/VideosTab';
import ScreenshotsTab from './tabs/ScreenshotsTab';
import StatsTab from './tabs/StatsTab';

interface GameTabsProps {
  game: GameDetail;
}

type Tab = 'videos' | 'screenshots' | 'stats';

export default function GameTabs({ game }: GameTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('videos');

  const tabs: Array<{ id: Tab; label: string; count?: number }> = [
    { id: 'videos', label: 'Videos' },
    { id: 'screenshots', label: 'Screenshots', count: game.screenshots?.length || 0 },
    { id: 'stats', label: 'Stats & Info' },
  ];

  return (
    <div className="bg-gray-800/50 rounded-xl shadow-xl border border-gray-700">
      {/* Tab Headers */}
      <div className="border-b border-gray-700">
        <div className="flex space-x-1 p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && ` (${tab.count})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'videos' && <VideosTab game={game} />}
        {activeTab === 'screenshots' && <ScreenshotsTab game={game} />}
        {activeTab === 'stats' && <StatsTab game={game} />}
      </div>
    </div>
  );
}
