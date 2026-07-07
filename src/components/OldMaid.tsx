import React, { useState, useEffect, useRef } from 'react';
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
        <div className="w-full max-w-4xl mx-auto h-full min-h-[400px] md:min-h-[600px] flex flex-col bg-[#1A4D2E] text-white rounded-lg shadow-2xl relative overflow-hidden items-center justify-center p-8 text-center space-y-6">
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
      <div className="w-full max-w-4xl mx-auto h-full min-h-[400px] md:min-h-[600px] flex flex-col bg-[#1A4D2E] text-white rounded-lg shadow-2xl relative overflow-hidden items-center justify-center space-y-6">
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

  const { players, turnOrder, currentTurnIndex, status, loserId, effect, message, drawingState, turnStartTime } = game;
  const isMyTurn = turnOrder[currentTurnIndex] === currentUser.uid;
  const currentTurnPid = turnOrder[currentTurnIndex];
  
  const TURN_LIMIT = 15;
  const [timeLeft, setTimeLeft] = useState(TURN_LIMIT);

  useEffect(() => {
    if (status === 'PLAYING' && !drawingState) {
      const start = turnStartTime || game.startTime;
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - start) / 1000);
        const remain = Math.max(0, TURN_LIMIT - elapsed);
        setTimeLeft(remain);

        // Auto-draw if time is up and it's my turn
        if (remain === 0 && isMyTurn) {
          const nextActiveIdx = getNextActivePlayerIndex(currentTurnIndex);
          if (nextActiveIdx !== -1) {
            const targetPlayerId = turnOrder[nextActiveIdx];
            const targetHand = players[targetPlayerId]?.hand || [];
            if (targetHand.length > 0) {
              const randomCardIndex = Math.floor(Math.random() * targetHand.length);
              initiateDraw(targetPlayerId, randomCardIndex);
            }
          }
        }
      }, 400);
      return () => clearInterval(timer);
    }
  }, [status, isMyTurn, turnStartTime, game.startTime, drawingState, currentTurnIndex, players, turnOrder]);
  
  let meIndex = turnOrder.indexOf(currentUser.uid);
  if (meIndex === -1) {
    meIndex = 0;
  }

  const visualOrder = [];
  for (let i = 0; i < 4; i++) {
    visualOrder.push(turnOrder[(meIndex + i) % 4]);
  }
  const [bottomId, leftId, topId, rightId] = visualOrder;

  const getNextActivePlayerIndex = (startIndex: number, playersState: any = players) => {
    let index = (startIndex + 1) % 4;
    while (index !== startIndex) {
      if (playersState[turnOrder[index]]?.isActive) return index;
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
    const activePlayers = turnOrder.filter(pid => playersState[pid]?.isActive);
    if (activePlayers.length === 1) {
      return activePlayers[0];
    }
    return null;
  };

  const initiateDraw = async (targetId: string, cardIndex: number) => {
    if (status !== 'PLAYING' || drawingState) return;
    const currentPid = turnOrder[currentTurnIndex];
    if (currentPid !== currentUser.uid && !currentPid.startsWith('CPU_')) return;
    if (!players[currentPid]?.isActive) return;
    
    await sessionService.updateOldMaidGame(session.id, { 
      drawingState: { pid: targetId, cardIndex, drawer: turnOrder[currentTurnIndex], timestamp: Date.now() } 
    });
  };

  const processedDrawRef = useRef<number | null>(null);

  useEffect(() => {
    if (drawingState && drawingState.drawer === currentUser.uid) {
      if (processedDrawRef.current === drawingState.timestamp) return;

      const elapsed = Date.now() - drawingState.timestamp;
      const delay = Math.max(0, 400 - elapsed); // 2.5 seconds suspense
      const timer = setTimeout(() => {
        processedDrawRef.current = drawingState.timestamp;
        handleDrawCard(drawingState.pid, drawingState.cardIndex);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [drawingState, currentUser.uid]);

  const handleDrawCard = async (targetId: string, cardIndex: number) => {
    if (status !== 'PLAYING') return;
    if (turnOrder[currentTurnIndex] !== currentUser.uid && !turnOrder[currentTurnIndex].startsWith('CPU_')) {
      return; 
    }

    const fromPid = targetId;
    const toPid = turnOrder[currentTurnIndex];

    const fromPlayer = players[fromPid];
    const toPlayer = players[toPid];
    
    if (!fromPlayer?.isActive || !toPlayer?.isActive) return;

    const drawnCard = (fromPlayer.hand || [])[cardIndex];
    if (!drawnCard) return;
    let newHandFrom = [...(fromPlayer.hand || [])];
    newHandFrom.splice(cardIndex, 1);
    
    let newHandTo = [...(toPlayer.hand || []), drawnCard];

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

    let eff: string | null = null;
    let msg = "";
    
    if (drawnCard.value === 'JOKER') {
      eff = `JOKER_${toPid}`;
      msg = `${session.players[toPid]?.nickname || toPid}님이 카드를 뽑았습니다.`;
    } else {
      if (pairMatched) {
        if (newHandTo.length === 0) {
          eff = 'ESCAPE';
          msg = `${session.players[toPid]?.nickname || toPid}님 탈출 성공!`;
        } else {
          eff = 'PAIR';
          msg = `${session.players[toPid]?.nickname || toPid}님이 짝을 맞췄습니다!`;
        }
      } else {
        msg = `${session.players[toPid]?.nickname || toPid}님이 카드를 뽑았습니다.`;
      }
    }

    const nextTurn = getNextActivePlayerIndex(currentTurnIndex, newPlayers);
    const loser = checkGameEnd(newPlayers);

    const updates: any = {
      players: newPlayers,
      effect: eff,
      effectTimestamp: Date.now(),
      message: msg,
      drawingState: null
    };

    if (loser) {
      updates.status = 'FINISHED';
      updates.loserId = loser;
    } else {
      updates.currentTurnIndex = nextTurn;
      updates.turnStartTime = Date.now();
    }

    await sessionService.updateOldMaidGame(session.id, updates);
  };

  useEffect(() => {
    if (status === 'PLAYING') {
      const currentPid = turnOrder[currentTurnIndex];
      const isCpuTurn = currentPid?.startsWith('CPU_');
      
      const realPlayers = turnOrder.filter(pid => !pid.startsWith('CPU_'));
      const imResponsible = (isHost && realPlayers.includes(currentUser.uid)) || realPlayers[0] === currentUser.uid;

      if (imResponsible && !players[currentPid]?.isActive) {
        // Auto-skip inactive players
        const nextActiveIdx = getNextActivePlayerIndex(currentTurnIndex);
        if (nextActiveIdx !== -1) {
          sessionService.updateOldMaidGame(session.id, { currentTurnIndex: nextActiveIdx });
        }
      } else if (isCpuTurn && imResponsible && players[currentPid]?.isActive) {
        const nextActiveIdx = getNextActivePlayerIndex(currentTurnIndex);
        if (nextActiveIdx !== -1) {
          const targetPlayerId = turnOrder[nextActiveIdx];
          const delay = setTimeout(() => {
            if (players[targetPlayerId] && (players[targetPlayerId].hand || []).length > 0) {
               const randomCardIndex = Math.floor(Math.random() * (players[targetPlayerId].hand || []).length);
               handleDrawCard(targetPlayerId, randomCardIndex);
            }
          }, 400);
          return () => clearTimeout(delay);
        }
      }
    }
  }, [currentTurnIndex, status, game]);

  const [showFinishedScreen, setShowFinishedScreen] = useState(false);
  useEffect(() => {
    if (status === 'FINISHED') {
      const timer = setTimeout(() => setShowFinishedScreen(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowFinishedScreen(false);
    }
  }, [status]);

  const [showEffect, setShowEffect] = useState<string | null>(null);
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string, pid: string, emoji: string }[]>([]);
  
  useEffect(() => {
    if (effect && game.effectTimestamp) {
      if (effect.startsWith('JOKER_')) {
        const drawerId = effect.split('_')[1];
        if (drawerId === currentUser.uid) {
          setShowEffect('JOKER');
        } else {
          setShowEffect(null);
        }
        
      } else if (effect.startsWith('EMOJI_')) {
        const parts = effect.split('_');
        const pid = parts[1];
        const emoji = parts[2];
        const id = Date.now() + Math.random().toString();
        setFloatingEmojis(prev => [...prev, { id, pid, emoji }]);
        setTimeout(() => {
          setFloatingEmojis(prev => prev.filter(e => e.id !== id));
        }, 2000);
      } else {
        setShowEffect(effect);
        
        
      }
      
      let duration = 1000;
      if (effect && effect.startsWith('JOKER_')) {
        duration = 800;
      }
      const timer = setTimeout(() => setShowEffect(null), duration);
      return () => clearTimeout(timer);
    }
  }, [effect, game.effectTimestamp, currentUser.uid]);

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
        <div className="flex flex-col items-center pt-2 md:pt-4 pb-2 md:pb-4 border-t-2 border-green-700/50 w-full z-10 relative bg-black/20 backdrop-blur-sm">
          {/* Render Emojis for bottom player */}
          <AnimatePresence>
            {floatingEmojis.filter(e => e.pid === pid).map(e => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 0, scale: 0.5 }}
                animate={{ opacity: 1, y: -80, scale: 2.5 }}
                exit={{ opacity: 0, y: -150 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute top-[-40px] left-1/2 -translate-x-1/2 z-50 pointer-events-none text-6xl"
              >
                {e.emoji}
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="font-bold mb-4 text-xl flex items-center gap-2">
            <span className={turnOrder[currentTurnIndex] === pid ? 'text-yellow-400 font-black' : ''}>{name}</span>
            {!pState.isActive && <span className="text-sm bg-black/50 px-2 py-1 rounded text-white font-bold">탈출 성공! 🎉</span>}
            {pState.isActive && isMe && status === 'PLAYING' && (
              <div className="flex items-center ml-4 gap-1">
                {['😂', '😭', '😡', '👍', '😱'].map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => sessionService.sendOldMaidEmoji(session.id, pid, emoji)}
                    className="p-1 hover:bg-white/20 rounded-full transition-transform active:scale-90 text-xl"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
            {pState.isActive && isMe && status === 'PLAYING' && (
              <button 
                onClick={() => sessionService.shuffleOldMaidHand(session.id, pid)}
                className="ml-4 px-4 py-2 bg-blue-500 hover:bg-blue-400 border border-blue-300 rounded-full text-sm font-black flex items-center gap-2 shadow-xl transition-all active:scale-95 text-white"
              >
                <RefreshCw className="w-4 h-4" /> 카드 섞기
              </button>
            )}
          </div>
          <div className="flex flex-nowrap justify-center -space-x-[1rem] sm:-space-x-[2rem] md:-space-x-[3rem] p-4 md:p-6 w-full pb-8 px-8">
            <AnimatePresence>
              {(pState.hand || []).map((card, i) => (
                <motion.div
                  key={card.id || i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, y: -50, opacity: 0 }}
                  className="flex-shrink-0 transition-transform duration-200 hover:-translate-y-6 hover:z-30 relative"
                >
                  <Card value={card.value} suit={card.suit} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      );
    }

    return (
      <div className={`flex flex-col items-center justify-center relative`}>
        {/* Render Emojis for opponents */}
        <AnimatePresence>
          {floatingEmojis.filter(e => e.pid === pid).map(e => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -50, scale: 2 }}
              exit={{ opacity: 0, y: -100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none text-4xl"
            >
              {e.emoji}
            </motion.div>
          ))}
        </AnimatePresence>

        <div className={`font-bold mb-2 flex items-center gap-2 text-sm md:text-base ${turnOrder[currentTurnIndex] === pid ? 'text-yellow-400 bg-black/40 px-3 py-1 rounded-full' : 'bg-black/20 px-3 py-1 rounded-full'}`}>
          <User className="w-4 h-4" /> {name}
          {!pState.isActive && <span className="text-xs bg-red-600 px-2 py-1 rounded font-bold">탈출</span>}
        </div>
        <div className={`flex ${vertical ? 'flex-col -space-y-[2.2rem] sm:-space-y-[4.2rem] md:-space-y-[5.5rem] py-4' : 'flex-nowrap justify-center -space-x-[1.2rem] sm:-space-x-[2.2rem] md:-space-x-[3.2rem] px-4'} items-center justify-center`}>
          {(pState.hand || []).map((c, i) => {
            return (
              <div 
                key={c.id || i} 
                className={`transition-transform duration-200 ${isTarget && amICurrent && !drawingState ? 'hover:-translate-y-4 hover:scale-110 cursor-pointer' : ''}`}
                onClick={() => {
                  if (isTarget && amICurrent && !drawingState) initiateDraw(pid, i);
                }} 
              >
                <Card 
                  value={c.value}
                  suit={c.suit}
                  isBack={!(status === 'FINISHED' && pid === loserId) && !isMe} 
                  isTarget={isTarget && amICurrent}
                />
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  const isShake = showEffect === 'JOKER';
  const showJokerScreen = showEffect === 'JOKER';

  return (
    <div className={`w-full max-w-4xl mx-auto aspect-square lg:aspect-[4/3] min-h-[450px] max-h-[85vh] flex flex-col bg-[#1A4D2E] text-white rounded-lg shadow-[inset_0_0_50px_rgba(0,0,0,0.8),0_25px_50px_-12px_rgba(0,0,0,0.5)] relative overflow-hidden transition-all duration-300 ${isShake ? 'animate-[shake_0.5s_ease-in-out_infinite] scale-[1.02]' : ''}`}>
            <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
      <style>{`
        @keyframes shake {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(3px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(3px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(1px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }
      `}</style>

      {/* Effect Overlays */}
      <AnimatePresence>
        {drawingState && (
          <motion.div key="drawing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 bg-black/70 flex flex-col items-center justify-center backdrop-blur-md">
             <div className="text-center space-y-8 bg-black/50 p-10 rounded-2xl border border-gray-700 shadow-2xl">
                <h3 className="text-2xl md:text-4xl font-bold text-white tracking-wide">
                  {session.players[drawingState.drawer]?.nickname || drawingState.drawer}님이<br/>
                  <span className="text-yellow-400 block mt-2">카드를 조심스럽게 확인 중입니다...</span>
                </h3>
                
                <div className="w-64 h-3 bg-gray-900 rounded-full overflow-hidden mx-auto shadow-inner border border-gray-800">
                   <motion.div 
                     initial={{ width: "0%" }} 
                     animate={{ width: "100%" }} 
                     transition={{ duration: 0.4, ease: "linear" }}
                     className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.5)]"
                   />
                </div>
             </div>
          </motion.div>
        )}
        {showJokerScreen && (
          <motion.div key="joker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50 pointer-events-none text-center p-8">
            <div className="text-9xl mb-8 animate-bounce">🃏</div>
            <h2 className="text-4xl md:text-6xl font-black text-red-500 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">조커 발견!!</h2>
            <p className="text-2xl mt-4 text-gray-300">앗! 위험한 카드를 뽑았습니다...</p>
          </motion.div>
        )}
        {showEffect === 'PAIR' && (
          <motion.div key="pair" initial={{ scale: 0, opacity: 0, rotate: -20 }} animate={{ scale: 1.5, opacity: 1, rotate: 0 }} exit={{ opacity: 0, scale: 2 }} className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <h2 className="text-8xl font-black text-yellow-300 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">짝!</h2>
          </motion.div>
        )}
        {showEffect === 'ESCAPE' && (
          <motion.div key="escape" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1.2, opacity: 1 }} exit={{ opacity: 0, scale: 2 }} className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none bg-black/40">
            <h2 className="text-6xl md:text-8xl font-black text-[#50C878] drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">탈출 성공!</h2>
          </motion.div>
        )}
      </AnimatePresence>

      {(status === 'PLAYING' || (status === 'FINISHED' && !showFinishedScreen)) && (
        <div className="flex-1 flex flex-col pt-4">
          <div className="flex-1 relative w-full h-full min-h-0 overflow-hidden">
          {/* Top Player */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
            {renderPlayer(topId, 'top')}
          </div>
          
          {/* Left Player */}
          <div className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-10 flex flex-col items-start">
            {renderPlayer(leftId, 'left')}
          </div>
          
          {/* Center Status / Timer */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center">
            <div className={`inline-block bg-black/70 border border-yellow-500/30 py-3 px-6 md:py-4 md:px-10 rounded-full shadow-2xl backdrop-blur-md transform transition-transform ${isMyTurn && status === 'PLAYING' ? 'scale-105 border-yellow-400 border-2 shadow-[0_0_20px_rgba(250,204,21,0.5)]' : ''}`}>
              <span className="font-black text-lg md:text-3xl text-yellow-400 text-center block leading-tight">
                {status === 'FINISHED' ? '게임 종료!' : (isMyTurn ? '🚨 내 차례! 카드를 뽑으세요' : `${session.players[currentTurnPid]?.nickname || currentTurnPid}님의 턴`)}
              </span>
              {message && status === 'PLAYING' && <div className="text-sm md:text-xl text-yellow-100 mt-1 md:mt-2 font-bold text-center">{message}</div>}
              {status === 'PLAYING' && !drawingState && (
                <div className="mt-2 md:mt-4 flex items-center justify-center gap-2 md:gap-3 pointer-events-auto">
                   <div className="w-[120px] md:w-[200px] h-3 md:h-4 bg-black/80 rounded-full overflow-hidden border border-gray-600">
                      <div className={`h-full transition-all duration-1000 ${timeLeft <= 5 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} style={{ width: `${(timeLeft / TURN_LIMIT) * 100}%` }}></div>
                   </div>
                   <span className={`font-bold text-lg md:text-xl ${timeLeft <= 5 ? 'text-red-400 font-black scale-110 transition-transform' : 'text-gray-300'}`}>{timeLeft}초</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Player */}
          <div className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-10 flex flex-col items-end">
            {renderPlayer(rightId, 'right')}
          </div>

          {/* Bottom Player (Me) */}
          <div className="absolute bottom-0 left-0 w-full z-30">
            {renderPlayer(bottomId, 'bottom')}
          </div>
        </div>
        </div>
      )}

      {status === 'FINISHED' && showFinishedScreen && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-black/90 z-50 space-y-8 absolute inset-0">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1 }}
            className="text-center space-y-6"
          >
            <h3 className="text-3xl md:text-5xl text-gray-300 mb-8 font-black">마지막 조커의 주인공은...</h3>
            
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

const Card = ({ value, suit, isBack, isTarget, onClick }: { value?: string, suit?: string, isBack?: boolean, isTarget?: boolean, onClick?: () => void }) => {
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
};
