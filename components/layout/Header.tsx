'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchBar from './SearchBar';
import ProfileDropdown from './ProfileDropdown';
import MobileNav from './MobileNav';

interface HeaderProps {
  /** User data for profile dropdown */
  user?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  /** Sign out handler */
  onSignOut?: () => void;
}

// Navigation items - single source of truth
export const NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: string;
  badge?: string;
}> = [
  { href: '/discover', label: 'Discover', icon: 'compass' },
  { href: '/library', label: 'Library', icon: 'collection' },
  { href: '/homemade', label: 'Homemade', icon: 'heart', badge: 'NEW' },
];

export default function Header({ user, onSignOut }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't show header on certain pages (e.g., landing page might have custom header)
  // Add paths here if needed: if (pathname === '/') return null;

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-terminal-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo + Nav */}
            <div className="flex items-center gap-6">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-neon-cyan to-neon-orange flex items-center justify-center">
                  <span className="text-black font-bold text-sm">SR</span>
                </div>
                <span className="hidden sm:block orbitron text-lg font-bold text-white group-hover:text-neon-cyan transition-colors">
                  STEAM RECS
                </span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        relative flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-all
                        ${isActive
                          ? 'text-neon-cyan bg-neon-cyan/10'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }
                      `}
                    >
                      <NavIcon name={item.icon} />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] bg-neon-green/20 text-neon-green border border-neon-green/50 rounded font-mono">
                          {item.badge}
                        </span>
                      )}
                      {/* Active indicator */}
                      {isActive && (
                        <span className="absolute bottom-0 left-4 right-4 h-0.5 bg-neon-cyan rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right: Search + Profile */}
            <div className="flex items-center gap-3">
              {/* Search bar - hidden on mobile, shown on tablet+ */}
              <div className="hidden sm:block">
                <SearchBar
                  variant="header"
                  placeholder="Search games..."
                  userId={user?.id}
                />
              </div>

              {/* Profile dropdown */}
              <ProfileDropdown
                isLoggedIn={!!user}
                displayName={user?.displayName}
                avatarUrl={user?.avatarUrl}
                onSignOut={onSignOut}
              />

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile search bar - full width below header on small screens */}
        <div className="sm:hidden px-4 pb-3">
          <SearchBar
            variant="header"
            placeholder="Search games..."
            userId={user?.id}
          />
        </div>
      </header>

      {/* Mobile navigation drawer */}
      <MobileNav
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        user={user}
        onSignOut={onSignOut}
      />
    </>
  );
}

// Icon helper component
function NavIcon({ name }: { name: string }) {
  switch (name) {
    case 'compass':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      );
    case 'collection':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
    case 'heart':
      return (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    default:
      return null;
  }
}
