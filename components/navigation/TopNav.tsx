'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import UpgradeModal from '@/components/premium/UpgradeModal';
import { useAuth } from '@/contexts/AuthContext';

// New navigation structure
const NAV_ITEMS = [
  { id: 'discover', label: 'DISCOVER', href: '/discover' },
  { id: 'library', label: 'LIBRARY', href: '/library' },
  { id: 'homemade', label: 'HOMEMADE', href: '/homemade', isNew: true },
];

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();

  const { user, profile, isPremium, isLoading, signOut } = useAuth();
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    await signOut();
    router.push('/');
  };

  return (
    <nav className="bg-[#0a0a0f] border-b border-terminal-border sticky top-0 z-50">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="text-neon-cyan font-bold text-lg sm:text-xl hover:text-white transition-colors whitespace-nowrap orbitron">
            STEAM RECS
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Search Link - Prominent */}
            <Link
              href="/search"
              className={`px-4 py-2 rounded font-mono text-sm transition-all flex items-center gap-2 ${
                pathname === '/search'
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan'
                  : 'text-gray-400 hover:text-white hover:bg-terminal-light border border-transparent'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              AI SEARCH
            </Link>

            <div className="w-px h-6 bg-terminal-border mx-2" />

            {/* Main Nav Items */}
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`px-4 py-2 rounded font-mono text-sm transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-neon-orange/20 text-neon-orange border border-neon-orange'
                      : 'text-gray-400 hover:text-white hover:bg-terminal-light border border-transparent'
                  }`}
                >
                  {item.label}
                  {item.isNew && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-neon-green/20 text-neon-green border border-neon-green/50 rounded animate-pulse">
                      NEW
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Side - Auth + Mobile Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Auth Section */}
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
            ) : !user ? (
              <Link
                href="/login"
                className="px-3 sm:px-4 py-2 rounded font-mono text-xs sm:text-sm bg-gradient-to-r from-neon-cyan/20 to-neon-green/20 border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                LOGIN
              </Link>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Upgrade Button - Hidden on smallest screens */}
                {!isPremium && (
                  <button
                    onClick={() => setIsUpgradeModalOpen(true)}
                    className="hidden sm:flex px-3 py-1.5 rounded font-mono text-xs bg-gradient-to-r from-neon-orange/20 to-neon-cyan/20 border border-neon-orange text-neon-orange hover:bg-neon-orange hover:text-black transition-all items-center gap-1.5"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    PRO
                  </button>
                )}

                {/* User Menu */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded font-mono text-xs text-gray-400 hover:text-white hover:bg-terminal-light transition-all border border-transparent hover:border-terminal-border"
                  >
                    <div className="w-6 h-6 rounded-full bg-neon-cyan/20 border border-neon-cyan/50 flex items-center justify-center">
                      <span className="text-neon-cyan text-xs font-bold">
                        {user.email?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <svg className={`w-3 h-3 hidden sm:block transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
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
                          href="/profile?tab=analytics"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-terminal-light font-mono"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Analytics
                          {isPremium ? null : (
                            <span className="ml-auto px-1 py-0.5 text-[8px] bg-neon-orange/20 text-neon-orange border border-neon-orange/50 rounded">
                              PRO
                            </span>
                          )}
                        </Link>
                        <Link
                          href="/profile"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-terminal-light font-mono"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Settings
                        </Link>
                        <div className="border-t border-terminal-border my-1" />
                        <Link
                          href="/developers"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-terminal-light font-mono"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                          For Developers
                        </Link>
                        {!profile?.steamId && (
                          <Link
                            href="/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-neon-cyan hover:bg-terminal-light font-mono"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            Link Steam Account
                          </Link>
                        )}
                        {/* Mobile: Upgrade option */}
                        {!isPremium && (
                          <button
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              setIsUpgradeModalOpen(true);
                            }}
                            className="sm:hidden w-full text-left px-4 py-2 text-sm text-neon-orange hover:bg-terminal-light font-mono flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Upgrade to PRO
                          </button>
                        )}
                      </div>

                      {/* Sign Out */}
                      <div className="border-t border-terminal-border py-1">
                        <button
                          onClick={handleSignOut}
                          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 font-mono flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-terminal-light rounded transition-all"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-2 border-t border-terminal-border pt-4">
            {/* AI Search Link - Full Width, Prominent */}
            <Link
              href="/search"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`mb-3 px-3 py-2.5 rounded font-mono text-sm text-center transition-all flex items-center justify-center gap-2 ${
                pathname === '/search'
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan'
                  : 'text-gray-400 hover:text-white bg-terminal-light border border-terminal-border'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              AI SEARCH
            </Link>

            <div className="grid grid-cols-3 gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-3 py-2.5 rounded font-mono text-xs text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      isActive
                        ? 'bg-neon-orange/20 text-neon-orange border border-neon-orange'
                        : 'text-gray-400 hover:text-white bg-terminal-light border border-terminal-border'
                    }`}
                  >
                    {item.label}
                    {item.isNew && (
                      <span className="px-1 py-0.5 text-[8px] bg-neon-green/20 text-neon-green border border-neon-green/50 rounded animate-pulse">
                        NEW
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
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
