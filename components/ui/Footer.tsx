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

          {/* Status */}
          <div>
            <h3 className="orbitron text-sm font-bold text-white uppercase tracking-wider mb-4">
              STATUS
            </h3>
            {/* Status indicator */}
            <div className="terminal-box rounded-lg p-4">
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
