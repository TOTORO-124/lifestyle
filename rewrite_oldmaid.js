const fs = require('fs');

const code = `import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Session, Player, OldMaidCard } from '../types';
import { sessionService } from '../services/sessionService';
import { User, RefreshCw, Play, Info } from 'lucide-react';

interface OldMaidProps {
  session: Session;
  currentUser: Player;
}

export function OldMaid({ session, currentUser }: OldMaidProps) {
  const game = session.oldMaidGame;
  const isHost = session.hostId === currentUser.uid;
  const [localState, setLocalState] = useState<'LOBBY' | 'HOW_TO_PLAY'>('LOBBY');
  
  const startGame = () => {
    sessionService.startOldMaidGame(session.id);
  };

  if (!game) {
    if (localState === 'HOW_TO_PLAY') {
      return (
        <div className="w-full max-w-4xl mx-auto h-full min-h-[600px] flex flex-col bg-[#1A4D2E] text-white rounded-lg shadow-2xl relative overflow-hidden items-center justify-center p-8 text-center space-y-6">
          <h2 className="text-3xl font-bold font-sans">게임 방법</h2>
          <div className="space-y-4 text-lg bg-black/30 p-6 rounded-xl max-w-md">
            <p>상대의 카드 한 장을 뽑아 같은 숫자를 맞추세요.</p>
            <p>짝이 맞으면 카드는 사라집니다.</p>
            <p>모든 카드를 먼저 없애면 안전합니다!</p>
            <p className="font-bold text-yellow-400">마지막까지 조커를 들고 있으면 패배입니다.</p>
          </div>
          <button
            onClick={startGame}
            className="px-8 py-3 bg-[#E8B81C] hover:bg-yellow-500 text-yellow-900 rounded-full font-black transition"
          >
            시작하기
          </button>
        </div>
      );
    }

    return (
      <div className="w-full max-w-4xl mx-auto h-full min-h-[600px] flex flex-col bg-[#1A4D2E] text-white rounded-lg shadow-2xl relative overflow-hidden items-center justify-center space-y-6">
        <div className="text-6xl mb-4 animate-bounce">🃏</div>
        <h1 className="text-4xl md:text-5xl font-black font-sans text-yellow-400">조커 도둑잡기</h1>
        <p className="text-green-200 text-lg">심장이 쫄깃해지는 국민 눈치게임!</p>
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => setLocalState('HOW_TO_PLAY')}
            className="px-6 py-3 bg-green-800 hover:bg-green-700 rounded-full font-bold transition flex items-center gap-2 shadow-lg"
          >
            <Info className="w-5 h-5" />
            게임 방법
          </button>
          <button
            onClick={startGame}
            className="px-8 py-3 bg-[#E8B81C] hover:bg-yellow-500 text-yellow-900 rounded-full font-black text-xl transition flex items-center gap-2 shadow-lg"
          >
            <Play className="w-6 h-6" />
            시작하기
          </button>
        </div>
      </div>
    );
  }

  const { players, turnOrder, currentTurnIndex, status, loserId, effect, message } = game;
  const isMyTurn = turnOrder[currentTurnIndex] === currentUser.uid;
  const currentTurnPid = turnOrder[currentTurnIndex];
  
  // Arrange players for visual: Me at bottom, others around
  let meIndex = turnOrder.indexOf(currentUser.uid);
  if (meIndex === -1) {
    // If observing, just assume index 0 is at bottom
    meIndex = 0;
  }

  const visualOrder = [];
  for (let i = 0; i < 4; i++) {
    visualOrder.push(turnOrder[(meIndex + i) % 4]);
  }
  const [bottomId, leftId, topId, rightId] = visualOrder;

  const getNextActivePlayerIndex = (startIndex: number) => {
    let index = (startIndex + 1) % 4;
    while (index !== startIndex) {
      if (players[turnOrder[index]].isActive) return index;
      index = (index + 1) % 4;
    }
    return -1;
  };

  const nextActiveIndex = getNextActivePlayerIndex(currentTurnIndex);
  const targetPid = nextActiveIndex !== -1 ? turnOrder[nextActiveIndex] : null;

  const removePairs = (hand: OldMaidCard[]) => {
    const counts = new Map<string, OldMaidCard[]>();
    hand.forEach(c => {
      if (c.value === 'JOKER') return;
      if (!counts.has(c.value)) counts.set(c.value, []);
      counts.get(c.value)!.push(c);
    });

    const toRemove = new Set<string>();
    counts.forEach(cards => {
      const pairsCount = Math.floor(cards.length / 2);
      for (let i = 0; i < pairsCount * 2; i++) {
        toRemove.add(cards[i].id);
      }
    });

    return hand.filter(c => !toRemove.has(c.id));
  };

  const checkGameEnd = (playersState: Record<string, {hand: any[], isActive: boolean}>) => {
    const activePlayers = Object.keys(playersState).filter(pid => playersState[pid].isActive);
    if (activePlayers.length === 1) {
      return activePlayers[0];
    }
    return null;
  };

  const handleDrawCard = async (targetId: string, cardIndex: number) => {
    if (status !== 'PLAYING') return;
    if (turnOrder[currentTurnIndex] !== currentUser.uid && !turnOrder[currentTurnIndex].startsWith('CPU_')) {
      // Not my turn, and not a CPU. We only execute CPU logic from host or first player.
      return; 
    }

    const fromPid = targetId;
    const toPid = turnOrder[currentTurnIndex];

    const fromPlayer = players[fromPid];
    const toPlayer = players[toPid];

    const drawnCard = fromPlayer.hand[cardIndex];
    let newHandFrom = [...fromPlayer.hand];
    newHandFrom.splice(cardIndex, 1);
    
    let newHandTo = [...toPlayer.hand, drawnCard];

    let pairMatched = false;
    const handBeforePairCheck = newHandTo.length;
    newHandTo = removePairs(newHandTo);
    if (newHandTo.length < handBeforePairCheck) {
      pairMatched = true;
    }

    const newPlayers = JSON.parse(JSON.stringify(players));
    newPlayers[fromPid].hand = newHandFrom;
    if (newHandFrom.length === 0) newPlayers[fromPid].isActive = false;

    newPlayers[toPid].hand = newHandTo;
    if (newHandTo.length === 0) newPlayers[toPid].isActive = false;

    let eff: 'JOKER' | 'PAIR' | 'ESCAPE' | null = null;
    let msg = "";
    
    if (drawnCard.value === 'JOKER') {
      eff = 'JOKER';
      msg = toPid === currentUser.uid ? '설마... 조커?' : \`\${session.players[toPid]?.nickname || toPid}님이 카드를 뽑았습니다.\`;
    } else {
      if (pairMatched) {
        if (newHandTo.length === 0) {
          eff = 'ESCAPE';
          msg = \`\${session.players[toPid]?.nickname || toPid}님 탈출 성공!\`;
        } else {
          eff = 'PAIR';
          msg = \`짝 맞추기 성공!\`;
        }
      } else {
        msg = \`아쉽게도 짝이 없습니다.\`;
      }
    }

    const nextTurn = getNextActivePlayerIndex(currentTurnIndex);
    const loser = checkGameEnd(newPlayers);

    const updates: any = {
      players: newPlayers,
      effect: eff,
      effectTimestamp: Date.now(),
      message: msg
    };

    if (loser) {
      updates.status = 'FINISHED';
      updates.loserId = loser;
    } else {
      updates.currentTurnIndex = nextTurn;
    }

    await sessionService.updateOldMaidGame(session.id, updates);
  };

  // CPU logic - run by host, or first real player if host absent
  useEffect(() => {
    if (status === 'PLAYING') {
      const currentPid = turnOrder[currentTurnIndex];
      const isCpuTurn = currentPid?.startsWith('CPU_');
      
      const realPlayers = turnOrder.filter(pid => !pid.startsWith('CPU_'));
      const imResponsible = (isHost && realPlayers.includes(currentUser.uid)) || realPlayers[0] === currentUser.uid;

      if (isCpuTurn && imResponsible && players[currentPid]?.isActive) {
        const nextActiveIdx = getNextActivePlayerIndex(currentTurnIndex);
        if (nextActiveIdx !== -1) {
          const targetPlayerId = turnOrder[nextActiveIdx];
          const delay = setTimeout(() => {
            if (players[targetPlayerId]) {
               const randomCardIndex = Math.floor(Math.random() * players[targetPlayerId].hand.length);
               handleDrawCard(targetPlayerId, randomCardIndex);
            }
          }, 1500);
          return () => clearTimeout(delay);
        }
      }
    }
  }, [currentTurnIndex, status, game]);

  // Handle effect clear
  const [showEffect, setShowEffect] = useState<'JOKER' | 'PAIR' | 'ESCAPE' | null>(null);
  useEffect(() => {
    if (effect && game.effectTimestamp) {
      setShowEffect(effect);
      const timer = setTimeout(() => setShowEffect(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [effect, game.effectTimestamp]);


  const renderPlayer = (pid: string, position: 'bottom' | 'left' | 'top' | 'right') => {
    if (!pid) return null;
    const pState = players[pid];
    if (!pState) return null;
    
    const isMe = pid === currentUser.uid;
    const name = session.players[pid]?.nickname || pid;
    const isTarget = status === 'PLAYING' && targetPid === pid;
    const amICurrent = isMyTurn;

    const vertical = position === 'left' || position === 'right';
    
    if (position === 'bottom') {
      return (
        <div className="mt-auto flex flex-col items-center pt-8 border-t border-green-700/50 w-full z-10 relative">
          <div className="font-bold mb-4 text-xl flex items-center gap-2">
            <span className={turnOrder[currentTurnIndex] === pid ? 'text-yellow-400 font-black' : ''}>{name}</span>
            {!pState.isActive && <span className="text-sm bg-black/50 px-2 py-1 rounded text-white font-bold">탈출 성공! 🎉</span>}
          </div>
          <div className="flex -space-x-4 md:-space-x-8 max-w-full overflow-x-auto p-4 items-end min-h-[160px]">
            <AnimatePresence>
              {pState.hand.map(card => (
                <motion.div
                  key={card.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, y: -50, opacity: 0 }}
                  className="flex-shrink-0"
                >
                  <Card value={card.value} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      );
    }

    return (
      <div className={\`absolute flex flex-col items-center \${
        position === 'top' ? 'top-4' : 
        position === 'left' ? 'left-2 md:left-8' : 'right-2 md:right-8'
      }\`}>
        <div className={\`font-bold mb-2 flex items-center gap-2 text-sm md:text-base \${turnOrder[currentTurnIndex] === pid ? 'text-yellow-400 bg-black/40 px-3 py-1 rounded-full' : 'bg-black/20 px-3 py-1 rounded-full'}\`}>
          <User className="w-4 h-4" /> {name}
          {!pState.isActive && <span className="text-xs bg-red-600 px-2 py-1 rounded font-bold">탈출</span>}
        </div>
        <div className={\`flex \${vertical ? 'flex-col -space-y-12 md:-space-y-16' : '-space-x-4 md:-space-x-8'}\`}>
          {pState.hand.map((c, i) => {
            return (
              <Card 
                key={c.id} 
                isBack 
                isTarget={isTarget} 
                onClick={() => {
                  if (isTarget && amICurrent) handleDrawCard(pid, i);
                }} 
              />
            )
          })}
        </div>
      </div>
    );
  };

  const isShake = showEffect === 'JOKER';

  return (
    <div className={\`w-full max-w-5xl mx-auto h-full min-h-[600px] flex flex-col bg-[#1A4D2E] text-white rounded-lg shadow-2xl relative overflow-hidden transition-all duration-300 \${isShake ? 'animate-pulse bg-red-900 scale-[1.02]' : ''}\`}>
      {/* Effect Overlays */}
      <AnimatePresence>
        {showEffect === 'PAIR' && (
          <motion.div initial={{ scale: 0, opacity: 0, rotate: -20 }} animate={{ scale: 1.5, opacity: 1, rotate: 0 }} exit={{ opacity: 0, scale: 2 }} className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <h2 className="text-8xl font-black text-yellow-300 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">짝!</h2>
          </motion.div>
        )}
        {showEffect === 'ESCAPE' && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.2, opacity: 1 }} exit={{ opacity: 0, scale: 2 }} className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/40">
            <h2 className="text-6xl md:text-8xl font-black text-[#50C878] drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">탈출 성공!</h2>
          </motion.div>
        )}
      </AnimatePresence>

      {status === 'PLAYING' && (
        <div className="flex-1 flex flex-col p-4 relative">
          <div className="text-center mt-2 mb-4 z-20">
            <div className="inline-block bg-black/60 border border-yellow-500/30 py-3 px-8 rounded-full shadow-2xl backdrop-blur-sm transform hover:scale-105 transition-transform">
              <span className="font-black text-xl md:text-2xl text-yellow-400">
                {isMyTurn ? '🚨 내 차례입니다! 카드를 뽑아주세요 🚨' : \`\${session.players[turnOrder[currentTurnIndex]]?.nickname || turnOrder[currentTurnIndex]}님의 턴!\`}
              </span>
              {message && <div className="text-sm md:text-base text-gray-300 mt-1">{message}</div>}
            </div>
          </div>

          <div className="flex-1 relative flex items-center justify-center mt-8 md:mt-0">
            {renderPlayer(topId, 'top')}
            {renderPlayer(leftId, 'left')}
            {renderPlayer(rightId, 'right')}
          </div>

          {renderPlayer(bottomId, 'bottom')}
        </div>
      )}

      {status === 'FINISHED' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-black/90 z-50 space-y-8 absolute inset-0">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1 }}
            className="text-center space-y-6"
          >
            <h3 className="text-3xl text-gray-400 mb-8 font-bold">마지막 조커의 주인공은...</h3>
            
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 2.5, type: 'spring', bounce: 0.6 }}
              className="bg-[#3A1015] p-10 rounded-3xl text-center border-4 border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)]"
            >
              <div className="text-7xl mb-6">🃏</div>
              <div className="text-6xl font-black text-red-500 mb-4 break-keep">
                {session.players[loserId!]?.nickname || loserId}
              </div>
              {loserId === currentUser.uid ? (
                <p className="text-3xl font-bold text-yellow-300 mt-6">조커 당첨! 당신의 패배입니다 😱</p>
              ) : (
                <p className="text-3xl font-bold text-yellow-300 mt-6">최후의 조커 당첨! 🎉</p>
              )}
            </motion.div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4 }}
            onClick={startGame}
            className="px-10 py-4 bg-[#E8B81C] hover:bg-yellow-500 text-yellow-900 rounded-full font-black text-2xl transition flex items-center gap-3 shadow-[0_0_20px_rgba(232,184,28,0.4)]"
          >
            <RefreshCw className="w-6 h-6" />
            다시 한 판!
          </motion.button>
        </div>
      )}
    </div>
  );
}

const Card = ({ value, isBack, isTarget, onClick }: { value?: string, isBack?: boolean, isTarget?: boolean, onClick?: () => void }) => {
  if (isBack) {
    return (
      <div 
        onClick={onClick}
        className={\`
          w-14 h-20 sm:w-20 sm:h-28 md:w-24 md:h-36 rounded-xl bg-gradient-to-br from-red-800 to-red-950 border-2 border-white/20 flex-shrink-0
          shadow-[2px_2px_10px_rgba(0,0,0,0.6)] flex items-center justify-center relative overflow-hidden
          \${isTarget ? 'cursor-pointer hover:-translate-y-4 hover:shadow-[0_0_25px_#E8B81C] border-[#E8B81C] border-4 transition-all z-20' : ''}
          \${isTarget ? 'animate-pulse' : ''}
        \`}
      >
        <div className="absolute inset-1 sm:inset-2 border-2 border-red-400/30 rounded-lg flex items-center justify-center bg-red-900/50">
           <div className="text-red-950 opacity-20 text-4xl">🂠</div>
        </div>
      </div>
    );
  }

  const isJoker = value === 'JOKER';

  return (
    <div className={\`
      w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36 rounded-xl bg-white border-2 border-gray-200 flex-shrink-0
      shadow-[4px_4px_15px_rgba(0,0,0,0.4)] flex flex-col justify-between p-1 sm:p-2
      \${isJoker ? 'text-purple-700 bg-gradient-to-br from-purple-50 to-pink-50' : 'text-gray-900'}
      hover:-translate-y-6 transition-transform duration-300 z-10 cursor-default
    \`}>
      <div className={\`font-black text-sm md:text-xl leading-none\`}>
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
};
`

fs.writeFileSync('src/components/OldMaid.tsx', code);
