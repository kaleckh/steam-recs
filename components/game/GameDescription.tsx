import { GameDetail } from '@/app/game/[appId]/page';

interface GameDescriptionProps {
  game: GameDetail;
}

export default function GameDescription({ game }: GameDescriptionProps) {
  return (
    <div className="terminal-box rounded-lg overflow-hidden">
      {/* Terminal Header */}
      <div className="terminal-header">
        <span className="text-gray-400 text-sm font-mono ml-16">README.txt</span>
      </div>

      <div className="p-6">
        <h2 className="text-xl font-bold text-white mb-4 orbitron flex items-center gap-2">
          <span className="text-neon-green">&gt;</span> ABOUT THIS GAME
        </h2>

        {game.detailedDescription ? (
          <div
            className="text-gray-300 leading-relaxed prose prose-invert max-w-none font-mono text-sm
              prose-headings:text-neon-cyan prose-headings:font-bold prose-headings:orbitron
              prose-p:text-gray-300 prose-p:mb-4
              prose-ul:text-gray-300 prose-ul:list-disc prose-ul:ml-6
              prose-ol:text-gray-300 prose-ol:list-decimal prose-ol:ml-6
              prose-li:mb-2
              prose-strong:text-white prose-strong:font-semibold
              prose-a:text-neon-cyan prose-a:no-underline hover:prose-a:underline
              prose-img:rounded-lg prose-img:border prose-img:border-terminal-border"
            dangerouslySetInnerHTML={{ __html: game.detailedDescription }}
          />
        ) : game.shortDescription ? (
          <p className="text-gray-300 leading-relaxed font-mono">{game.shortDescription}</p>
        ) : (
          <p className="text-gray-500 font-mono">No description available.</p>
        )}

        {/* System Requirements */}
        {game.pcRequirements && typeof game.pcRequirements === 'object' && game.pcRequirements.minimum && (
          <div className="mt-8 pt-8 border-t border-terminal-border">
            <h3 className="text-lg font-bold text-white mb-6 orbitron flex items-center gap-2">
              <span className="text-neon-orange">&gt;</span> SYSTEM REQUIREMENTS
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              {game.pcRequirements.minimum && (
                <div className="bg-terminal-dark rounded-lg p-4 border border-terminal-border">
                  <h4 className="text-neon-orange font-bold mb-3 orbitron text-sm">MINIMUM</h4>
                  <div
                    className="text-gray-400 text-xs font-mono prose prose-invert prose-sm max-w-none
                      prose-ul:list-none prose-ul:ml-0 prose-ul:space-y-1
                      prose-li:text-gray-400
                      prose-strong:text-neon-cyan"
                    dangerouslySetInnerHTML={{ __html: game.pcRequirements.minimum }}
                  />
                </div>
              )}
              {game.pcRequirements.recommended && (
                <div className="bg-terminal-dark rounded-lg p-4 border border-terminal-border">
                  <h4 className="text-neon-green font-bold mb-3 orbitron text-sm">RECOMMENDED</h4>
                  <div
                    className="text-gray-400 text-xs font-mono prose prose-invert prose-sm max-w-none
                      prose-ul:list-none prose-ul:ml-0 prose-ul:space-y-1
                      prose-li:text-gray-400
                      prose-strong:text-neon-cyan"
                    dangerouslySetInnerHTML={{ __html: game.pcRequirements.recommended }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
