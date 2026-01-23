interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

export default function Footer() {
  const policyLinks: FooterLink[] = [
    { label: 'About', href: '/about' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Contact', href: '/contact' }
  ];

  const socialLinks: FooterLink[] = [
    {
      label: 'Discord',
      href: 'https://discord.gg/steamrecs',
      external: true
    },
    {
      label: 'X (Twitter)',
      href: 'https://x.com/steamrecs',
      external: true
    }
  ];

  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="relative py-16 px-4 sm:px-6 lg:px-8 border-t border-terminal-border"
      role="contentinfo"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-terminal-dark" />
      <div className="absolute inset-0 grid-pattern opacity-30" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand Section */}
          <div>
            <h3 className="orbitron text-xl font-bold text-neon-cyan mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              STEAMRECS.IO
            </h3>
            <p className="text-sm text-gray-500 font-mono leading-relaxed">
              <span className="text-neon-green">&gt;</span> Steam game recommendation engine for PC gamers.
              Discover personalized suggestions, hidden gems, and find your next favorite from 147,000+ games.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="orbitron text-sm font-bold text-white uppercase tracking-wider mb-4">
              NAVIGATION
            </h3>
            <ul className="space-y-3 font-mono">
              {policyLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-gray-500 hover:text-neon-cyan transition-colors flex items-center gap-2 group"
                    aria-label={link.label}
                  >
                    <span className="text-terminal-border group-hover:text-neon-cyan transition-colors">
                      &gt;
                    </span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h3 className="orbitron text-sm font-bold text-white uppercase tracking-wider mb-4">
              COMMUNITY
            </h3>
            <div className="flex gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="group w-12 h-12 terminal-box rounded-lg flex items-center justify-center border border-terminal-border hover:border-neon-cyan transition-all"
                  aria-label={`Visit our ${link.label}`}
                >
                  {link.label === 'Discord' ? (
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-neon-cyan transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-neon-cyan transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  )}
                </a>
              ))}
            </div>

            {/* Status indicator */}
            <div className="mt-6 terminal-box rounded-lg p-4">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-green"></span>
                </span>
                <span className="text-xs text-gray-500 font-mono">All systems operational</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-terminal-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-sm text-gray-600 font-mono">
              <p>&copy; {currentYear} SteamRecs.io <span className="text-terminal-border">|</span> All rights reserved</p>
            </div>
            <div className="text-xs text-gray-600 text-center md:text-right font-mono">
              <p>Powered by Steam&apos;s public data. Not affiliated with Valve Corporation.</p>
              <p className="mt-1 text-gray-700">Steam and the Steam logo are trademarks of Valve Corporation.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
