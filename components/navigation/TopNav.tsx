'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import UpgradeModal from '@/components/premium/UpgradeModal';

export type ProfileTab = 'for-you' | 'ai-search' | 'analytics' | 'library';

const TABS: { id: ProfileTab; label: string; isPro?: boolean }[] = [
  { id: 'for-you', label: 'FOR YOU' },
  { id: 'ai-search', label: 'AI SEARCH' },
  { id: 'analytics', label: 'ANALYTICS', isPro: true },
  { id: 'library', label: 'LIBRARY' },
];

export default function TopNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'for-you';
  const isProfilePage = pathname === '/profile';

  const [userId, setUserId] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(true); // Default true to avoid flash
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  useEffect(() => {
    const storedUserId = localStorage.getItem('steamRecUserId');
    setUserId(storedUserId);

    if (storedUserId) {
      fetch(`/api/user/subscription?userId=${storedUserId}`)
        .then(res => res.json())
        .then(data => {
          setIsPremium(data.isPremium || false);
        })
        .catch(() => setIsPremium(false));
    } else {
      setIsPremium(false);
    }
  }, []);

  return (
    <nav className="bg-[#0a0a0f] border-b border-terminal-border sticky top-0 z-50">
      <div className="max-w-[1800px] mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="text-neon-cyan font-bold text-xl hover:text-white transition-colors whitespace-nowrap orbitron">
            STEAM RECS
          </Link>

          {/* Profile Tabs */}
          <div className="flex items-center gap-1">
            {TABS.map((tab) => {
              const isActive = isProfilePage && currentTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={`/profile?tab=${tab.id}`}
                  className={`px-4 py-2 rounded font-mono text-sm transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan'
                      : 'text-gray-400 hover:text-white hover:bg-terminal-light border border-transparent'
                  }`}
                >
                  {tab.label}
                  {tab.isPro && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-neon-orange/20 text-neon-orange border border-neon-orange/50 rounded">
                      PRO
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Login/Upgrade Button */}
          <div className="w-[140px] flex justify-end">
            {!userId ? (
              <Link
                href="/login"
                className="px-4 py-2 rounded font-mono text-sm bg-gradient-to-r from-neon-cyan/20 to-neon-green/20 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                LOGIN
              </Link>
            ) : !isPremium ? (
              <button
                onClick={() => setIsUpgradeModalOpen(true)}
                className="px-4 py-2 rounded font-mono text-sm bg-gradient-to-r from-neon-orange/20 to-neon-cyan/20 border border-neon-orange text-neon-orange hover:bg-neon-orange hover:text-black transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                UPGRADE
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {userId && (
        <UpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          userId={userId}
        />
      )}
    </nav>
  );
}
