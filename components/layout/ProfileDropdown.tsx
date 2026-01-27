'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface ProfileDropdownProps {
  /** User's Steam avatar URL */
  avatarUrl?: string;
  /** User's display name */
  displayName?: string;
  /** Whether user is logged in */
  isLoggedIn?: boolean;
  /** Sign out handler */
  onSignOut?: () => void;
}

export default function ProfileDropdown({
  avatarUrl,
  displayName = 'Player',
  isLoggedIn = false,
  onSignOut,
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Not logged in - show login button
  if (!isLoggedIn) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-mono text-sm rounded-lg hover:bg-neon-cyan hover:text-black transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        <span className="hidden sm:inline">SIGN IN</span>
      </Link>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 p-1.5 rounded-lg border transition-all
          ${isOpen
            ? 'border-neon-cyan bg-neon-cyan/10'
            : 'border-transparent hover:border-terminal-border'
          }
        `}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-8 h-8 rounded-lg border border-terminal-border"
          />
        ) : (
          <div className="w-8 h-8 rounded-lg bg-terminal-dark border border-terminal-border flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        )}

        {/* Dropdown arrow */}
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right">
          {/* Terminal-style dropdown */}
          <div className="terminal-box rounded-lg overflow-hidden shadow-xl">
            {/* Header with user info */}
            <div className="px-4 py-3 border-b border-terminal-border">
              <p className="text-sm font-mono text-white truncate">{displayName}</p>
              <p className="text-xs font-mono text-gray-500">Steam Account</p>
            </div>

            {/* Menu items */}
            <div className="py-2">
              <DropdownItem
                href="/profile?tab=analytics"
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                }
                label="Analytics"
                onClick={() => setIsOpen(false)}
              />
              <DropdownItem
                href="/profile?tab=settings"
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                }
                secondIcon={
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                }
                label="Settings"
                onClick={() => setIsOpen(false)}
              />

              <div className="my-2 border-t border-terminal-border" />

              <DropdownItem
                href="/developers"
                icon={
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                }
                label="For Developers"
                badge="B2B"
                onClick={() => setIsOpen(false)}
              />

              <div className="my-2 border-t border-terminal-border" />

              {/* Sign out */}
              <button
                onClick={() => {
                  setIsOpen(false);
                  onSignOut?.();
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-left text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-mono text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for dropdown items
function DropdownItem({
  href,
  icon,
  secondIcon,
  label,
  badge,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  secondIcon?: React.ReactNode;
  label: string;
  badge?: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-neon-cyan hover:bg-neon-cyan/5 transition-colors"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {icon}
        {secondIcon}
      </svg>
      <span className="font-mono text-sm flex-1">{label}</span>
      {badge && (
        <span className="px-1.5 py-0.5 text-[10px] bg-neon-orange/20 text-neon-orange border border-neon-orange/50 rounded font-mono">
          {badge}
        </span>
      )}
    </Link>
  );
}
