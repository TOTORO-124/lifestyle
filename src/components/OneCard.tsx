import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Session, OneCardCard } from '../types';
import { sessionService } from '../services/sessionService';
import { isPlayable } from '../game/cardUtils';

const suitSymbols: Record<string, { symbol: string, color: string }> = {
  spades: { symbol: '♠', color: 'text-slate-800' },
  hearts: { symbol: '♥', color: 'text-rose-600' },
  diamonds: { symbol: '♦', color: 'text-rose-600' },
  clubs: { symbol: '♣', color: 'text-slate-800' },
  joker: { symbol: '🃏', color: 'text-purple-600' }
};

const CardView = ({ card, isPlayable = false, onClick, hidden = false, className = "" }: { card?: OneCardCard, isPlayable?: boolean, onClick?: () => void, hidden?: boolean, className?: string }) => {
  if (hidden || !card) {
    return (
      <div className={`w-16 h-24 sm:w-24 sm:h-36 bg-indigo-900 border-[3px] border-white/20 rounded-xl shadow-lg flex items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-600 to-indigo-900 ${className}`}>
        <div className="w-12 h-20 sm:w-16 sm:h-28 border-2 border-indigo-400/30 rounded-lg flex items-center justify-center pattern-diagonal-lines pattern-indigo-500 pattern-bg-transparent pattern-size-2 pattern-opacity-20">
           <span className="text-white font-black opacity-40 text-lg sm:text-2xl -rotate-45 tracking-tighter drop-shadow-md">1CARD</span>
        </div>
      </div>
    );
  }

  const { symbol, color } = suitSymbols[card.suit];
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
        className={`relative w-16 h-24 sm:w-24 sm:h-36 bg-white rounded-xl shadow-md flex flex-col justify-between p-1.5 sm:p-2 border-[3px] ${isPlayable ? 'border-green-400 cursor-pointer shadow-[0_5px_15px_rgba(74,222,128,0.4)]' : 'border-gray-200 opacity-50'} transition-all ${className}`}
      >
        <div className={`text-left text-[10px] sm:text-xs font-black ${jokerColor} leading-none tracking-tighter`}>
          <div>JOKER</div>
        </div>
        <div className={`text-center text-4xl sm:text-5xl absolute inset-0 flex items-center justify-center ${isColorJoker ? 'opacity-90' : 'opacity-70 grayscale'}`}>
           🃏
        </div>
        <div className={`text-right text-[10px] sm:text-xs font-black ${jokerColor} leading-none rotate-180 tracking-tighter`}>
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
      className={`relative w-16 h-24 sm:w-24 sm:h-36 bg-white rounded-xl shadow-md flex flex-col justify-between p-2 border-[3px] ${isPlayable ? 'border-green-400 cursor-pointer shadow-[0_5px_15px_rgba(74,222,128,0.4)]' : 'border-gray-200 opacity-50'} transition-all ${className}`}
    >
      <div className={`text-left text-sm sm:text-xl font-black ${color} leading-none`}>
        <div>{displayRank}</div>
        <div className="text-xs sm:text-lg">{symbol}</div>
      </div>
      <div className={`text-center text-4xl sm:text-5xl absolute inset-0 flex items-center justify-center opacity-20 ${color}`}>
         {symbol}
      </div>
      <div className={`text-right text-sm sm:text-xl font-black ${color} leading-none rotate-180`}>
        <div>{displayRank}</div>
        <div className="text-xs sm:text-lg">{symbol}</div>
      </div>
    </motion.button>
  );
};

