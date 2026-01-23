export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] grid-pattern relative flex items-center justify-center">
      {/* CRT Effects */}
      <div className="crt-scanlines" />
      <div className="crt-vignette" />

      <div className="text-center space-y-6 relative z-10">
        <div className="terminal-box rounded-lg p-12">
          {/* Terminal Header */}
          <div className="terminal-header mb-8">
            <span className="text-gray-400 text-sm font-mono ml-16">LOADING.exe</span>
          </div>

          {/* Spinner */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-neon-cyan/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-neon-cyan rounded-full animate-spin" />
            <div className="absolute inset-2 border-4 border-transparent border-b-neon-orange rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>

          {/* Loading Text */}
          <p className="text-neon-cyan font-mono text-lg cursor-blink">
            LOADING GAME DATA...
          </p>

          {/* Progress bar */}
          <div className="mt-6 w-64 mx-auto">
            <div className="h-2 progress-bar-retro rounded overflow-hidden">
              <div className="h-full progress-fill-cyan animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
