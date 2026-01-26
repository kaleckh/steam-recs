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
    <div className="terminal-box rounded-lg overflow-hidden">
      {/* Terminal Header */}
      <div className="terminal-header">
        <span className="text-gray-400 text-sm font-mono ml-16">MEDIA_EXPLORER.exe</span>
      </div>

      {/* Tab Headers */}
      <div className="border-b border-terminal-border">
        <div className="flex gap-1 p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-lg font-mono text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan'
                  : 'text-gray-400 hover:text-white hover:bg-terminal-light border border-transparent'
              }`}
            >
              {tab.label.toUpperCase()}
              {tab.count !== undefined && ` (${tab.count})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'videos' && <VideosTab game={game} autoPlay />}
        {activeTab === 'screenshots' && <ScreenshotsTab game={game} />}
        {activeTab === 'stats' && <StatsTab game={game} />}
      </div>
    </div>
  );
}
