import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service - Steam Recs',
  description: 'Terms of Service for Steam Recs - Rules and guidelines for using our service',
};

export default function TermsPage() {
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
          <h1 className="orbitron text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-gray-500 font-mono text-xs sm:text-sm">
            Last updated: {lastUpdated}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="space-y-8 sm:space-y-12 text-gray-300 font-mono">

          {/* Introduction */}
          <section>
            <h2 className="text-base sm:text-xl font-bold text-neon-cyan mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-neon-green">&gt;</span> Agreement to Terms
            </h2>
            <div className="terminal-box rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4 text-sm sm:text-base">
              <p>
                By accessing or using Steam Recs (&quot;the Service&quot;), you agree to be bound by these
                Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>
              <p>
                Steam Recs is an independent service and is not affiliated with, endorsed by, or
                connected to Valve Corporation or Steam.
              </p>
            </div>
          </section>

          {/* Description of Service */}
          <section>
            <h2 className="text-base sm:text-xl font-bold text-neon-cyan mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-neon-green">&gt;</span> Description of Service
            </h2>
            <div className="terminal-box rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4 text-sm sm:text-base">
              <p>
                Steam Recs provides personalized game recommendations based on your publicly
                available Steam library data. Our service analyzes your gaming preferences to
                suggest games you might enjoy.
              </p>
              <ul className="list-none space-y-2 text-sm mt-4">
                <li className="flex items-start gap-2">
                  <span className="text-neon-cyan">&#8226;</span>
                  <span>Free tier: Basic recommendations based on your Steam library</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-cyan">&#8226;</span>
                  <span>Premium tier: Enhanced features including taste training, analytics, and more</span>
                </li>
              </ul>
            </div>
          </section>

          {/* User Requirements */}
          <section>
            <h2 className="text-base sm:text-xl font-bold text-neon-cyan mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-neon-green">&gt;</span> User Requirements
            </h2>
            <div className="terminal-box rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4 text-sm sm:text-base">
              <p>To use the Service, you must:</p>
              <ul className="list-none space-y-3 text-sm mt-4">
                <li className="flex items-start gap-2">
                  <span className="text-neon-green">&#10003;</span>
                  <span>Be at least 13 years of age</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-green">&#10003;</span>
                  <span>Have a valid Steam account</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-green">&#10003;</span>
                  <span>Set your Steam profile to public (for library analysis)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-green">&#10003;</span>
                  <span>Provide accurate information when creating an account</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-base sm:text-xl font-bold text-neon-cyan mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-neon-green">&gt;</span> Acceptable Use
            </h2>
            <div className="terminal-box rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4 text-sm sm:text-base">
              <p>You agree NOT to:</p>
              <ul className="list-none space-y-3 text-sm mt-4">
                <li className="flex items-start gap-2">
                  <span className="text-red-400">-</span>
                  <span>Use the Service for any unlawful purpose</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">-</span>
                  <span>Attempt to gain unauthorized access to our systems</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">-</span>
                  <span>Scrape, data mine, or automated access beyond normal use</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">-</span>
                  <span>Interfere with or disrupt the Service</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">-</span>
                  <span>Impersonate others or provide false information</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Premium Subscriptions */}
          <section>
            <h2 className="text-base sm:text-xl font-bold text-neon-cyan mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-neon-green">&gt;</span> Premium Subscriptions
            </h2>
            <div className="terminal-box rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4 text-sm sm:text-base">
              <p>
                Premium subscriptions are processed through Stripe. By subscribing:
              </p>
              <ul className="list-none space-y-3 text-sm mt-4">
                <li className="flex items-start gap-2">
                  <span className="text-neon-cyan">&#8226;</span>
                  <span>You authorize recurring charges to your payment method</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-cyan">&#8226;</span>
                  <span>Subscriptions renew automatically unless cancelled</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-cyan">&#8226;</span>
                  <span>You can cancel anytime from your profile settings</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-neon-cyan">&#8226;</span>
                  <span>Refunds are handled on a case-by-case basis</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-base sm:text-xl font-bold text-neon-cyan mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-neon-green">&gt;</span> Intellectual Property
            </h2>
            <div className="terminal-box rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4 text-sm sm:text-base">
              <p>
                The Service, including its design, features, and content created by us, is owned
                by Steam Recs and protected by applicable intellectual property laws.
              </p>
              <p className="text-gray-400 text-sm mt-4">
                Game information, images, and metadata are provided by and remain the property of
                their respective owners (Valve Corporation, game publishers, and developers).
              </p>
            </div>
          </section>

          {/* Disclaimers */}
          <section>
            <h2 className="text-base sm:text-xl font-bold text-neon-cyan mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-neon-green">&gt;</span> Disclaimers
            </h2>
            <div className="terminal-box rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4 text-sm sm:text-base">
              <p>
                THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. We do not guarantee:
              </p>
              <ul className="list-none space-y-3 text-sm mt-4">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">!</span>
                  <span>That recommendations will match your preferences</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">!</span>
                  <span>Uninterrupted or error-free service</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">!</span>
                  <span>Accuracy of game information or prices</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-400">!</span>
                  <span>Availability of games on Steam</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-base sm:text-xl font-bold text-neon-cyan mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-neon-green">&gt;</span> Limitation of Liability
            </h2>
            <div className="terminal-box rounded-lg p-4 sm:p-6 text-sm sm:text-base">
              <p>
                To the maximum extent permitted by law, Steam Recs shall not be liable for any
                indirect, incidental, special, consequential, or punitive damages resulting from
                your use of or inability to use the Service.
              </p>
            </div>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-base sm:text-xl font-bold text-neon-cyan mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-neon-green">&gt;</span> Termination
            </h2>
            <div className="terminal-box rounded-lg p-4 sm:p-6 space-y-3 sm:space-y-4 text-sm sm:text-base">
              <p>
                We reserve the right to suspend or terminate your access to the Service at any
                time for violation of these terms or for any other reason at our discretion.
              </p>
              <p>
                You may delete your account at any time from your profile settings.
              </p>
            </div>
          </section>

          {/* Changes to Terms */}
          <section>
            <h2 className="text-base sm:text-xl font-bold text-neon-cyan mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-neon-green">&gt;</span> Changes to Terms
            </h2>
            <div className="terminal-box rounded-lg p-4 sm:p-6 text-sm sm:text-base">
              <p>
                We may update these terms from time to time. Continued use of the Service after
                changes constitutes acceptance of the new terms. For significant changes, we will
                provide notice via email or on the website.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-base sm:text-xl font-bold text-neon-cyan mb-3 sm:mb-4 flex items-center gap-2">
              <span className="text-neon-green">&gt;</span> Contact Us
            </h2>
            <div className="terminal-box rounded-lg p-4 sm:p-6 text-sm sm:text-base">
              <p className="mb-3 sm:mb-4">
                If you have questions about these terms:
              </p>
              <div className="bg-terminal-light rounded-lg p-3 sm:p-4 font-mono text-xs sm:text-sm">
                <p className="text-gray-400">Email: <span className="text-neon-cyan">support@steamrecs.io</span></p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
