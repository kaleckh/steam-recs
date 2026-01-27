import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy - Steam Recs',
  description: 'Privacy Policy for Steam Recs - Learn how we handle your data',
};

export default function PrivacyPage() {
  const lastUpdated = 'January 26, 2026';

  return (
    <div className="min-h-screen bg-terminal-dark">
      {/* Header */}
      <div className="border-b border-terminal-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <Link
            href="/"
            className="text-neon-cyan font-mono text-xs sm:text-sm hover:underline mb-3 sm:mb-4 inline-block"
          >
            &larr; Back to Home
          </Link>
          <h1 className="orbitron text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-gray-500 font-mono text-xs sm:text-sm">
            Last updated: {lastUpdated}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="space-y-8 sm:space-y-12 text-gray-300 font-mono text-sm sm:text-base">

          {/* Introduction */}
          <section>
            <h2 className="text-base sm:text-xl font-bold text-neon-cyan mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-neon-green">&gt;</span> Introduction
            </h2>
            <div className="terminal-box rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
              <p>
                Welcome to Steam Recs (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We respect your privacy and are committed
                to protecting your personal data. This privacy policy explains how we collect, use, and
                safeguard your information when you use our game recommendation service.
              </p>
              <p>
                Steam Recs is an independent service and is not affiliated with, endorsed by, or
                connected to Valve Corporation or Steam.
              </p>
            </div>
          </section>

          {/* What Data We Collect */}
          <section>
            <h2 className="text-base sm:text-xl font-bold text-neon-cyan mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-neon-green">&gt;</span> What Data We Collect
            </h2>
            <div className="terminal-box rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-white font-bold mb-2">Steam Profile Data (Public Only)</h3>
                <p className="text-gray-400 mb-3">
                  When you link your Steam account, we access only publicly available information:
                </p>
                <ul className="list-none space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-neon-green mt-1">+</span>
                    <span>Your Steam ID (unique identifier)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-green mt-1">+</span>
                    <span>Your public game library and playtime</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-green mt-1">+</span>
                    <span>Your public profile name and avatar</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-bold mb-2">What We DO NOT Access</h3>
                <ul className="list-none space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">-</span>
                    <span>Your Steam password or login credentials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">-</span>
                    <span>Your payment information or purchase history</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">-</span>
                    <span>Your friends list or private messages</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">-</span>
                    <span>Any data from private profiles</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-1">-</span>
                    <span>Your real name or personal contact information from Steam</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-bold mb-2">Account Data</h3>
                <p className="text-gray-400 mb-3">
                  If you create an account with us:
                </p>
                <ul className="list-none space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-neon-green mt-1">+</span>
                    <span>Email address (for authentication and communication)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-green mt-1">+</span>
                    <span>Your game preferences and feedback on recommendations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neon-green mt-1">+</span>
                    <span>Subscription status (if applicable)</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* How We Use Your Data */}
          <section>
            <h2 className="text-base sm:text-xl font-bold text-neon-cyan mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-neon-green">&gt;</span> How We Use Your Data
            </h2>
            <div className="terminal-box rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
              <p>Your data is used exclusively for:</p>
              <ul className="list-none space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="bg-neon-cyan/20 text-neon-cyan px-2 py-0.5 rounded text-xs">1</span>
                  <span><strong className="text-white">Generating Recommendations:</strong> Analyzing your game library and playtime to suggest games you might enjoy.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-neon-cyan/20 text-neon-cyan px-2 py-0.5 rounded text-xs">2</span>
                  <span><strong className="text-white">Improving Our Service:</strong> Understanding usage patterns to make better recommendations for everyone.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="bg-neon-cyan/20 text-neon-cyan px-2 py-0.5 rounded text-xs">3</span>
                  <span><strong className="text-white">Account Management:</strong> Maintaining your preferences, saved recommendations, and subscription.</span>
                </li>
              </ul>
              <div className="mt-6 p-4 bg-neon-green/10 border border-neon-green/30 rounded-lg">
                <p className="text-neon-green text-sm">
                  We DO NOT sell, rent, or share your personal data with third parties for marketing purposes. Ever.
                </p>
              </div>
            </div>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-base sm:text-xl font-bold text-neon-cyan mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-neon-green">&gt;</span> Data Retention
            </h2>
            <div className="terminal-box rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
              <ul className="list-none space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-neon-cyan">&#8226;</span>
                  <span><strong className="text-white">Game Library Data:</strong> Cached temporarily to generate recommendations. Refreshed when you request new recommendations.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-cyan">&#8226;</span>
                  <span><strong className="text-white">Account Data:</strong> Retained until you delete your account or request data deletion.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-cyan">&#8226;</span>
                  <span><strong className="text-white">Feedback &amp; Preferences:</strong> Retained to improve your recommendations until account deletion.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-base sm:text-xl font-bold text-neon-cyan mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-neon-green">&gt;</span> Your Rights (GDPR &amp; CCPA)
            </h2>
            <div className="terminal-box rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
              <p>Regardless of where you are located, you have the right to:</p>
              <ul className="list-none space-y-3 text-sm mt-4">
                <li className="flex items-start gap-2">
                  <span className="text-neon-green">&#10003;</span>
                  <span><strong className="text-white">Access:</strong> Request a copy of the data we hold about you</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-green">&#10003;</span>
                  <span><strong className="text-white">Correction:</strong> Request correction of inaccurate data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-green">&#10003;</span>
                  <span><strong className="text-white">Deletion:</strong> Request deletion of your account and all associated data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-green">&#10003;</span>
                  <span><strong className="text-white">Portability:</strong> Request your data in a machine-readable format</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-green">&#10003;</span>
                  <span><strong className="text-white">Opt-Out:</strong> Unlink your Steam account at any time from your profile settings</span>
                </li>
              </ul>
              <p className="mt-4 text-gray-400 text-sm">
                To exercise any of these rights, contact us at the email below. We will respond within 30 days.
              </p>
            </div>
          </section>

          {/* Cookies & Analytics */}
          <section>
            <h2 className="text-base sm:text-xl font-bold text-neon-cyan mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-neon-green">&gt;</span> Cookies &amp; Analytics
            </h2>
            <div className="terminal-box rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
              <p>We use minimal, essential cookies:</p>
              <ul className="list-none space-y-3 text-sm mt-4">
                <li className="flex items-start gap-2">
                  <span className="text-neon-cyan">&#8226;</span>
                  <span><strong className="text-white">Session Cookies:</strong> Required for authentication and keeping you logged in</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-cyan">&#8226;</span>
                  <span><strong className="text-white">Preference Cookies:</strong> Remember your settings and preferences</span>
                </li>
              </ul>
              <p className="mt-4 text-gray-400 text-sm">
                We do not use third-party tracking cookies or sell data to advertisers.
              </p>
            </div>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-base sm:text-xl font-bold text-neon-cyan mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-neon-green">&gt;</span> Security
            </h2>
            <div className="terminal-box rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4">
              <p>We implement industry-standard security measures:</p>
              <ul className="list-none space-y-2 text-sm mt-4">
                <li className="flex items-start gap-2">
                  <span className="text-neon-green">&#10003;</span>
                  <span>HTTPS encryption for all data transmission</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-green">&#10003;</span>
                  <span>Secure authentication via Supabase</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-green">&#10003;</span>
                  <span>Regular security updates and monitoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-green">&#10003;</span>
                  <span>Data stored in secure, access-controlled databases</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Children */}
          <section>
            <h2 className="text-base sm:text-xl font-bold text-neon-cyan mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-neon-green">&gt;</span> Children&apos;s Privacy
            </h2>
            <div className="terminal-box rounded-lg p-4 sm:p-6">
              <p>
                Steam Recs is not intended for users under the age of 13. We do not knowingly collect
                personal information from children under 13. If you believe a child has provided us
                with personal data, please contact us immediately.
              </p>
            </div>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-base sm:text-xl font-bold text-neon-cyan mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-neon-green">&gt;</span> Changes to This Policy
            </h2>
            <div className="terminal-box rounded-lg p-4 sm:p-6">
              <p>
                We may update this privacy policy from time to time. We will notify you of any changes
                by posting the new policy on this page and updating the &quot;Last updated&quot; date. For significant
                changes, we will send an email notification to registered users.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-base sm:text-xl font-bold text-neon-cyan mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-neon-green">&gt;</span> Contact Us
            </h2>
            <div className="terminal-box rounded-lg p-4 sm:p-6">
              <p className="mb-3 sm:mb-4">
                If you have questions about this privacy policy or want to exercise your data rights:
              </p>
              <div className="bg-terminal-light rounded-lg p-3 sm:p-4 font-mono text-xs sm:text-sm">
                <p className="text-gray-400">Email: <span className="text-neon-cyan">privacy@steamrecs.io</span></p>
              </div>
              <p className="mt-4 text-gray-500 text-sm">
                We aim to respond to all inquiries within 48 hours.
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
