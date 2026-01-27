'use client';

import { ReactNode } from 'react';
import Header from './Header';

interface AppLayoutProps {
  children: ReactNode;
  /** User data - TODO: wire up from auth context */
  user?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
  };
  /** Hide header (for landing page, etc.) */
  hideHeader?: boolean;
  /** Sign out handler - TODO: wire up actual sign out */
  onSignOut?: () => void;
}

/**
 * Main application layout wrapper
 *
 * Usage:
 * ```tsx
 * <AppLayout user={currentUser}>
 *   <YourPageContent />
 * </AppLayout>
 * ```
 *
 * TODO: Wire up the following:
 * 1. Get user from auth context/session
 * 2. Implement onSignOut to clear session and redirect
 * 3. Consider using this in app/layout.tsx for global header
 */
export default function AppLayout({
  children,
  user,
  hideHeader = false,
  onSignOut,
}: AppLayoutProps) {
  // TODO: Get user from auth context
  // const { user, signOut } = useAuth();

  const handleSignOut = () => {
    // TODO: Implement actual sign out
    // - Clear session/cookies
    // - Redirect to home or login
    console.log('Sign out clicked');
    onSignOut?.();
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] grid-pattern relative">
      {/* CRT Effects - subtle scan lines */}
      <div className="crt-scanlines" />
      <div className="crt-vignette" />

      {/* Header */}
      {!hideHeader && (
        <Header
          user={user}
          onSignOut={handleSignOut}
        />
      )}

      {/* Main content */}
      <main className="relative z-10">
        {children}
      </main>
    </div>
  );
}

/**
 * Export barrel for layout components
 */
export { default as Header } from './Header';
export { default as SearchBar } from './SearchBar';
export { default as ProfileDropdown } from './ProfileDropdown';
export { default as MobileNav } from './MobileNav';
