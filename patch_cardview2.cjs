const fs = require('fs');
let code = fs.readFileSync('src/components/OneCard.tsx', 'utf8');

const targetStr = `  const { symbol, color } = suitSymbols[card.suit];
  const displayRank = card.rank === 'black' ? 'B' : card.rank === 'color' ? 'C' : card.rank;
  const isJoker = card.suit === 'joker';

  return (
    <motion.button 
      whileHover={isPlayable ? { y: -12, scale: 1.05 } : {}}
      onClick={onClick}
      disabled={!isPlayable && onClick !== undefined}
      className={\`relative w-16 h-24 sm:w-24 sm:h-36 bg-white rounded-xl shadow-md flex flex-col justify-between p-2 border-[3px] \${isPlayable ? 'border-green-400 cursor-pointer shadow-[0_5px_15px_rgba(74,222,128,0.4)]' : 'border-gray-200 opacity-50'} transition-all \${className}\`}
    >
      <div className={\`text-left text-sm sm:text-xl font-black \${color} leading-none\`}>
        <div>{displayRank}</div>
        <div className="text-xs sm:text-lg">{symbol}</div>
      </div>
      
      <div className={\`text-center text-4xl sm:text-5xl absolute inset-0 flex items-center justify-center opacity-20 \${color}\`}>
         {isJoker ? '🃏' : symbol}
      </div>
      
      <div className={\`text-right text-sm sm:text-xl font-black \${color} leading-none rotate-180\`}>
        <div>{displayRank}</div>
        <div className="text-xs sm:text-lg">{symbol}</div>
      </div>
    </motion.button>
  );`;

const replaceStr = `  const { symbol, color } = suitSymbols[card.suit];
  const displayRank = card.rank;
  const isJoker = card.suit === 'joker';

  if (isJoker) {
    const isColorJoker = card.rank === 'color';
    const jokerColor = isColorJoker ? 'text-rose-500' : 'text-slate-800';
    return (
      <motion.button 
        whileHover={isPlayable ? { y: -12, scale: 1.05 } : {}}
        onClick={onClick}
        disabled={!isPlayable && onClick !== undefined}
        className={\`relative w-16 h-24 sm:w-24 sm:h-36 bg-white rounded-xl shadow-md flex flex-col justify-between p-1.5 sm:p-2 border-[3px] \${isPlayable ? 'border-green-400 cursor-pointer shadow-[0_5px_15px_rgba(74,222,128,0.4)]' : 'border-gray-200 opacity-50'} transition-all \${className}\`}
      >
        <div className={\`text-left text-[10px] sm:text-xs font-black \${jokerColor} leading-none tracking-tighter\`}>
          <div>JOKER</div>
        </div>
        
        <div className={\`text-center text-4xl sm:text-5xl absolute inset-0 flex items-center justify-center \${isColorJoker ? 'opacity-90' : 'opacity-70 grayscale'}\`}>
           🃏
        </div>
        
        <div className={\`text-right text-[10px] sm:text-xs font-black \${jokerColor} leading-none rotate-180 tracking-tighter\`}>
          <div>JOKER</div>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button 
      whileHover={isPlayable ? { y: -12, scale: 1.05 } : {}}
      onClick={onClick}
      disabled={!isPlayable && onClick !== undefined}
      className={\`relative w-16 h-24 sm:w-24 sm:h-36 bg-white rounded-xl shadow-md flex flex-col justify-between p-2 border-[3px] \${isPlayable ? 'border-green-400 cursor-pointer shadow-[0_5px_15px_rgba(74,222,128,0.4)]' : 'border-gray-200 opacity-50'} transition-all \${className}\`}
    >
      <div className={\`text-left text-sm sm:text-xl font-black \${color} leading-none\`}>
        <div>{displayRank}</div>
        <div className="text-xs sm:text-lg">{symbol}</div>
      </div>
      
      <div className={\`text-center text-4xl sm:text-5xl absolute inset-0 flex items-center justify-center opacity-20 \${color}\`}>
         {symbol}
      </div>
      
      <div className={\`text-right text-sm sm:text-xl font-black \${color} leading-none rotate-180\`}>
        <div>{displayRank}</div>
        <div className="text-xs sm:text-lg">{symbol}</div>
      </div>
    </motion.button>
  );`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/components/OneCard.tsx', code);
console.log('patched joker card UI');
