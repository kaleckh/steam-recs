export default function HowItWorksSection() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#16202d]/50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">
          How It Works
        </h2>

        <div className="grid md:grid-cols-3 gap-12">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#06BFFF] to-[#2571CE] flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-[#66c0f4]/30">
              1
            </div>
            <h3 className="text-2xl font-bold text-white">Connect Steam Profile</h3>
            <p className="text-[#c7d5e0] text-lg">
              Enter your Steam ID or profile URL. Your library stays private.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#06BFFF] to-[#2571CE] flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-[#66c0f4]/30">
              2
            </div>
            <h3 className="text-2xl font-bold text-white">AI Analyzes Your Taste</h3>
            <p className="text-[#c7d5e0] text-lg">
              Our AI examines your playtime, genres, and preferences to understand what you love.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#06BFFF] to-[#2571CE] flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-[#66c0f4]/30">
              3
            </div>
            <h3 className="text-2xl font-bold text-white">Get Perfect Matches</h3>
            <p className="text-[#c7d5e0] text-lg">
              Discover hidden gems and popular titles tailored specifically to your gaming style.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <a
            href="/profile"
            className="inline-block bg-gradient-to-r from-[#06BFFF] to-[#2571CE] hover:from-[#1999FF] hover:to-[#1C5FA8] text-white text-lg font-bold py-4 px-10 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Try It Now
          </a>
        </div>
      </div>
    </section>
  );
}
