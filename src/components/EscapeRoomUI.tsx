import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Session, SessionStatus } from '../types';
import { ESCAPE_ROOM_THEMES, Puzzle } from '../data/escapeRoomData';
import { sessionService } from '../services/sessionService';
import { auth } from '../firebase';
import { 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, 
  CheckCircle2, HelpCircle, Users, Timer, Trophy, Skull, 
  DoorOpen, Key, Search, Lock, Unlock, Zap, ShieldAlert,
  Image as ImageIcon, Hash, Briefcase, Package
} from 'lucide-react';
import { HiddenObjectPuzzle } from './HiddenObjectPuzzle';

interface EscapeRoomUIProps {
  session: Session;
  currentUser: any;
  isSpectator: boolean;
}

export const EscapeRoomUI: React.FC<EscapeRoomUIProps> = ({ session, currentUser, isSpectator }) => {
  const game = session.escapeRoomGame;
  if (!game) return null;
  
  const theme = ESCAPE_ROOM_THEMES[game.themeId] || ESCAPE_ROOM_THEMES['interactive_escape'];
  if (!theme) return <div className="p-8 text-center text-gray-500">테마 정보를 불러올 수 없습니다.</div>;
  const room = theme.rooms?.[game.currentRoomId];
  
  const [answer, setAnswer] = useState('');
  const [examiningItem, setExaminingItem] = useState<string | null>(null);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [viewingExplanation, setViewingExplanation] = useState<string | null>(null);
  const [viewingHint, setViewingHint] = useState<string | null>(null);
  const [showRoomTitle, setShowRoomTitle] = useState(false);

  const [showHowToPlay, setShowHowToPlay] = useState(false);

  // Puzzle specific states
  const [directionInput, setDirectionInput] = useState<string[]>([]);
  const [directionError, setDirectionError] = useState(false);
  const [dialValues, setDialValues] = useState<number[]>([]);

  useEffect(() => {
    setDialValues([]);
  }, [game.currentPuzzleId]);
  const [dragConnections, setDragConnections] = useState<Record<string, string>>({});
  const [selectedDragItem, setSelectedDragItem] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});
  const [timeAttackLeft, setTimeAttackLeft] = useState<number | null>(null);
  const [itemError, setItemError] = useState<string | null>(null);

  useEffect(() => {
    if (game.currentRoomId && game.currentRoomId !== 'STAGE_SELECT') {
      setShowRoomTitle(true);
      const timer = setTimeout(() => setShowRoomTitle(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [game.currentRoomId]);

  const styles = theme.styles;

  const timeLeft = Math.max(0, Math.floor((game.startTime + game.timeLimit * 1000 - Date.now()) / 1000));
  const isTimeLow = timeLeft < 60;

  useEffect(() => {
    if (game.lastSolvedPuzzleId) {
      setViewingExplanation(game.lastSolvedPuzzleId);
    }
  }, [game.lastSolvedPuzzleId]);

  useEffect(() => {
    if (game.timeAttackEndTime) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, Math.floor((game.timeAttackEndTime! - Date.now()) / 1000));
        setTimeAttackLeft(remaining);
        if (remaining === 0 && game.status === 'PLAYING' && session.hostId === auth.currentUser?.uid) {
          sessionService.failEscapeRoomStage(session.id, session);
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeAttackLeft(null);
    }
  }, [game.timeAttackEndTime, game.status, session.hostId, session.id, session]);

  useEffect(() => {
    if (timeLeft === 0 && game.status === 'PLAYING' && session.hostId === auth.currentUser?.uid) {
      sessionService.failEscapeRoom(session.id, session);
    }
  }, [timeLeft, game.status, session.hostId, session.id, session]);

  const howToPlayModal = (
    <AnimatePresence>
      {showHowToPlay && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowHowToPlay(false)}
        >
          <motion.div 
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl text-gray-900"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-8 space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl bg-indigo-50 text-indigo-500">
                  <HelpCircle size={32} />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-2xl font-black text-gray-900">게임 방법 및 힌트</h4>
                <p className="text-sm text-gray-500 font-medium">방탈출 게임을 즐기는 방법을 알아보세요!</p>
              </div>
              
              <div className="space-y-4 text-left">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <h5 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
                    <Search size={16} className="text-indigo-500" /> 퍼즐 풀기
                  </h5>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    각 방에는 여러 개의 퍼즐이 있습니다. 순서대로 퍼즐을 풀어야 다음 퍼즐이 열립니다. 정답을 입력하거나, 다이얼을 맞추거나, 아이템을 사용해 퍼즐을 해결하세요.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <h5 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
                    <Key size={16} className="text-indigo-500" /> 아이템 활용
                  </h5>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    퍼즐을 풀면 인벤토리에 아이템이 추가될 수 있습니다. 획득한 아이템을 클릭하여 선택한 후, 아이템이 필요한 퍼즐(자물쇠 등)을 클릭하면 사용할 수 있습니다.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <h5 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
                    <HelpCircle size={16} className="text-indigo-500" /> 힌트 사용
                  </h5>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    도저히 풀리지 않을 때는 각 퍼즐 우측 하단의 <strong>'힌트'</strong> 버튼을 클릭하세요. 힌트를 사용하면 게임 로그에 힌트 내용이 출력되며, 팀원 모두가 볼 수 있습니다. 힌트 사용 횟수는 기록됩니다.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setShowHowToPlay(false)}
                className="w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all hover:brightness-110 active:scale-95 bg-indigo-600"
              >
                확인
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (game.currentRoomId === 'STAGE_SELECT') {
    const roomsList = Object.values(theme.rooms);
    const clearedRooms = game.clearedRooms || [];
    
    return (
      <div className="min-h-[600px] p-6 bg-slate-900 text-white" style={{ fontFamily: styles.fontFamily }}>
        {howToPlayModal}
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4 relative">
            <h2 className="text-4xl font-black tracking-tighter" style={{ color: styles.primaryColor }}>{theme.name}</h2>
            <p className="text-gray-400">{theme.description}</p>
            <button 
              onClick={() => setShowHowToPlay(true)}
              className="absolute top-0 right-0 flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800 hover:bg-gray-700 text-sm font-bold transition-colors"
            >
              <HelpCircle size={16} />
              게임 방법
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roomsList.map((r, idx) => {
              const isCleared = clearedRooms.includes(r.id);
              const isUnlocked = idx === 0 || clearedRooms.includes(roomsList[idx - 1].id);
              
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    if (isUnlocked && !isSpectator) {
                      sessionService.enterEscapeRoomStage(session.id, r.id, session);
                    }
                  }}
                  disabled={!isUnlocked || isSpectator}
                  className={`p-6 rounded-2xl border-2 text-left transition-all ${
                    isCleared 
                      ? 'bg-green-900/20 border-green-500/50 hover:bg-green-900/40' 
                      : isUnlocked 
                        ? 'bg-gray-800 border-gray-600 hover:border-blue-500 hover:bg-gray-700' 
                        : 'bg-gray-900 border-gray-800 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold px-2 py-1 rounded bg-black/50">STAGE {idx + 1}</span>
                    {isCleared ? <CheckCircle2 className="text-green-500" size={20} /> : !isUnlocked && <Lock className="text-gray-600" size={20} />}
                  </div>
                  <h3 className="text-lg font-bold mb-2">{r.name}</h3>
                  <p className="text-xs text-gray-400 line-clamp-2">{r.description}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (!room) return <div className="p-8 text-center text-gray-500">방 정보를 불러올 수 없습니다.</div>;

  const handleSolve = (puzzleId: string, val: string) => {
    sessionService.submitEscapeRoomAnswer(session.id, puzzleId, val, session);
    setAnswer('');
  };

  const handleNextStage = () => {
    sessionService.nextEscapeRoomStage(session.id, session);
  };

  const handleHint = (puzzleId: string) => {
    sessionService.useEscapeRoomHint(session.id, puzzleId, session);
    setViewingHint(puzzleId);
  };

  const lastSolvedPuzzle = room.puzzles.find(p => p.id === game.lastSolvedPuzzleId);

  // Direction Sequence Logic
  const handleDirectionClick = (puzzle: Puzzle, dir: string) => {
    if (isSpectator) return;
    const newSeq = [...directionInput, dir];
    setDirectionInput(newSeq);
    
    if (puzzle.sequence && newSeq.length === puzzle.sequence.length) {
      if (newSeq.join(',') === puzzle.sequence.join(',')) {
        handleSolve(puzzle.id, newSeq.join(','));
      } else {
        setDirectionError(true);
        setTimeout(() => {
          setDirectionError(false);
          setDirectionInput([]);
        }, 800);
      }
    }
  };

  // Dial Logic
  const handleDialChange = (index: number, delta: number, count: number = 4) => {
    if (isSpectator) return;
    const newDials = dialValues.length === count ? [...dialValues] : Array(count).fill(0);
    let newVal = (newDials[index] || 0) + delta;
    if (newVal > 9) newVal = 0;
    if (newVal < 0) newVal = 9;
    newDials[index] = newVal;
    setDialValues(newDials);
  };

  // Drag Drop Logic (Click to select, click to drop)
  const handleDragItemClick = (itemId: string) => {
    if (isSpectator) return;
    setSelectedDragItem(itemId === selectedDragItem ? null : itemId);
  };

  const handleDropZoneClick = (puzzle: Puzzle, zoneId: string) => {
    if (isSpectator || !selectedDragItem) return;
    
    const newConns = { ...dragConnections, [zoneId]: selectedDragItem };
    setDragConnections(newConns);
    setSelectedDragItem(null);

    // Check if all connected correctly
    if (puzzle.dropZones) {
      const isAllCorrect = puzzle.dropZones.every(z => newConns[z.id] === z.accepts);
      if (isAllCorrect && Object.keys(newConns).length === puzzle.dropZones.length) {
        handleSolve(puzzle.id, 'CONNECTED');
      }
    }
  };

  // Item Interaction Logic
  const handleItemInteraction = (puzzle: Puzzle) => {
    if (isSpectator) return;
    if (selectedInventoryItem === puzzle.requiredItem) {
      handleSolve(puzzle.id, puzzle.answer);
      setSelectedInventoryItem(null);
    } else {
      setItemError(puzzle.id);
      setTimeout(() => setItemError(null), 1000);
    }
  };

  const handleInventoryItemClick = async (item: string) => {
    if (isSpectator) return;
    
    if (selectedInventoryItem && selectedInventoryItem !== item) {
      // Try to combine
      const combined = await sessionService.combineItems(session.id, selectedInventoryItem, item, session);
      if (combined) {
        setSelectedInventoryItem(null);
      } else {
        setSelectedInventoryItem(item);
      }
    } else {
      setSelectedInventoryItem(item === selectedInventoryItem ? null : item);
    }
  };

  // Dynamic Background based on room
  const renderPuzzleInput = (puzzle: Puzzle) => {
    switch (puzzle.type) {
      case 'HIDDEN_OBJECT':
        return <HiddenObjectPuzzle puzzle={puzzle} onSolve={(ans) => handleSolve(puzzle.id, ans)} isSpectator={isSpectator} />;
      
      case 'FLASHLIGHT_FIND':
        return (
          <div 
            className="relative w-full h-64 bg-black rounded-lg overflow-hidden cursor-crosshair border border-gray-700"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            }}
          >
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle 100px at ${mousePos.x}px ${mousePos.y}px, transparent 0%, rgba(0,0,0,0.95) 100%)`,
                zIndex: 10
              }}
            />
            {puzzle.imageUrl && (
              <img 
                src={puzzle.imageUrl} 
                alt="Background" 
                className="absolute inset-0 w-full h-full object-cover opacity-60 transition-opacity duration-500" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes('picsum.photos')) {
                    target.src = `https://picsum.photos/seed/${puzzle.id}/1000/600`;
                  }
                }}
              />
            )}
            {!puzzle.imageUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-gray-700">
                <ImageIcon size={48} />
              </div>
            )}
            {puzzle.hiddenObjects?.map((obj, idx) => (
              <button
                key={idx}
                className="absolute bg-transparent hover:bg-white/20 transition-colors"
                style={{
                  left: `${obj.x}%`,
                  top: `${obj.y}%`,
                  width: `${obj.width}%`,
                  height: `${obj.height}%`,
                  zIndex: 20
                }}
                onClick={() => {
                  if (!isSpectator) handleSolve(puzzle.id, 'found_all');
                }}
                disabled={isSpectator}
                title={obj.name}
              />
            ))}
          </div>
        );

      case 'CLICK_SPAM':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {puzzle.clickTargets?.map((target) => {
                const currentClicks = clickCounts[target.id] || 0;
                const progress = Math.min(100, (currentClicks / target.requiredClicks) * 100);
                const isDone = currentClicks >= target.requiredClicks;
                
                return (
                  <div key={target.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700 text-center space-y-3">
                    <h4 className="text-sm font-bold text-gray-300">{target.label}</h4>
                    <div className="w-full bg-gray-900 rounded-full h-4 overflow-hidden border border-gray-700">
                      <div 
                        className={`h-full transition-all duration-100 ${isDone ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <button
                      className={`w-full py-2 rounded-lg font-bold text-sm transition-colors ${
                        isDone ? 'bg-green-600 text-white cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
                      }`}
                      onClick={() => {
                        if (isSpectator || isDone) return;
                        const newCounts = { ...clickCounts, [target.id]: currentClicks + 1 };
                        setClickCounts(newCounts);
                        
                        // Check if all are done
                        const allDone = puzzle.clickTargets?.every(t => 
                          (newCounts[t.id] || 0) >= t.requiredClicks
                        );
                        if (allDone) {
                          handleSolve(puzzle.id, 'REPAIRED');
                        }
                      }}
                      disabled={isSpectator || isDone}
                    >
                      {isDone ? '수리 완료' : '수리하기 (클릭!)'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'DIRECTION_SEQUENCE':
        return (
          <div className="space-y-4">
            <div className="flex justify-center gap-2 h-10">
              {directionInput.map((dir, i) => (
                <div key={i} className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-gray-600">
                  {dir === 'UP' && <ArrowUp size={16} />}
                  {dir === 'DOWN' && <ArrowDown size={16} />}
                  {dir === 'LEFT' && <ArrowLeft size={16} />}
                  {dir === 'RIGHT' && <ArrowRight size={16} />}
                </div>
              ))}
              {Array(puzzle.sequence?.length || 4).fill(0).slice(directionInput.length).map((_, i) => (
                <div key={`empty-${i}`} className="w-8 h-8 border-2 border-dashed border-gray-200 rounded" />
              ))}
            </div>
            <motion.div 
              animate={directionError ? { x: [-10, 10, -10, 10, 0] } : {}}
              className="flex flex-col items-center gap-4"
            >
              <div className="flex gap-4 justify-center">
                {['UP', 'DOWN', 'LEFT', 'RIGHT'].map(dir => (
                  <button
                    key={dir}
                    onClick={() => handleDirectionClick(puzzle, dir)}
                    disabled={isSpectator || directionError}
                    className={`w-14 h-14 flex items-center justify-center border-2 rounded-full transition-all shadow-md ${directionError ? 'bg-red-50 border-red-500 text-red-500' : 'bg-white border-gray-200 hover:border-blue-500'}`}
                  >
                    {dir === 'UP' && <ArrowUp size={24} />}
                    {dir === 'DOWN' && <ArrowDown size={24} />}
                    {dir === 'LEFT' && <ArrowLeft size={24} />}
                    {dir === 'RIGHT' && <ArrowRight size={24} />}
                  </button>
                ))}
              </div>
              {directionError && (
                <span className="text-red-500 font-bold text-sm animate-pulse">틀렸습니다!</span>
              )}
            </motion.div>
          </div>
        );

      case 'PASSWORD_DIAL':
        return (
          <div className="flex flex-col items-center gap-6">
            <div className="flex gap-4 p-6 bg-gray-800 rounded-xl shadow-inner border-4 border-gray-900">
                {Array(puzzle.dialCount || 4).fill(0).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <button onClick={() => handleDialChange(i, 1, puzzle.dialCount || 4)} className="text-gray-400 hover:text-white"><ArrowUp size={24} /></button>
                    <div className="w-12 h-16 bg-white rounded flex items-center justify-center text-3xl font-mono font-black shadow-inner text-gray-900">
                      {(dialValues.length === (puzzle.dialCount || 4) ? dialValues[i] : 0) || 0}
                    </div>
                    <button onClick={() => handleDialChange(i, -1, puzzle.dialCount || 4)} className="text-gray-400 hover:text-white"><ArrowDown size={24} /></button>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => {
                  const currentCount = puzzle.dialCount || 4;
                  const currentVal = (dialValues.length === currentCount ? dialValues : Array(currentCount).fill(0)).join('');
                  if (currentVal.trim().toUpperCase() === puzzle.answer.trim().toUpperCase()) {
                    handleSolve(puzzle.id, currentVal);
                    setDialValues([]); // Reset for next puzzle
                  }
                  else alert(`비밀번호가 틀렸습니다. (입력: ${currentVal})`);
                }}
              disabled={isSpectator}
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700"
            >
              해제 시도
            </button>
          </div>
        );

      case 'DRAG_DROP':
        return (
          <div className="space-y-6">
            <div className="flex justify-center gap-4 flex-wrap">
              {puzzle.dragItems?.map(item => {
                let sizeClass = 'px-4 py-2';
                if (item.size === 'small') sizeClass = 'px-3 py-1 text-sm';
                if (item.size === 'large') sizeClass = 'px-6 py-3 text-lg';
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleDragItemClick(item.id)}
                    className={`${sizeClass} rounded-full font-bold text-white shadow-md transition-all ${selectedDragItem === item.id ? 'ring-4 ring-offset-2 scale-110' : 'hover:scale-105'}`}
                    style={{ backgroundColor: item.color || '#666', ringColor: item.color || '#666' }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-center gap-4 flex-wrap">
              {puzzle.dropZones?.map(zone => {
                let sizeClass = 'w-24 h-24';
                if (zone.size === 'small') sizeClass = 'w-16 h-16';
                if (zone.size === 'large') sizeClass = 'w-32 h-32';
                
                return (
                  <button
                    key={zone.id}
                    onClick={() => handleDropZoneClick(puzzle, zone.id)}
                    className={`${sizeClass} border-4 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${dragConnections[zone.id] ? 'border-solid bg-gray-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}`}
                    style={{ borderColor: dragConnections[zone.id] ? puzzle.dragItems?.find(i => i.id === dragConnections[zone.id])?.color : undefined }}
                  >
                    <Zap size={24} className={dragConnections[zone.id] ? 'text-gray-800' : 'text-gray-400'} />
                    <span className="text-xs font-bold text-gray-500">{zone.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'ITEM_INTERACTION':
        return (
          <div className="flex flex-col items-center gap-4 py-4">
            <motion.button
              animate={itemError === puzzle.id ? { x: [-10, 10, -10, 10, 0] } : {}}
              onClick={() => handleItemInteraction(puzzle)}
              className={`w-32 h-32 rounded-2xl border-4 flex flex-col items-center justify-center gap-2 transition-all shadow-inner ${
                itemError === puzzle.id 
                  ? 'bg-red-50 border-red-500 text-red-500' 
                  : 'bg-gray-100 border-gray-300 hover:bg-gray-200 hover:border-gray-400 text-gray-500'
              }`}
            >
              <Lock size={48} className={itemError === puzzle.id ? 'text-red-500' : 'text-gray-500'} />
              <span className="text-sm font-bold">{itemError === puzzle.id ? '알맞은 아이템이 필요합니다' : '잠김'}</span>
            </motion.button>
            <p className="text-xs text-gray-500">인벤토리에서 아이템을 선택한 후 클릭하세요.</p>
          </div>
        );

      case 'UV_REVEAL':
        return (
          <div className="relative w-full h-48 bg-gray-900 rounded-xl overflow-hidden border-2 border-gray-700 flex items-center justify-center">
            <div 
              className={`text-4xl font-black tracking-widest transition-opacity duration-1000 ${selectedInventoryItem === puzzle.requiredItem ? 'opacity-100 text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.8)]' : 'opacity-5 text-gray-800'}`}
              style={{ textShadow: selectedInventoryItem === puzzle.requiredItem ? '0 0 10px #4ade80, 0 0 20px #4ade80' : 'none' }}
            >
              {puzzle.hiddenMessage}
            </div>
            <div className="absolute bottom-2 right-2 text-[10px] text-gray-500 uppercase tracking-widest">
              {selectedInventoryItem === puzzle.requiredItem ? 'UV ACTIVE' : 'UV INACTIVE'}
            </div>
            {selectedInventoryItem === puzzle.requiredItem && (
              <button
                onClick={() => handleSolve(puzzle.id, puzzle.hiddenMessage || '')}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                title="발견했다!"
              />
            )}
          </div>
        );

      case 'TERMINAL':
        return (
          <div className="bg-black p-4 rounded-xl border-2 border-green-900 font-mono text-green-500 shadow-[0_0_15px_rgba(0,0,0,0.5)_inset]">
            <div className="mb-4 text-xs opacity-80 whitespace-pre-wrap">
              {puzzle.isRandomPassword 
                ? `SYSTEM ENCRYPTED.\nSOLVE: ${parseInt(game.terminalRandomPassword || '0') - 1234} + 1234 = ?\nENTER PASSWORD TO CONTINUE.`
                : `SYSTEM TERMINAL v2.4.1\nAWAITING COMMAND...`}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500 font-bold">{'>'}</span>
              <input 
                type="text" 
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={puzzle.isRandomPassword ? "Enter password..." : "Enter command..."}
                disabled={isSpectator}
                className="flex-1 bg-transparent border-none outline-none text-green-400 placeholder-green-800 focus:ring-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && answer.trim() && !isSpectator) {
                    handleSolve(puzzle.id, answer);
                    setAnswer('');
                  }
                }}
                autoComplete="off"
                spellCheck="false"
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="flex gap-3">
            <input 
              type="text" 
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="정답 입력..."
              disabled={isSpectator}
              className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && answer.trim() && !isSpectator) {
                  handleSolve(puzzle.id, answer);
                  setAnswer('');
                }
              }}
            />
            <button 
              onClick={() => answer.trim() && !isSpectator && handleSolve(puzzle.id, answer)}
              disabled={!answer.trim() || isSpectator}
              className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 disabled:opacity-50"
            >
              확인
            </button>
          </div>
        );
    }
  };

  const getRoomBackground = () => {
    if (theme.id === 'mystery_room') {
      if (room.id === 'room_1') {
        return timeAttackLeft !== null ? 'bg-red-950 animate-pulse' : 'bg-stone-950';
      }
      if (room.id === 'room_2') return 'bg-black bg-[linear-gradient(rgba(0,255,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,0,0.03)_1px,transparent_1px)] bg-[size:20px_20px]';
      if (room.id === 'room_3') return 'bg-indigo-950 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900 to-indigo-950';
    }

    if (theme.id === 'universe_escape') {
      if (room.id === 'stage_1') return 'bg-zinc-950 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-zinc-950';
      if (room.id === 'stage_2') return 'bg-amber-950 bg-[url("https://www.transparenttextures.com/patterns/wood-pattern.png")]';
      if (room.id === 'stage_3') return timeAttackLeft !== null ? 'bg-blue-950 animate-pulse' : 'bg-blue-950';
    }

    switch(room.id) {
      case 'room_1': return game.solvedPuzzles?.includes('r1_p1') ? 'bg-slate-700' : 'bg-slate-950';
      case 'room_2': return 'bg-cyan-950 bg-[linear-gradient(rgba(0,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]';
      case 'room_3': return 'bg-amber-950 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900 to-amber-950';
      default: return 'bg-gray-900';
    }
  };

  if (session.status === SessionStatus.SUMMARY) {
    const isWin = game.status === 'WON';
    const timeTaken = Math.floor((Date.now() - game.startTime) / 1000);
    const minutes = Math.floor(timeTaken / 60);
    const seconds = timeTaken % 60;

    return (
      <div className="min-h-[600px] flex items-center justify-center p-6 bg-slate-900" style={{ fontFamily: styles.fontFamily }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border-8"
          style={{ borderColor: isWin ? styles.primaryColor : '#ef4444' }}
        >
          <div className="p-12 text-center space-y-8">
            <div className="flex justify-center">
              <motion.div 
                animate={isWin ? { rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] } : { y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 4 }}
                className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl"
                style={{ backgroundColor: isWin ? styles.primaryColor : '#ef4444', color: styles.accentColor }}
              >
                {isWin ? <Trophy size={48} /> : <Skull size={48} />}
              </motion.div>
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tighter" style={{ color: isWin ? styles.primaryColor : '#ef4444' }}>
                {isWin ? 'ESCAPE SUCCESS!' : 'MISSION FAILED'}
              </h2>
              <p className="text-gray-500 font-medium">
                {isWin ? '축하합니다! 무사히 탈출에 성공하셨습니다.' : '시간이 초과되었습니다. 다음 기회에 도전하세요.'}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <Timer size={20} className="mx-auto mb-2 text-blue-500" />
                <p className="text-[10px] text-gray-400 font-bold uppercase">소요 시간</p>
                <p className="text-lg font-black text-gray-800">{minutes}m {seconds}s</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <HelpCircle size={20} className="mx-auto mb-2 text-yellow-500" />
                <p className="text-[10px] text-gray-400 font-bold uppercase">힌트 사용</p>
                <p className="text-lg font-black text-gray-800">{game.hintsUsed || 0}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <Users size={20} className="mx-auto mb-2 text-green-500" />
                <p className="text-[10px] text-gray-400 font-bold uppercase">팀원 수</p>
                <p className="text-lg font-black text-gray-800">{Object.keys(session.players).length}명</p>
              </div>
            </div>
            <button 
              onClick={() => sessionService.resetSession(session.id, session.players)}
              className="w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: styles.primaryColor }}
            >
              로비로 돌아가기
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (showIntro) {
    return (
      <div className="min-h-[600px] flex items-center justify-center p-6 bg-black" style={{ fontFamily: styles.fontFamily }}>
        {howToPlayModal}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl w-full text-center space-y-8"
        >
          <div className="space-y-4">
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-[10px] font-black tracking-[0.3em] uppercase"
              style={{ color: styles.accentColor }}
            >
              MISSION START
            </motion.div>
            <h2 className="text-5xl font-black text-white tracking-tighter">{theme.name}</h2>
            <div className="h-1 w-24 mx-auto" style={{ backgroundColor: styles.accentColor }} />
          </div>
          <p className="text-gray-400 leading-relaxed text-lg">{theme.description}</p>
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-6 text-xs font-bold text-gray-500 uppercase tracking-widest">
              <span className="flex items-center gap-2"><Timer size={14} /> {game.timeLimit / 60} MINUTES</span>
              <span className="flex items-center gap-2"><Users size={14} /> {Object.keys(session.players).length} PLAYERS</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowHowToPlay(true)}
                className="px-8 py-4 rounded-full font-black text-white shadow-2xl transition-all hover:scale-105 active:scale-95 bg-gray-800 border border-gray-700"
              >
                게임 방법
              </button>
              <button 
                onClick={() => setShowIntro(false)}
                className="px-12 py-4 rounded-full font-black text-white shadow-2xl transition-all hover:scale-110 active:scale-95 group"
                style={{ backgroundColor: styles.primaryColor }}
              >
                입장하기
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-[600px] p-4 transition-colors duration-1000 relative overflow-hidden ${getRoomBackground()}`} style={{ fontFamily: styles.fontFamily }}>
      {howToPlayModal}
      
      <AnimatePresence>
        {showRoomTitle && room && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 pointer-events-none"
          >
            <div className="text-center space-y-6 max-w-2xl px-6">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-px bg-gradient-to-r from-transparent via-white to-transparent mx-auto"
              />
              <div className="space-y-2">
                <motion.p 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-[10px] font-black tracking-[0.4em] uppercase"
                  style={{ color: styles.accentColor }}
                >
                  New Location Discovered
                </motion.p>
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-5xl md:text-6xl font-black text-white tracking-tighter"
                >
                  {room.name}
                </motion.h2>
              </div>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-gray-400 text-lg font-medium italic leading-relaxed"
              >
                "{room.description}"
              </motion.p>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className="h-px bg-gradient-to-r from-transparent via-white to-transparent mx-auto"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div 
            key={room.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col h-full ring-1 ring-black/5">
              <div className="px-8 py-6 flex justify-between items-center border-b border-gray-100/50" style={{ backgroundColor: styles.primaryColor }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center rotate-3 shadow-inner">
                    <DoorOpen size={24} className="text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em] mb-0.5">Current Phase</span>
                    <h3 className="text-xl font-black text-white tracking-tight">{room.name}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono font-bold">
                  <button 
                    onClick={() => setShowHowToPlay(true)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity mr-4 bg-white/10 px-3 py-1.5 rounded-full text-white"
                    title="게임 방법"
                  >
                    <HelpCircle size={16} />
                    <span>방법</span>
                  </button>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-0.5">Time Limit</span>
                    <div className={`flex items-center gap-2 font-black text-2xl tabular-nums ${timeLeft < 60 ? 'text-red-300 animate-pulse' : 'text-white'}`}>
                      <Timer size={20} />
                      <span style={{ color: isTimeLow ? '#ef4444' : styles.accentColor }}>{timeLeft}s</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-10 space-y-10 bg-gradient-to-b from-white to-gray-50/50">
                <div className="relative p-6 bg-blue-50/30 rounded-3xl border border-blue-100/50">
                  <div className="absolute -left-1 top-6 bottom-6 w-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                  <p className="text-lg text-gray-700 leading-relaxed font-bold italic pl-4">
                    "{room.description}"
                  </p>
                </div>

                <div className="space-y-8">
                  {room.puzzles.map((puzzle, index) => {
                    // Only show the puzzle if all previous puzzles in the room are solved
                    const previousPuzzlesSolved = room.puzzles.slice(0, index).every(p => game.solvedPuzzles?.includes(p.id));
                    if (!previousPuzzlesSolved) return null;
                    
                    return (
                    <div 
                      key={puzzle.id} 
                      className={`p-8 rounded-[2rem] border-2 transition-all relative overflow-hidden ${
                        game.solvedPuzzles?.includes(puzzle.id) 
                          ? 'bg-gray-50/50 border-gray-100 opacity-60 grayscale-[0.5]' 
                          : 'bg-white border-blue-100 shadow-xl shadow-blue-500/5 ring-1 ring-blue-50'
                      }`}
                    >
                      <div className="flex items-start gap-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform ${
                          game.solvedPuzzles?.includes(puzzle.id) ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600 scale-110'
                        }`}>
                          {game.solvedPuzzles?.includes(puzzle.id) ? <CheckCircle2 size={24} /> : <Hash size={24} />}
                        </div>
                        <div className="space-y-6 flex-1">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-[0.2em]">
                                {puzzle.type.replace('_', ' ')}
                              </span>
                              {game.solvedPuzzles?.includes(puzzle.id) && <span className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest">Completed</span>}
                            </div>
                            <h4 className="text-2xl font-black text-gray-900 leading-tight tracking-tight">{puzzle.question}</h4>
                          </div>

                          {!game.solvedPuzzles?.includes(puzzle.id) ? (
                            <div className="space-y-8 pt-2">
                              <div className="p-2 bg-gray-50/50 rounded-[1.5rem] border border-gray-100">
                                {renderPuzzleInput(puzzle)}
                              </div>
                              
                              <div className="flex gap-4 justify-end pt-4 border-t border-gray-50">
                                <button 
                                  onClick={() => !isSpectator && handleHint(puzzle.id)}
                                  disabled={isSpectator}
                                  className="flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-black transition-all shadow-md hover:shadow-xl active:scale-95 bg-yellow-400 text-yellow-950 hover:bg-yellow-300 border-b-4 border-yellow-600"
                                >
                                  <HelpCircle size={20} /> 힌트 보기 ({game.hintsUsed || 0})
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="px-6 py-4 bg-green-50/50 rounded-2xl border border-green-100 text-green-800 text-sm font-bold flex items-center gap-2">
                              <CheckCircle2 size={16} /> 해결됨! {puzzle.rewardItem && `(획득: ${puzzle.rewardItem})`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>

                {game.isRoomCleared && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-10 rounded-[2.5rem] text-center space-y-8 border-4 shadow-2xl bg-green-50/50 border-green-500/30 backdrop-blur-sm"
                  >
                    <div className="flex justify-center">
                      <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl bg-green-500 text-white rotate-6">
                        <Unlock size={40} />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-3xl font-black text-green-800 tracking-tighter">MISSION ACCOMPLISHED</h3>
                      <p className="text-lg font-bold text-green-600/80 italic">모든 수수께끼를 완벽하게 해결했습니다.</p>
                    </div>
                    <button 
                      onClick={() => !isSpectator && handleNextStage()}
                      disabled={isSpectator}
                      className="w-full py-6 rounded-3xl flex items-center justify-center gap-4 text-xl font-black text-white shadow-2xl bg-green-600 hover:bg-green-700 transition-all hover:scale-[1.02] active:scale-[0.98] group"
                    >
                      {room.nextRoomId ? '다음 구역으로 진입' : '탈출 성공! 결과 리포트'}
                      <ArrowRight size={28} className="group-hover:translate-x-2 transition-transform" />
                    </button>
                  </motion.div>
                )}
              </div>

              {/* Inventory UI */}
              <div className="px-8 py-6 border-t border-gray-100 bg-gray-950 text-white flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-gray-400">
                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
                      <Briefcase size={16} className="text-white/60" />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">Quick Access Inventory</span>
                  </div>
                  <span className="text-[10px] font-black text-white/40">{game.inventory?.length || 0} / 10</span>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
                  {game.inventory?.map((item, i) => (
                    <motion.button 
                      key={`${item}-${i}`} 
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleInventoryItemClick(item)}
                      className={`px-6 py-3 rounded-2xl text-sm font-black shadow-xl transition-all whitespace-nowrap border-2 flex items-center gap-3 ${
                        selectedInventoryItem === item 
                          ? 'bg-blue-600 border-blue-400 text-white ring-4 ring-blue-500/20' 
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white'
                      }`}
                    >
                      <Package size={16} className={selectedInventoryItem === item ? 'text-blue-200' : 'text-gray-600'} />
                      {item}
                    </motion.button>
                  ))}
                  {(!game.inventory || game.inventory.length === 0) && (
                    <div className="flex items-center gap-3 py-2 opacity-30">
                      <div className="w-8 h-8 rounded-lg border border-dashed border-gray-600 flex items-center justify-center text-gray-400">
                        <Package size={14} />
                      </div>
                      <span className="text-xs font-bold italic text-gray-400">인벤토리가 비어 있습니다.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Team Activity Column */}
        <div className="space-y-6">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20 flex flex-col h-full max-h-[600px]">
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100" style={{ backgroundColor: styles.primaryColor }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Users size={16} className="text-white" />
                </div>
                <span className="text-sm font-black text-white uppercase tracking-widest">팀 활동 로그</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 custom-scrollbar">
              {game.activityLog?.slice().reverse().map((activity, idx) => (
                <motion.div 
                  key={`${activity.id}-${idx}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-2xl border bg-white shadow-sm border-gray-100 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full">{activity.userName}</span>
                    <span className="text-[8px] font-bold text-gray-400">{new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full shadow-sm"
                      style={{ 
                        backgroundColor: 
                          activity.type === 'SOLVE' ? '#22c55e' : 
                          activity.type === 'FAIL' ? '#ef4444' : 
                          activity.type === 'HINT' ? '#eab308' : '#3b82f6'
                      }}
                    />
                    <p className="text-[11px] text-gray-700 font-bold leading-tight">{activity.message}</p>
                  </div>
                </motion.div>
              ))}
              {(!game.activityLog || game.activityLog.length === 0) && (
                <div className="text-center py-12 text-gray-300 italic text-xs font-bold">활동 기록이 없습니다.</div>
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {viewingHint && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              onClick={() => setViewingHint(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-yellow-400"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-8 text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl bg-yellow-50 text-yellow-500">
                      <HelpCircle size={40} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-600">Hint Unlocked</p>
                      <h4 className="text-2xl font-black text-gray-900">도움이 필요하신가요?</h4>
                    </div>
                    <div className="p-6 bg-yellow-50 rounded-2xl border-2 border-yellow-100 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400" />
                      <p className="text-sm text-gray-700 leading-relaxed font-medium italic">
                        "{Object.values(theme.rooms).flatMap(r => r.puzzles).find(p => p.id === viewingHint)?.hint}"
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setViewingHint(null)}
                    className="w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all hover:brightness-110 active:scale-95 bg-yellow-500"
                  >
                    알겠습니다!
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {viewingExplanation && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              onClick={() => setViewingExplanation(null)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="max-w-lg w-full bg-white rounded-3xl shadow-2xl overflow-hidden border-4"
                style={{ borderColor: styles.accentColor }}
                onClick={e => e.stopPropagation()}
              >
                <div className="p-8 text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-xl bg-blue-50 text-blue-500">
                      <CheckCircle2 size={40} />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Puzzle Solved</p>
                      <h4 className="text-2xl font-black text-gray-900">
                        {Object.values(theme.rooms).flatMap(r => r.puzzles).find(p => p.id === viewingExplanation)?.question.slice(0, 30)}...
                      </h4>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-1">정답</p>
                      <p className="text-xl font-black tracking-widest text-gray-800">
                        {Object.values(theme.rooms).flatMap(r => r.puzzles).find(p => p.id === viewingExplanation)?.answer}
                      </p>
                    </div>
                    <div className="space-y-2 text-left">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        해설
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed font-medium">
                        {Object.values(theme.rooms).flatMap(r => r.puzzles).find(p => p.id === viewingExplanation)?.explanation || '설명이 없습니다.'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setViewingExplanation(null)}
                    className="w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all hover:brightness-110 active:scale-95 bg-blue-600"
                  >
                    계속하기
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
          {showHowToPlay && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowHowToPlay(false)}
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="p-8 space-y-6 text-center">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-xl bg-indigo-50 text-indigo-500">
                      <HelpCircle size={32} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black text-gray-900">게임 방법 및 힌트</h4>
                    <p className="text-sm text-gray-500 font-medium">방탈출 게임을 즐기는 방법을 알아보세요!</p>
                  </div>
                  
                  <div className="space-y-4 text-left">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <h5 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
                        <Search size={16} className="text-indigo-500" /> 퍼즐 풀기
                      </h5>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        각 방에는 여러 개의 퍼즐이 있습니다. 순서대로 퍼즐을 풀어야 다음 퍼즐이 열립니다. 정답을 입력하거나, 다이얼을 맞추거나, 아이템을 사용해 퍼즐을 해결하세요.
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <h5 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
                        <Key size={16} className="text-indigo-500" /> 아이템 활용
                      </h5>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        퍼즐을 풀면 인벤토리에 아이템이 추가될 수 있습니다. 획득한 아이템을 클릭하여 선택한 후, 아이템이 필요한 퍼즐(자물쇠 등)을 클릭하면 사용할 수 있습니다.
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <h5 className="font-bold text-gray-800 flex items-center gap-2 mb-2">
                        <HelpCircle size={16} className="text-indigo-500" /> 힌트 사용
                      </h5>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        도저히 풀리지 않을 때는 각 퍼즐 우측 하단의 <strong>'힌트'</strong> 버튼을 클릭하세요. 힌트를 사용하면 게임 로그에 힌트 내용이 출력되며, 팀원 모두가 볼 수 있습니다. 힌트 사용 횟수는 기록됩니다.
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={() => setShowHowToPlay(false)}
                    className="w-full py-4 rounded-2xl font-black text-white shadow-lg transition-all hover:brightness-110 active:scale-95 bg-indigo-600"
                  >
                    확인
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EscapeRoomUI;
