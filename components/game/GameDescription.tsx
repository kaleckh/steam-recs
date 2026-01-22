import { GameDetail } from '@/app/game/[appId]/page';

interface GameDescriptionProps {
  game: GameDetail;
}

export default function GameDescription({ game }: GameDescriptionProps) {
  return (
    <div className="bg-[#16202d] rounded p-6">
      <h2 className="text-xl font-bold text-white mb-4">About This Game</h2>

      {game.detailedDescription ? (
        <div
          className="text-[#c7d5e0] leading-relaxed prose prose-invert max-w-none
            prose-headings:text-white prose-headings:font-bold
            prose-p:text-[#c7d5e0] prose-p:mb-4
            prose-ul:text-[#c7d5e0] prose-ul:list-disc prose-ul:ml-6
            prose-ol:text-[#c7d5e0] prose-ol:list-decimal prose-ol:ml-6
            prose-li:mb-2
            prose-strong:text-white prose-strong:font-semibold
            prose-a:text-[#66c0f4] prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: game.detailedDescription }}
        />
      ) : game.shortDescription ? (
        <p className="text-[#c7d5e0] leading-relaxed">{game.shortDescription}</p>
      ) : (
        <p className="text-[#8f98a0]">No description available.</p>
      )}

      {/* System Requirements (if available) */}
      {game.pcRequirements && typeof game.pcRequirements === 'object' && game.pcRequirements.minimum && (
        <div className="mt-8 pt-8 border-t border-[#2a475e]">
          <h3 className="text-lg font-bold text-white mb-4">System Requirements</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {game.pcRequirements.minimum && (
              <div>
                <h4 className="text-white font-semibold mb-3">Minimum:</h4>
                <div
                  className="text-[#c7d5e0] text-sm prose prose-invert prose-sm max-w-none
                    prose-ul:list-none prose-ul:ml-0 prose-ul:space-y-1
                    prose-li:text-[#c7d5e0]
                    prose-strong:text-white"
                  dangerouslySetInnerHTML={{ __html: game.pcRequirements.minimum }}
                />
              </div>
            )}
            {game.pcRequirements.recommended && (
              <div>
                <h4 className="text-white font-semibold mb-3">Recommended:</h4>
                <div
                  className="text-[#c7d5e0] text-sm prose prose-invert prose-sm max-w-none
                    prose-ul:list-none prose-ul:ml-0 prose-ul:space-y-1
                    prose-li:text-[#c7d5e0]
                    prose-strong:text-white"
                  dangerouslySetInnerHTML={{ __html: game.pcRequirements.recommended }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
