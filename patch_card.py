import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """const Card = ({ value, isBack, isTarget, onClick }: { value?: string, isBack?: boolean, isTarget?: boolean, onClick?: () => void }) => {
  if (isBack) {
    return (
      <div 
        onClick={onClick}
        className={`
          w-12 h-16 sm:w-16 sm:h-24 md:w-20 md:h-28 rounded-xl bg-gradient-to-br from-red-800 to-red-950 border-2 border-white/20 flex-shrink-0
          shadow-[2px_2px_10px_rgba(0,0,0,0.6)] flex items-center justify-center relative overflow-hidden
          ${isTarget ? 'cursor-pointer hover:-translate-y-4 hover:shadow-[0_0_25px_#E8B81C] border-[#E8B81C] border-4 transition-all z-20' : ''}
          ${isTarget ? 'animate-pulse' : ''}
        `}
      >
        <div className="absolute inset-1 sm:inset-2 border-2 border-red-400/30 rounded-lg flex items-center justify-center bg-red-900/50">
           <div className="text-red-950 opacity-20 text-4xl">🂠</div>
        </div>
      </div>
    );
  }

  const isJoker = value === 'JOKER';

  return (
    <div className={`
      w-12 h-16 sm:w-16 sm:h-24 md:w-20 md:h-28 rounded-xl bg-white border-2 border-gray-200 flex-shrink-0
      shadow-[4px_4px_15px_rgba(0,0,0,0.4)] flex flex-col justify-between p-1 sm:p-2
      ${isJoker ? 'text-purple-700 bg-gradient-to-br from-purple-50 to-pink-50' : 'text-gray-900'}
      hover:-translate-y-6 transition-transform duration-300 z-10 cursor-default
    `}>
      <div className={`font-black text-sm md:text-xl leading-none`}>
        {isJoker ? 'J' : value}
      </div>
      <div className="self-center text-3xl md:text-5xl drop-shadow-md">
        {isJoker ? '🃏' : '♠️'}
      </div>
      <div className="font-black text-sm md:text-xl leading-none rotate-180">
        {isJoker ? 'J' : value}
      </div>
    </div>
  );
};"""

replacement = """const Card = ({ value, suit, isBack, isTarget, onClick }: { value?: string, suit?: string, isBack?: boolean, isTarget?: boolean, onClick?: () => void }) => {
  if (isBack) {
    return (
      <div 
        onClick={onClick}
        className={`
          w-12 h-16 sm:w-16 sm:h-24 md:w-20 md:h-28 rounded-xl bg-gradient-to-br from-red-800 to-red-950 border-2 border-white/20 flex-shrink-0
          shadow-[2px_2px_10px_rgba(0,0,0,0.6)] flex items-center justify-center relative overflow-hidden
          ${isTarget ? 'cursor-pointer hover:-translate-y-4 hover:shadow-[0_0_25px_#E8B81C] border-[#E8B81C] border-4 transition-all z-20' : ''}
          ${isTarget ? 'animate-pulse' : ''}
        `}
      >
        <div className="absolute inset-1 sm:inset-2 border-2 border-red-400/30 rounded-lg flex items-center justify-center bg-red-900/50">
           <div className="text-red-950 opacity-20 text-4xl">🂠</div>
        </div>
      </div>
    );
  }

  const isJoker = value === 'JOKER';
  const isRed = suit === 'H' || suit === 'D';
  const suitSymbol = suit === 'S' ? '♠️' : suit === 'H' ? '♥️' : suit === 'C' ? '♣️' : suit === 'D' ? '♦️' : '🃏';

  return (
    <div className={`
      w-12 h-16 sm:w-16 sm:h-24 md:w-20 md:h-28 rounded-xl bg-white border-2 border-gray-200 flex-shrink-0
      shadow-[4px_4px_15px_rgba(0,0,0,0.4)] flex flex-col justify-between p-1 sm:p-2
      ${isJoker ? 'text-purple-700 bg-gradient-to-br from-purple-50 to-pink-50' : (isRed ? 'text-red-600' : 'text-gray-900')}
      hover:-translate-y-6 transition-transform duration-300 z-10 cursor-default
    `}>
      <div className={`font-black text-sm md:text-xl leading-none`}>
        {isJoker ? 'J' : value}
      </div>
      <div className="self-center text-3xl md:text-4xl lg:text-5xl drop-shadow-md">
        {suitSymbol}
      </div>
      <div className="font-black text-sm md:text-xl leading-none rotate-180">
        {isJoker ? 'J' : value}
      </div>
    </div>
  );
};"""

if target in content:
    content = content.replace(target, replacement)
    print("Replaced Card Component!")
else:
    print("Target not found.")

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
