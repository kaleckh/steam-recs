'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import UpgradeModal from '@/components/premium/UpgradeModal';
import { useAuth } from '@/contexts/AuthContext';

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
  const router = useRouter();
  const currentTab = searchParams.get('tab') || 'for-you';
  const isProfilePage = pathname === '/profile';

  const { user, profile, isPremium, isLoading, signOut } = useAuth();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

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

          {/* Auth Section */}
          <div className="w-[180px] flex justify-end">
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
            ) : !user ? (
              <Link
                href="/login"
                className="px-4 py-2 rounded font-mono text-sm bg-gradient-to-r from-neon-cyan/20 to-neon-green/20 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                LOGIN
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                {/* Upgrade Button (if not premium) */}
                {!isPremium && (
                  <button
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="px-3 py-1.5 rounded font-mono text-xs bg-gradient-to-r from-neon-orange/20 to-neon-cyan/20 border border-neon-orange text-neon-orange hover:bg-neon-orange hover:text-black transition-all flex items-center gap-1.5"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    PRO
                  </button>
                )}

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded font-mono text-xs text-gray-400 hover:text-white hover:bg-terminal-light transition-all border border-transparent hover:border-terminal-border"
                  >
                    <div className="w-6 h-6 rounded-full bg-neon-cyan/20 border border-neon-cyan/50 flex items-center justify-center">
                      <span className="text-neon-cyan text-xs font-bold">
                        {user.email?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <svg className={`w-3 h-3 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 rounded-lg border border-terminal-border bg-[#0a0a0f] shadow-xl z-50 overflow-hidden">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-terminal-border">
                          <p className="text-xs text-gray-500 font-mono">Signed in as</p>
                          <p className="text-sm text-white font-mono truncate">{user.email}</p>
                          {profile?.steamId && (
                            <p className="text-xs text-neon-green font-mono mt-1 flex items-center gap-1">
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385l3.75-5.355c-.09-.015-.18-.015-.27-.03-2.31-.36-3.9-2.535-3.555-4.845.345-2.31 2.52-3.9 4.83-3.555 2.31.345 3.9 2.52 3.555 4.83-.255 1.71-1.47 3.03-3.045 3.48l2.625 3.75C21.165 19.935 24 16.305 24 12c0-6.63-5.37-12-12-12z"/>
                              </svg>
                              Steam linked
                            </p>
                          )}
                          {isPremium && (
                            <span className="inline-block mt-2 px-2 py-0.5 text-[10px] bg-neon-orange/20 text-neon-orange border border-neon-orange/50 rounded">
                              PRO
                            </span>
                          )}
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          <Link
                            href="/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-terminal-light font-mono"
                          >
                            My Profile
                          </Link>
                          {!profile?.steamId && (
                            <Link
                              href="/profile"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="block px-4 py-2 text-sm text-neon-cyan hover:bg-terminal-light font-mono"
                            >
                              Link Steam Account
                            </Link>
                          )}
                        </div>

                        {/* Sign Out */}
                        <div className="border-t border-terminal-border py-1">
                          <button
                            onClick={handleSignOut}
                            className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 font-mono"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {profile?.id && (
        <UpgradeModal
          isOpen={isUpgradeModalOpen}
          onClose={() => setIsUpgradeModalOpen(false)}
          userId={profile.id}
        />
      )}
    </nav>
  );
}
