const fs = require('fs');

let path = 'src/components/OneCard.tsx';
let code = fs.readFileSync(path, 'utf8');

const importTarget = `import { useState, useEffect, useRef } from 'react';`;
const importReplace = `import { useState, useEffect, useRef } from 'react';
import { useAnimation } from 'motion/react';`;
code = code.replace(importTarget, importReplace);

const stateTarget = `  const [suitPickerOpen, setSuitPickerOpen] = useState(false);
  const [pendingCardIndex, setPendingCardIndex] = useState<number | null>(null);
  const [oneCardDeclared, setOneCardDeclared] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const handScrollRef = useRef<HTMLDivElement>(null);`;

const stateReplace = `  const [suitPickerOpen, setSuitPickerOpen] = useState(false);
  const [pendingCardIndex, setPendingCardIndex] = useState<number | null>(null);
  const [oneCardDeclared, setOneCardDeclared] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const handScrollRef = useRef<HTMLDivElement>(null);

  // Attack Effect
  const [shake, setShake] = useState(false);
  const prevPenalty = useRef(gameState.penaltyStack);
  const prevTopCard = useRef(gameState.discardPile[gameState.discardPile.length - 1]?.id);

  useEffect(() => {
    const currentTop = gameState.discardPile[gameState.discardPile.length - 1];
    if (gameState.penaltyStack > prevPenalty.current || (currentTop && currentTop.id !== prevTopCard.current && (currentTop.suit === 'joker' || currentTop.rank === 'A' || currentTop.rank === '2'))) {
      // Trigger shake
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
    prevPenalty.current = gameState.penaltyStack;
    prevTopCard.current = currentTop?.id;
  }, [gameState.penaltyStack, gameState.discardPile]);

  const [showEmojis, setShowEmojis] = useState(false);
  const emojis = ['😆', '😭', '😡', '👀', '🚨', '💥'];
`;

code = code.replace(stateTarget, stateReplace);

const playerAreaTarget = `            <div key={pid} className={\`flex flex-col items-center bg-slate-800/60 backdrop-blur-sm p-3 sm:p-5 rounded-2xl border-2 transition-all duration-300 \${isCurrent ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] -translate-y-2' : 'border-slate-700/50'}\`}>
              <span className="font-bold text-xs sm:text-sm whitespace-nowrap mb-3 text-slate-200">{nickname}</span>`;

const playerAreaReplace = `            <div key={pid} className={\`relative flex flex-col items-center bg-slate-800/60 backdrop-blur-sm p-3 sm:p-5 rounded-2xl border-2 transition-all duration-300 \${isCurrent ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] -translate-y-2' : 'border-slate-700/50'}\`}>
              {session.players[pid]?.emoticon && (Date.now() - session.players[pid].emoticon.timestamp < 3000) && (
                <motion.div
                  key={session.players[pid].emoticon.timestamp}
                  initial={{ opacity: 0, y: 10, scale: 0.5 }}
                  animate={{ opacity: 1, y: -20, scale: 1.5 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute -top-6 left-1/2 -translate-x-1/2 z-50 text-2xl drop-shadow-lg"
                >
                  {session.players[pid].emoticon.emoji}
                </motion.div>
              )}
              {handSize === 1 && (
                <div className="absolute inset-0 border-2 border-red-500 rounded-2xl animate-[pulse_1s_ease-in-out_infinite] pointer-events-none shadow-[0_0_15px_rgba(239,68,68,0.5)] z-0"></div>
              )}
              <span className="font-bold text-xs sm:text-sm whitespace-nowrap mb-3 text-slate-200 relative z-10">{nickname}</span>`;

code = code.replace(playerAreaTarget, playerAreaReplace);

const mainContainerTarget = `<div className="w-full h-full flex flex-col bg-slate-900 text-slate-100 relative overflow-hidden font-sans">`;
const mainContainerReplace = `<div className={\`w-full h-full flex flex-col bg-slate-900 text-slate-100 relative overflow-hidden font-sans \${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}\`}>`;

code = code.replace(mainContainerTarget, mainContainerReplace);


const myPlayerAreaTarget = `          <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-5xl mb-4 sm:mb-6 gap-3">
             <div className="flex items-center gap-3">
               <div className={\`w-3 h-3 rounded-full \${myTurn ? 'bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse' : 'bg-slate-500'}\`}></div>
               <span className="font-bold text-slate-100 text-base sm:text-lg">{me?.nickname}</span>
             </div>`;

const myPlayerAreaReplace = `          <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-5xl mb-4 sm:mb-6 gap-3 relative">
             <div className="flex items-center gap-3 relative">
               {session.players[myId]?.emoticon && (Date.now() - session.players[myId].emoticon.timestamp < 3000) && (
                  <motion.div
                    key={session.players[myId].emoticon.timestamp}
                    initial={{ opacity: 0, y: 10, scale: 0.5 }}
                    animate={{ opacity: 1, y: -20, scale: 1.5 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute -top-8 left-6 z-50 text-3xl drop-shadow-lg"
                  >
                    {session.players[myId].emoticon.emoji}
                  </motion.div>
                )}
               <div className={\`w-3 h-3 rounded-full \${myTurn ? 'bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse' : 'bg-slate-500'}\`}></div>
               <span className="font-bold text-slate-100 text-base sm:text-lg">{me?.nickname}</span>
               
               <div className="relative">
                 <button 
                   onClick={() => setShowEmojis(!showEmojis)}
                   className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-700 hover:bg-slate-600 transition-colors border border-slate-600"
                 >
                   😀
                 </button>
                 <AnimatePresence>
                   {showEmojis && (
                     <motion.div 
                       initial={{ opacity: 0, y: 10, scale: 0.9 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       exit={{ opacity: 0, scale: 0.9 }}
                       className="absolute bottom-full left-0 mb-2 bg-slate-800 border border-slate-700 rounded-xl p-2 flex gap-2 shadow-xl z-50"
                     >
                       {emojis.map(e => (
                         <button 
                           key={e}
                           onClick={() => {
                             sessionService.sendEmoticon(session.id, myId, e);
                             setShowEmojis(false);
                           }}
                           className="text-2xl hover:scale-125 transition-transform"
                         >
                           {e}
                         </button>
                       ))}
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
             </div>`;

code = code.replace(myPlayerAreaTarget, myPlayerAreaReplace);

const keyframesTarget = `      \`}} />
    </div>`;

const keyframesReplace = `        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px) rotate(-1deg); }
          20%, 40%, 60%, 80% { transform: translateX(10px) rotate(1deg); }
        }
      \`}} />
      {myState.hand.length === 1 && (
        <div className="absolute inset-0 border-4 border-red-500 pointer-events-none z-0 animate-[pulse_1s_ease-in-out_infinite] shadow-[inset_0_0_30px_rgba(239,68,68,0.3)]"></div>
      )}
    </div>`;

code = code.replace(keyframesTarget, keyframesReplace);

fs.writeFileSync(path, code);
console.log('patched animations');