export default function OneCard({ session, currentUser, onLeave }: { session: Session; currentUser: any; onLeave?: () => void }) {
  const gameState = session.oneCardGame;
  const [suitPickerOpen, setSuitPickerOpen] = useState(false);
  const [pendingCardIndex, setPendingCardIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [oneCardDeclared, setOneCardDeclared] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // Scroll ref for horizontal scrolling
  const handScrollRef = useRef<HTMLDivElement>(null);

  if (!gameState) return null;

  const myId = currentUser.uid;
  const isHost = session.hostId === myId;
  
  if (gameState.status === 'FINISHED') {
    const isBankrupt = gameState.loserId && gameState.players[gameState.loserId]?.hand.length >= 20;
    return (
      <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center z-[100] p-4 sm:p-8 text-center text-white overflow-y-auto">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl sm:text-8xl mb-6 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]">
          {isBankrupt ? '💸' : '🎯'}
        </motion.div>
        <h2 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 mb-2 drop-shadow-lg leading-tight">
          게임 종료!
        </h2>
        {gameState.loserId && (
          <p className="text-xl sm:text-3xl font-bold text-rose-400 mb-6">
            {session.players[gameState.loserId]?.nickname || '컴퓨터'}님 {isBankrupt ? '파산 (12장 초과)' : '패배'}! 꼴찌입니다.
          </p>
        )}
        
        {gameState.rankings && gameState.rankings.length > 0 && (
          <div className="bg-slate-800/80 rounded-2xl p-6 mb-8 w-full max-w-md border border-slate-700 shadow-xl">
            <h3 className="text-2xl font-black text-slate-200 mb-4">순위</h3>
            <ul className="space-y-3">
              {gameState.rankings.map((pid, idx) => (
                <li key={pid} className="flex justify-between items-center text-lg bg-slate-700/50 p-3 rounded-xl">
                  <span className="font-bold text-slate-300">{idx + 1}등</span>
                  <span className="font-bold text-white">{session.players[pid]?.nickname || '컴퓨터'}</span>
                </li>
              ))}
              {gameState.loserId && (
                <li className="flex justify-between items-center text-lg bg-rose-900/30 border border-rose-500/30 p-3 rounded-xl">
                  <span className="font-bold text-rose-400">{gameState.rankings.length + 1}등 (꼴찌)</span>
                  <span className="font-bold text-rose-100">{session.players[gameState.loserId]?.nickname || '컴퓨터'}</span>
                </li>
              )}
            </ul>
          </div>
        )}
        
        <div className="flex gap-4">
          {isHost && (
            <button 
              onClick={() => sessionService.startOneCardGame(session.id)}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full text-xl shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-transform active:scale-95"
            >
              다시 하기
            </button>
          )}
          <button 
            onClick={() => onLeave ? onLeave() : window.location.reload()}
            className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-full text-xl transition-transform active:scale-95"
          >
            나가기
          </button>
        </div>
      </div>
    );
  }

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 2000);
  };

  const isSpectator = !session.players[myId];
  const me = isSpectator ? null : session.players[myId];
  const myState = me ? gameState.players[myId] : null;

  const currentTurnId = gameState.turnOrder[gameState.currentTurnIndex];
  const myTurn = !isSpectator && currentTurnId === myId && !suitPickerOpen;

  const topCard = gameState.discardPile[gameState.discardPile.length - 1];

  const handlePlayerPlay = (card: OneCardCard, index: number) => {
    if (!myTurn) {
      showError("자신의 턴이 아닙니다!");
      return;
    }
    
    if (isPlayable(card as any, topCard as any, gameState.currentSuit as any, gameState.penaltyStack)) {
      if (card.rank === '7' || card.suit === 'joker') {
        setPendingCardIndex(index);
        setSuitPickerOpen(true);
      } else {
        sessionService.playOneCard(session.id, myId, index);
        setOneCardDeclared(false);
      }
    } else {
      if (gameState.penaltyStack > 0) {
        showError("방어 가능한 카드가 아닙니다! 더 높은 공격 카드나 3(방어) 카드를 내세요.");
      } else {
        showError("현재 낼 수 없는 카드입니다. 무늬나 숫자가 같아야 합니다.");
      }
    }
  };

  const handleSuitPick = (suit: string) => {
    if (pendingCardIndex !== null) {
      sessionService.playOneCard(session.id, myId, pendingCardIndex, suit);
      setOneCardDeclared(false);
    }
    setSuitPickerOpen(false);
    setPendingCardIndex(null);
  };

  const handlePlayerDraw = () => {
    if (!myTurn) return;
    sessionService.drawOneCard(session.id, myId);
    setOneCardDeclared(false);
  };

  const handleDeclareOneCard = () => {
    setOneCardDeclared(true);
    showError("원카드를 선언했습니다!");
  };

  // Prepare opponents list
  const opponentIds = gameState.turnOrder.filter(id => id !== myId);

  // Wheel horizontal scroll for hand
  const handleHandScroll = (e: React.WheelEvent) => {
    if (handScrollRef.current) {
      handScrollRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 text-slate-100 relative overflow-hidden font-sans">
      
      {/* Rules Modal */}
      <AnimatePresence>
        {showRules && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-800 rounded-2xl p-6 sm:p-8 max-w-2xl w-full border border-slate-700 shadow-2xl overflow-y-auto max-h-[85vh] scrollbar-hide relative"
            >
              <button 
                onClick={() => setShowRules(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-700/50 hover:bg-slate-600 text-slate-300 transition-colors"
              >
                ✕
              </button>
              
              <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-6 drop-shadow-sm">
                1CARD 룰 안내
              </h2>
              
              <div className="space-y-6 text-sm sm:text-base text-slate-300">
                <section>
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs">1</span>
                    기본 룰
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-slate-400">
                    <li>바닥에 있는 카드와 <span className="text-indigo-300 font-bold">무늬</span> 또는 <span className="text-indigo-300 font-bold">숫자(기호)</span>가 같은 카드만 낼 수 있습니다.</li>
                    <li>낼 카드가 없거나 내기 싫다면 덱(뒷면 카드)을 눌러서 1장을 먹어야 합니다.</li>
                    <li>손에 든 카드를 모두 없애면 승리합니다.</li>
                  </ul>
                </section>
                
                <section>
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-rose-500/20 text-rose-300 flex items-center justify-center text-xs">⚔</span>
                    공격 카드
                  </h3>
                  <p className="text-xs text-slate-500 mb-2">공격을 받으면 다음 사람은 공격 카드를 내서 누적시키거나(더 쎈 공격가능), 방어 카드를 내거나, 덱에서 카드를 먹어야 합니다. <strong className="text-rose-400">카드가 12장을 초과하면 파산(게임 오버)</strong>됩니다.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-700/30 p-3 rounded-xl border border-slate-700">
                      <div className="font-black text-white text-lg">2</div>
                      <div className="text-rose-400 font-bold mb-1">공격력: 2장</div>
                      <div className="text-xs text-slate-400">다음 사람에게 2장을 먹입니다.</div>
                    </div>
                    <div className="bg-slate-700/30 p-3 rounded-xl border border-slate-700">
                      <div className="font-black text-white text-lg">A</div>
                      <div className="text-rose-400 font-bold mb-1">공격력: 3장 (스페이드 A는 5장)</div>
                      <div className="text-xs text-slate-400">다음 사람에게 3장(또는 5장)을 먹입니다.</div>
                    </div>
                    <div className="bg-slate-700/30 p-3 rounded-xl border border-slate-700">
                      <div className="font-black text-slate-300 text-lg">흑백 조커</div>
                      <div className="text-purple-400 font-bold mb-1">공격력: 5장</div>
                      <div className="text-xs text-slate-400">어떤 상황에서든 낼 수 있습니다.</div>
                    </div>
                    <div className="bg-slate-700/30 p-3 rounded-xl border border-slate-700">
                      <div className="font-black text-rose-400 text-lg">컬러 조커</div>
                      <div className="text-purple-400 font-bold mb-1">공격력: 7장</div>
                      <div className="text-xs text-slate-400">무적의 카드! 낼 때 무늬도 바꿀 수 있습니다.</div>
                    </div>
                  </div>
                </section>
                
                <section>
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs">🛡</span>
                    방어 카드
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-slate-400">
                    <li>공격은 <span className="text-emerald-400 font-bold">같은 등급이거나 더 쎈 공격 카드</span>로 막으면서 다음 사람에게 누적시킬 수 있습니다. (예: 2는 A나 조커로 방어 가능하지만, A는 2로 방어 불가)</li>
                    <li><span className="text-white font-bold">3 카드:</span> 같은 무늬의 3(방어 카드)을 내면 공격을 <span className="text-emerald-400">방어(무효화)</span>할 수 있습니다! (스페이드 3은 조커 방어 가능)</li>
                  </ul>
                </section>
                
                <section>
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs">★</span>
                    특수 카드
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-700/30 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                      <span className="font-black text-white">7</span>
                      <span className="text-sm text-slate-400 text-right">내고 난 뒤 <span className="text-amber-300">원하는 무늬로 변경</span> 가능</span>
                    </div>
                    <div className="bg-slate-700/30 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                      <span className="font-black text-white">J</span>
                      <span className="text-sm text-slate-400 text-right">다음 사람을 <span className="text-amber-300">점프(건너뜀)</span></span>
                    </div>
                    <div className="bg-slate-700/30 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                      <span className="font-black text-white">Q</span>
                      <span className="text-sm text-slate-400 text-right">게임 진행 방향을 <span className="text-amber-300">반대로(리버스)</span></span>
                    </div>
                    <div className="bg-slate-700/30 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                      <span className="font-black text-white">K</span>
                      <span className="text-sm text-slate-400 text-right">카드 한 장을 <span className="text-amber-300">더 낼 수 있음</span></span>
                    </div>
                  </div>
                </section>
              </div>
              
              <div className="mt-8">
                <button 
                  onClick={() => setShowRules(false)}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg transition-colors shadow-lg active:scale-95"
                >
                  확인했습니다
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <header className="flex-none p-4 flex items-center justify-between bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 shadow-sm z-20">
        <div className="flex items-center gap-4 sm:gap-6">
          <h1 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 tracking-tighter drop-shadow-sm">
            1CARD
          </h1>
          <div className="hidden sm:flex items-center gap-2 text-xs sm:text-sm">
            <span className="text-slate-400">진행 방향:</span>
            <span className="font-bold text-white bg-slate-700 px-3 py-1 rounded-full shadow-inner">
              {gameState.direction === 1 ? '오른쪽 ➔' : '⬅ 왼쪽'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowRules(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 rounded-full font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5"
          >
            <span>룰 보기</span>
          </button>
          {isHost && (
            <button 
              onClick={() => sessionService.startOneCardGame(session.id)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-bold text-xs sm:text-sm transition-colors shadow-sm"
            >
              다시 하기
            </button>
          )}
          <button 
            onClick={() => onLeave ? onLeave() : window.location.reload()}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-rose-900/40 hover:bg-rose-900/60 text-rose-200 border border-rose-800/50 rounded-full font-bold text-xs sm:text-sm transition-colors shadow-sm"
          >
            나가기
          </button>
        </div>
      </header>

      {/* Opponents Area */}
      <div className="flex-none flex justify-center items-start pt-6 px-4 gap-3 sm:gap-8 overflow-x-auto custom-scrollbar min-h-[140px] z-10">
        {opponentIds.map((pid) => {
          const playerState = gameState.players[pid];
          const nickname = session.players[pid]?.nickname || '컴퓨터';
          const isCurrent = pid === currentTurnId;
          const handSize = playerState?.hand?.length || 0;
          return (
            <div key={pid} className={`flex flex-col items-center bg-slate-800/60 backdrop-blur-sm p-3 sm:p-5 rounded-2xl border-2 transition-all duration-300 ${isCurrent ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.4)] -translate-y-2' : 'border-slate-700/50'}`}>
              <span className="font-bold text-xs sm:text-sm whitespace-nowrap mb-3 text-slate-200">{nickname}</span>
              {handSize === 0 ? (
                <div className="flex flex-col items-center justify-center h-16 sm:h-24">
                  <span className="text-3xl sm:text-4xl drop-shadow-md">🏆</span>
                  <span className="text-xs sm:text-sm font-bold text-yellow-400 mt-2">탈출 성공</span>
                </div>
              ) : (
                <>
                  <div className="flex -space-x-4 sm:-space-x-5">
                     {Array.from({ length: Math.min(handSize, 5) }).map((_, i) => (
                       <div key={i} className="transform scale-[0.6] sm:scale-75 -my-8 sm:-my-6 origin-top">
                         <CardView hidden={true} />
                       </div>
                     ))}
                     {handSize > 5 && (
                       <div className="z-10 bg-slate-900 rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] sm:text-xs font-bold -ml-2 sm:-ml-3 border-2 border-slate-700 shadow-md">
                         +{handSize - 5}
                       </div>
                     )}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-black mt-3 px-2 py-0.5 rounded-full ${handSize === 1 ? 'bg-red-500 text-white animate-pulse' : handSize > 9 ? 'bg-rose-900 text-rose-200 animate-pulse' : 'bg-slate-700 text-slate-300'}`}>
                    {handSize}장 {handSize > 9 && ' (위험)'}
                  </span>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Center Table */}
      <div className="flex-1 flex flex-col items-center justify-center relative min-h-[250px]">
        {/* Play Area */}
        <div className="flex items-center gap-6 sm:gap-16 relative z-10">
          {/* Deck */}
          <div className="relative group cursor-pointer" onClick={handlePlayerDraw}>
             <CardView hidden={true} />
             <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-bold text-slate-400 bg-slate-800 px-3 py-1 rounded-full whitespace-nowrap shadow-md border border-slate-700">
               남은 카드 {gameState.deck?.length || 0}
             </div>
             {myTurn && (
               <div className="absolute inset-0 border-[3px] border-green-500 rounded-xl animate-[pulse_2s_ease-in-out_infinite] pointer-events-none"></div>
             )}
          </div>
          
          {/* Discard Pile */}
          <div className="relative">
             <motion.div
               key={topCard.id} // Animate when top card changes
               initial={{ scale: 0.8, rotate: Math.random() * 20 - 10, opacity: 0 }}
               animate={{ scale: 1.1, rotate: Math.random() * 10 - 5, opacity: 1 }}
               transition={{ type: "spring", stiffness: 200, damping: 15 }}
               className="origin-center shadow-2xl z-10 relative"
             >
               <CardView card={topCard} className="sm:scale-110" />
             </motion.div>

             {gameState.currentSuit && suitSymbols[gameState.currentSuit] && (
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-black flex items-center gap-2 shadow-xl border border-gray-200 whitespace-nowrap z-20">
                  무늬: <span className={suitSymbols[gameState.currentSuit].color}>{suitSymbols[gameState.currentSuit].symbol}</span>
                </div>
             )}
          </div>
        </div>
        
        {/* Error Message Toast */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-rose-600/95 px-6 py-3 rounded-full text-white font-bold text-sm shadow-2xl z-50 whitespace-nowrap backdrop-blur-md border border-rose-500"
            >
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Turn Indicator & Penalty */}
        <div className="mt-16 flex flex-col items-center gap-3 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold text-sm">현재 턴:</span>
            <span className="text-lg sm:text-2xl font-black text-white bg-indigo-600 px-5 py-1.5 rounded-full shadow-[0_4px_15px_rgba(79,70,229,0.4)] border border-indigo-400/30">
              {session.players[currentTurnId]?.nickname || '컴퓨터'}
            </span>
          </div>
          {gameState.penaltyStack > 0 && (
            <div className="bg-rose-500 text-white font-black px-6 py-2 rounded-full animate-bounce text-sm sm:text-lg shadow-[0_0_20px_rgba(244,63,94,0.6)] border border-rose-400">
              🚨 공격 누적: {gameState.penaltyStack}장!
            </div>
          )}
        </div>
      </div>

      {/* My Player Area */}
      {!isSpectator && myState && (
        <div className="flex-none bg-slate-800/90 backdrop-blur-xl rounded-t-[2rem] border-t border-slate-700/80 p-4 sm:p-6 flex flex-col items-center pb-6 sm:pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] z-30">
          {myState.hand.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-800/80 backdrop-blur-sm rounded-2xl w-full max-w-5xl">
              <span className="text-6xl drop-shadow-[0_0_20px_rgba(250,204,21,0.6)] mb-4 animate-bounce">🏆</span>
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">탈출 성공!</span>
              <span className="text-slate-400 mt-2">다른 플레이어들의 게임을 관전하세요.</span>
            </div>
          ) : (
          <>
          <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-5xl mb-4 sm:mb-6 gap-3">
             <div className="flex items-center gap-3">
               <div className={`w-3 h-3 rounded-full ${myTurn ? 'bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse' : 'bg-slate-500'}`}></div>
               <span className="font-bold text-slate-100 text-base sm:text-lg">{me?.nickname}</span>
             </div>
             
             <div className="flex gap-2 sm:gap-3 w-full sm:w-auto justify-center">
               {myTurn && (
                 <button 
                   onClick={handlePlayerDraw}
                   className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 ${gameState.penaltyStack > 0 ? 'bg-rose-600 hover:bg-rose-500' : 'bg-indigo-600 hover:bg-indigo-500'} text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 text-xs sm:text-sm`}
                 >
                   {gameState.penaltyStack > 0 ? `${gameState.penaltyStack}장 먹기 (방어 실패)` : '카드 1장 뽑기'}
                 </button>
               )}
               {myState.hand.length === 2 && myTurn && !oneCardDeclared && (
                  // Show button when they are about to play their second to last card
                 <button 
                   onClick={handleDeclareOneCard}
                   className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-yellow-950 font-black rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.5)] transition-transform active:scale-95 text-xs sm:text-sm animate-[bounce_1s_infinite]"
                 >
                   원카드 선언!
                 </button>
               )}
             </div>
          </div>
          
          {/* My Hand (Horizontal Scroll) */}
          <div 
            ref={handScrollRef}
            onWheel={handleHandScroll}
            className="w-full max-w-5xl overflow-x-auto pb-6 custom-scrollbar px-2"
          >
            <div className="flex gap-2 sm:gap-4 w-max min-w-full justify-center">
              <AnimatePresence>
                {myState.hand?.map((card, i) => {
                  const playable = myTurn && isPlayable(card as any, topCard as any, gameState.currentSuit as any, gameState.penaltyStack);
                  return (
                    <motion.div 
                      key={card.id}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5, y: -100 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0"
                    >
                      <CardView 
                        card={card} 
                        isPlayable={playable} 
                        onClick={() => handlePlayerPlay(card, i)}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
          </>
        )}
        </div>
      )}

      {/* Modals */}
      {suitPickerOpen && (
        <div className="absolute inset-0 bg-slate-900/90 flex items-center justify-center z-50 backdrop-blur-md px-4">
          <div className="bg-slate-800 p-6 sm:p-10 rounded-3xl border border-slate-700 shadow-[0_0_40px_rgba(0,0,0,0.5)] text-center max-w-md w-full">
            <h3 className="text-xl sm:text-2xl font-black text-white mb-8">바꿀 무늬를 선택하세요</h3>
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              {['spades', 'hearts', 'diamonds', 'clubs'].map(s => (
                <button 
                  key={s}
                  onClick={() => handleSuitPick(s)}
                  className="bg-white hover:bg-slate-100 text-4xl sm:text-5xl p-6 sm:p-8 rounded-2xl flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95 group"
                >
                  <span className={`${suitSymbols[s].color} group-hover:scale-110 transition-transform`}>{suitSymbols[s].symbol}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom Scrollbar Styles for Hand */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}} />
    </div>
  );
}
