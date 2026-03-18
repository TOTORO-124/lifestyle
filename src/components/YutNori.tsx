import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, update } from 'firebase/database';
import { db } from '../firebase';
import { Session, YutNoriGameState } from '../types';

type YutResult = '도' | '개' | '걸' | '윷' | '모' | '빽도' | '낙';

interface Stick {
  isFlat: boolean;
  isMarked: boolean;
  rotation: number;
  offsetX: number;
  offsetY: number;
}

interface YutNoriProps {
  session: Session;
  currentUser: any;
  isSpectator: boolean;
}

const BOARD_NODES = [
  { id: 0, x: 100, y: 100 }, { id: 1, x: 100, y: 80 }, { id: 2, x: 100, y: 60 }, { id: 3, x: 100, y: 40 }, { id: 4, x: 100, y: 20 },
  { id: 5, x: 100, y: 0 }, { id: 6, x: 80, y: 0 }, { id: 7, x: 60, y: 0 }, { id: 8, x: 40, y: 0 }, { id: 9, x: 20, y: 0 },
  { id: 10, x: 0, y: 0 }, { id: 11, x: 0, y: 20 }, { id: 12, x: 0, y: 40 }, { id: 13, x: 0, y: 60 }, { id: 14, x: 0, y: 80 },
  { id: 15, x: 0, y: 100 }, { id: 16, x: 20, y: 100 }, { id: 17, x: 40, y: 100 }, { id: 18, x: 60, y: 100 }, { id: 19, x: 80, y: 100 },
  { id: 20, x: 80, y: 20 }, { id: 21, x: 60, y: 40 }, { id: 22, x: 50, y: 50 }, { id: 23, x: 40, y: 60 }, { id: 24, x: 20, y: 80 },
  { id: 25, x: 20, y: 20 }, { id: 26, x: 40, y: 40 }, { id: 27, x: 60, y: 60 }, { id: 28, x: 80, y: 80 }
];

const STEPS: Record<string, number> = {
  '도': 1, '개': 2, '걸': 3, '윷': 4, '모': 5, '빽도': -1, '낙': 0
};

export const YutNori: React.FC<YutNoriProps> = ({ session, currentUser, isSpectator }) => {
  const gameState = session.yutNoriGame as YutNoriGameState;
  const [message, setMessage] = useState<string>('');
  const [selectedResultIndex, setSelectedResultIndex] = useState<number | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  if (!gameState) return null;

  const currentTurnId = gameState.turnOrder[gameState.currentTurnIndex];
  const myTeamId = session.players[currentUser.uid]?.teamId || 'TEAM_A';
  const isMyTurn = !isSpectator && (gameState.mode === 'TEAM' ? currentTurnId === myTeamId : currentTurnId === currentUser.uid);
  const throwResults = gameState.throwResults || [];

  const getPlayerName = (id: string) => {
    if (gameState.mode === 'TEAM') {
      return id === 'TEAM_A' ? 'A팀' : 'B팀';
    }
    return session.players[id]?.nickname || 'Unknown';
  };

  const throwYut = (): { result: YutResult, sticks: Stick[] } => {
    const sticks: Stick[] = [
      { isFlat: Math.random() < 0.4, isMarked: true, rotation: Math.random() * 60 - 30, offsetX: Math.random() * 40 - 20, offsetY: Math.random() * 40 - 20 },
      { isFlat: Math.random() < 0.4, isMarked: false, rotation: Math.random() * 60 - 30, offsetX: Math.random() * 40 - 20, offsetY: Math.random() * 40 - 20 },
      { isFlat: Math.random() < 0.4, isMarked: false, rotation: Math.random() * 60 - 30, offsetX: Math.random() * 40 - 20, offsetY: Math.random() * 40 - 20 },
      { isFlat: Math.random() < 0.4, isMarked: false, rotation: Math.random() * 60 - 30, offsetX: Math.random() * 40 - 20, offsetY: Math.random() * 40 - 20 },
    ];

    let result: YutResult;

    // 5% chance of Nak
    if (Math.random() < 0.05) {
      result = '낙';
      // Scatter sticks far away to simulate falling off the board
      sticks.forEach(s => {
        s.offsetX = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 40 + 60);
        s.offsetY = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 40 + 60);
      });
    } else {
      const flatCount = sticks.filter(s => s.isFlat).length;
      if (flatCount === 0) result = '모';
      else if (flatCount === 1 && sticks[0].isFlat) result = '빽도';
      else if (flatCount === 1) result = '도';
      else if (flatCount === 2) result = '개';
      else if (flatCount === 3) result = '걸';
      else result = '윷';
    }

    return { result, sticks };
  };

  const handleThrow = () => {
    if (gameState.isThrowing || !isMyTurn || !gameState.canThrow) return;
    setMessage('');

    // Sync throwing state to Firebase so opponents can see
    update(ref(db, `sessions/${session.id}/yutNoriGame`), {
      isThrowing: true,
      currentSticks: null,
      lastUpdate: Date.now()
    });

    setTimeout(() => {
      const { result, sticks } = throwYut();
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 200);
      
      const newResults = result === '낙' ? [...throwResults] : [...throwResults, result];
      let canThrow = false;
      if (result === '윷' || result === '모') {
        canThrow = true;
      }

      update(ref(db, `sessions/${session.id}/yutNoriGame`), {
        throwResults: newResults,
        canThrow,
        isThrowing: false,
        currentSticks: sticks,
        lastUpdate: Date.now()
      });

      if (result === '낙') {
        setMessage(`'낙'입니다! 윷이 판 밖으로 나갔습니다.`);
      } else if (result === '윷' || result === '모') {
        setMessage(`'${result}'! 한 번 더 던지세요!`);
      } else {
        setMessage(`'${result}'이(가) 나왔습니다. 말을 이동하세요.`);
      }
      setSelectedResultIndex(null);
    }, 600);
  };

  const calculatePath = (currentPath: number[], steps: number): number[] => {
    let newPath = [...currentPath];
    
    if (steps === -1) {
      if (newPath.length === 0) return newPath; // Cannot go back from waiting
      
      const current = newPath[newPath.length - 1];
      let backNode = 0;
      
      if (current === 0) {
        if (newPath.length > 1) {
          const prev = newPath[newPath.length - 2];
          if (prev === 28) backNode = 28;
          else if (prev === 19) backNode = 19;
          else backNode = 19; // Default fallback
        } else {
          backNode = 19;
        }
      }
      else if (current >= 1 && current <= 19) backNode = current - 1;
      else if (current === 20) backNode = 5;
      else if (current === 21) backNode = 20;
      else if (current === 23) backNode = 22;
      else if (current === 24) backNode = 23;
      else if (current === 25) backNode = 10;
      else if (current === 26) backNode = 25;
      else if (current === 27) backNode = 22;
      else if (current === 28) backNode = 27;
      else if (current === 22) {
        // Find where we came from
        let cameFrom26 = false;
        for (let i = newPath.length - 1; i >= 0; i--) {
          if (newPath[i] === 26) { cameFrom26 = true; break; }
          if (newPath[i] === 21) { cameFrom26 = false; break; }
        }
        backNode = cameFrom26 ? 26 : 21;
      }
      
      newPath.push(backNode);
      return newPath;
    }
    
    for (let i = 0; i < steps; i++) {
      const current = newPath.length > 0 ? newPath[newPath.length - 1] : -1;
      
      if (current === 30) break; // Already finished
      
      let nextNode = -1;
      if (current === -1) {
        nextNode = 1;
      } else if (current === 0) {
        if (newPath.length > 1) {
          const prev = newPath[newPath.length - 2];
          if (prev === 1) {
            nextNode = 1;
          } else {
            nextNode = 30;
          }
        } else {
          nextNode = 30;
        }
      } else if (current === 19 || current === 28) {
        nextNode = 0;
      } else if (current === 5 && i === 0) {
        nextNode = 20;
      } else if (current === 10 && i === 0) {
        nextNode = 25;
      } else if (current === 22 && i === 0) {
        nextNode = 27;
      } else if (current >= 1 && current < 19) {
        nextNode = current + 1;
      } else if (current === 20) {
        nextNode = 21;
      } else if (current === 21) {
        nextNode = 22;
      } else if (current === 22) {
        if (i > 0) {
          const prev = newPath[newPath.length - 2];
          if (prev === 21) nextNode = 23;
          else if (prev === 26) nextNode = 27;
          else nextNode = 27;
        } else {
          nextNode = 27;
        }
      } else if (current === 23) {
        nextNode = 24;
      } else if (current === 24) {
        nextNode = 15;
      } else if (current === 25) {
        nextNode = 26;
      } else if (current === 26) {
        nextNode = 22;
      } else if (current === 27) {
        nextNode = 28;
      }
      
      newPath.push(nextNode);
    }
    
    return newPath;
  };

  const handlePieceClick = (pieceId: string) => {
    if (!isMyTurn || isSpectator || throwResults.length === 0) return;

    if (gameState.canThrow) {
      setMessage('윷을 먼저 다 던져주세요!');
      return;
    }

    let resultIndex = selectedResultIndex;
    if (resultIndex === null) {
      if (throwResults.length === 1) {
        resultIndex = 0;
      } else {
        setMessage('사용할 윷 결과를 먼저 선택해주세요.');
        return;
      }
    }

    const result = throwResults[resultIndex];
    const steps = STEPS[result];

    let myPieces = [...gameState.pieces[currentTurnId]];
    const pieceIndex = myPieces.findIndex(p => p.id === pieceId);
    if (pieceIndex === -1) return;
    const piece = myPieces[pieceIndex];

    if (piece.position === 30) return;

    if (piece.position === -1 && steps === -1) {
      setMessage('대기 중인 말은 빽도로 이동할 수 없습니다.');
      return;
    }

    const newPath = calculatePath(piece.path || [], steps);
    const newPosition = newPath.length > 0 ? newPath[newPath.length - 1] : -1;

    let caught = false;

    const newPieces = { ...gameState.pieces };
    newPieces[currentTurnId] = [...myPieces];

    if (newPosition !== 30 && newPosition !== -1) {
      Object.keys(newPieces).forEach(teamId => {
        if (teamId !== currentTurnId) {
          let teamPieces = [...newPieces[teamId]];
          let teamCaught = false;
          teamPieces = teamPieces.map(p => {
            if (p.position === newPosition) {
              teamCaught = true;
              return { ...p, position: -1, path: [] };
            }
            return p;
          });
          if (teamCaught) {
            caught = true;
            newPieces[teamId] = teamPieces;
          }
        }
      });
    }

    // Move all grouped pieces
    newPieces[currentTurnId] = newPieces[currentTurnId].map(p => {
      // If the piece is in the waiting area (-1), only move the clicked piece
      if (piece.position === -1) {
        if (p.id === piece.id) {
          return { ...p, position: newPosition, path: newPath };
        }
        return p;
      }
      
      // Otherwise, move all pieces at the same position (grouped pieces)
      if (p.position === piece.position) {
        return { ...p, position: newPosition, path: newPath };
      }
      return p;
    });

    const newResults = [...throwResults];
    newResults.splice(resultIndex, 1);

    let canThrow = gameState.canThrow;
    if (caught) {
      canThrow = true;
      setMessage('상대 말을 잡았습니다! 한 번 더 던지세요!');
    } else {
      setMessage('');
    }

    const finishedCount = newPieces[currentTurnId].filter(p => p.position === 30).length;
    let winner = gameState.winner;
    let status = gameState.status;
    if (finishedCount === 4) {
      winner = currentTurnId;
      status = 'FINISHED';
    }

    const updateData: any = {
      pieces: newPieces,
      throwResults: newResults,
      canThrow,
      status,
      lastUpdate: Date.now()
    };
    if (winner !== undefined) {
      updateData.winner = winner;
    }

    update(ref(db, `sessions/${session.id}/yutNoriGame`), updateData);

    setSelectedResultIndex(null);
  };

  const handleNextTurn = () => {
    if (!isMyTurn) return;
    const nextIndex = (gameState.currentTurnIndex + 1) % gameState.turnOrder.length;
    update(ref(db, `sessions/${session.id}/yutNoriGame`), {
      currentTurnIndex: nextIndex,
      throwResults: [],
      canThrow: true,
      currentSticks: null,
      lastUpdate: Date.now()
    });
    setMessage('');
    setSelectedResultIndex(null);
  };

  const getColorClass = (teamId: string) => {
    if (teamId === 'TEAM_A') return 'bg-blue-500';
    if (teamId === 'TEAM_B') return 'bg-red-500';
    
    const index = (gameState.turnOrder || []).indexOf(teamId);
    const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500'];
    return colors[index >= 0 ? index % colors.length : 0] || 'bg-gray-500';
  };

  const renderPieces = () => {
    const piecesElements: React.ReactNode[] = [];

    Object.entries(gameState.pieces).forEach(([teamId, teamPieces]) => {
      const colorClass = getColorClass(teamId);

      const positionCounts: Record<number, any[]> = {};
      teamPieces.forEach(piece => {
        if (piece.position === -1 || piece.position === 30) return;
        if (!positionCounts[piece.position]) positionCounts[piece.position] = [];
        positionCounts[piece.position].push(piece);
      });

      Object.entries(positionCounts).forEach(([posStr, piecesAtPos]) => {
        const pos = parseInt(posStr);
        const node = BOARD_NODES.find(n => n.id === pos);
        if (!node) return;

        const mainPiece = piecesAtPos[0];
        const isMovable = isMyTurn && throwResults.length > 0 && !gameState.canThrow && teamId === currentTurnId && (throwResults.length === 1 || selectedResultIndex !== null);

        piecesElements.push(
          <div
            key={`pos-${teamId}-${pos}`}
            className="absolute z-20"
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={() => handlePieceClick(mainPiece.id)}
          >
            <div className={`relative w-8 h-8 cursor-pointer hover:scale-110 transition-transform ${isMovable ? 'animate-pulse ring-4 ring-yellow-400 rounded-full' : ''}`}>
              {piecesAtPos.map((p, idx) => (
                <motion.div
                  key={p.id}
                  layoutId={`piece-${teamId}-${p.id}`}
                  className={`absolute w-8 h-8 rounded-full ${colorClass} shadow-md border-2 border-white flex items-center justify-center`}
                  style={{
                    top: -idx * 5,
                    left: -idx * 5,
                    zIndex: 10 + idx
                  }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {idx === piecesAtPos.length - 1 && piecesAtPos.length > 1 && (
                    <span className="text-white text-xs font-bold drop-shadow-md">{piecesAtPos.length}</span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        );
      });
    });

    return piecesElements;
  };

  const renderWaitingArea = (teamId: string, label: string) => {
    const teamPieces = gameState.pieces[teamId] || [];
    const waitingPieces = teamPieces.filter(p => p.position === -1);
    const colorClass = getColorClass(teamId);
    const isMovable = isMyTurn && throwResults.length > 0 && !gameState.canThrow && teamId === currentTurnId && (throwResults.length === 1 || selectedResultIndex !== null);

    return (
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-gray-500">{label} 대기</span>
        <div className="flex gap-2 p-2 bg-white/50 rounded-lg border border-black/10 min-h-[40px]">
          {waitingPieces.map(piece => (
            <motion.div
              layoutId={`piece-${teamId}-${piece.id}`}
              key={piece.id}
              onClick={() => handlePieceClick(piece.id)}
              className={`w-6 h-6 rounded-full ${colorClass} text-white flex items-center justify-center text-xs font-bold shadow-sm cursor-pointer border-2 border-white hover:scale-110 transition-transform ${isMovable ? 'animate-pulse ring-4 ring-yellow-400' : ''}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderFinishedArea = (teamId: string, label: string) => {
    const teamPieces = gameState.pieces[teamId] || [];
    const finishedPieces = teamPieces.filter(p => p.position === 30);
    const colorClass = getColorClass(teamId);

    return (
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-gray-500">{label} 완주</span>
        <div className="flex gap-1 p-2 bg-white/50 rounded-lg border border-black/10 min-h-[40px] items-center">
          {finishedPieces.map((piece) => (
            <motion.div
              layoutId={`piece-${teamId}-${piece.id}`}
              key={piece.id}
              className={`w-4 h-4 rounded-full ${colorClass} border border-white shadow-sm`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          ))}
        </div>
      </div>
    );
  };

  if (gameState.status === 'FINISHED') {
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#fdf6e3]">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl">
          <h2 className="text-4xl font-bold text-[#859900] mb-4">🎉 게임 종료! 🎉</h2>
          <p className="text-2xl text-[#073642] mb-8">{getPlayerName(gameState.winner!)} 승리!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#fdf6e3] font-sans text-[#586e75] p-4 md:p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full flex flex-col md:flex-row gap-8">
        
        {/* Left: Board Area */}
        <div className="flex-1 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-6 text-[#073642]">윷놀이 보드</h2>
          
          <div className="relative w-full max-w-[400px] aspect-square bg-[#eee8d5] rounded-xl shadow-inner border-4 border-[#8b4513] p-4 mb-6">
            <div className="relative w-full h-full">
              {/* SVG Lines */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                <line x1="100%" y1="100%" x2="100%" y2="0%" stroke="#8b4513" strokeWidth="2" />
                <line x1="100%" y1="0%" x2="0%" y2="0%" stroke="#8b4513" strokeWidth="2" />
                <line x1="0%" y1="0%" x2="0%" y2="100%" stroke="#8b4513" strokeWidth="2" />
                <line x1="0%" y1="100%" x2="100%" y2="100%" stroke="#8b4513" strokeWidth="2" />
                <line x1="100%" y1="0%" x2="0%" y2="100%" stroke="#8b4513" strokeWidth="2" />
                <line x1="0%" y1="0%" x2="100%" y2="100%" stroke="#8b4513" strokeWidth="2" />
              </svg>

              {/* Nodes */}
              <div className="absolute inset-0">
                {BOARD_NODES.map(node => {
                  const isCorner = [0, 5, 10, 15].includes(node.id);
                  const isCenter = node.id === 22;
                  return (
                    <div
                      key={node.id}
                      className={`absolute rounded-full bg-white border-2 border-[#8b4513] shadow-sm flex items-center justify-center text-[8px] font-bold text-[#8b4513]
                        ${isCorner || isCenter ? 'w-8 h-8 z-10' : 'w-5 h-5 z-0'}`}
                      style={{
                        left: `${node.x}%`,
                        top: `${node.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      {node.id === 0 && <span className="absolute top-8 whitespace-nowrap text-xs bg-white/80 px-1 rounded">출발/도착</span>}
                    </div>
                  );
                })}
                {renderPieces()}
              </div>
            </div>
          </div>

          <div className="w-full max-w-[400px] grid grid-cols-2 gap-4">
            {gameState.turnOrder.map(teamId => (
              <div key={teamId} className="flex flex-col gap-2">
                {renderWaitingArea(teamId, getPlayerName(teamId))}
                {renderFinishedArea(teamId, getPlayerName(teamId))}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Controls & Status */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-black/5">
            <h3 className="text-xl font-bold mb-4 text-[#073642]">
              현재 턴: {getPlayerName(currentTurnId)}
              {isMyTurn && <span className="ml-2 text-sm text-[#859900]">(내 턴)</span>}
            </h3>
            
            <div className="mb-6">
              <p className="text-sm font-bold mb-2 text-gray-600">나온 윷 (클릭하여 선택 후 말을 클릭하세요)</p>
              <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-gray-50 rounded-lg border border-gray-200">
                {throwResults.length === 0 && <span className="text-gray-400 italic text-sm">아직 던지지 않았습니다.</span>}
                {throwResults.map((res, idx) => (
                  <button
                    key={idx}
                    onClick={() => isMyTurn && setSelectedResultIndex(idx)}
                    className={`px-3 py-1 rounded-full font-bold text-sm shadow-sm transition-colors
                      ${selectedResultIndex === idx ? 'bg-[#d33682] text-white ring-2 ring-offset-1 ring-[#d33682]' : 'bg-[#268bd2] text-white hover:bg-[#2075b3]'}`}
                  >
                    {res}
                  </button>
                ))}
              </div>
            </div>

            <motion.div 
              className="h-40 flex items-center justify-center bg-[#d4b886] rounded-xl mb-6 border-4 border-[#8b4513] relative overflow-hidden perspective-1000 shadow-inner"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(139, 69, 19, 0.1) 10px, rgba(139, 69, 19, 0.1) 20px)'
              }}
              animate={isShaking ? { x: [-5, 5, -5, 5, 0], y: [-5, 5, -5, 5, 0] } : {}}
              transition={{ duration: 0.2 }}
            >
              {gameState.isThrowing ? (
                <div className="flex gap-4">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      animate={{
                        rotateX: [0, 360, 720, 1080],
                        rotateY: [0, 180, 360, 540],
                        rotateZ: [0, 90, 180, 270],
                        y: [0, -100, -150, -80, 0],
                        x: [0, i % 2 === 0 ? -40 : 40, i % 2 === 0 ? -60 : 60, 0],
                        scale: [1, 1.2, 1.5, 1.2, 1]
                      }}
                      transition={{
                        duration: 0.6,
                        ease: "easeIn",
                        delay: i * 0.05,
                      }}
                      className="w-8 h-32 rounded-full border-2 border-[#8b4513] shadow-lg bg-[#8b4513]"
                    />
                  ))}
                </div>
              ) : gameState.currentSticks ? (
                <div className="flex items-center justify-center relative w-full h-full">
                  {gameState.currentSticks.map((stick, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 1.5, opacity: 0, y: -100, rotateX: 720, rotateY: 360 }}
                      animate={{ 
                        scale: 1, 
                        opacity: 1, 
                        y: stick.offsetY,
                        x: stick.offsetX + (i - 1.5) * 40, // Spread them out horizontally
                        rotateZ: stick.rotation
                      }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 400, 
                        damping: 15, 
                        mass: 1,
                        delay: i * 0.02 
                      }}
                      className="absolute flex flex-col items-center gap-1"
                    >
                      <div className={`w-8 h-32 rounded-full border-2 border-[#8b4513] shadow-xl flex items-center justify-center relative overflow-hidden
                        ${stick.isFlat ? 'bg-[#fdf6e3]' : 'bg-[#8b4513]'}`}
                      >
                        {!stick.isFlat && (
                          <div className="absolute inset-x-1 top-2 bottom-2 border-x border-black/20 rounded-full" />
                        )}
                        {stick.isFlat && stick.isMarked && (
                          <span className="text-red-500 font-bold text-lg">X</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400 font-medium">윷을 던져주세요</span>
              )}
            </motion.div>

            <AnimatePresence mode="wait">
              {message && (
                <motion.div
                  key={message}
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`text-center font-bold mb-6 p-3 rounded-lg shadow-sm border ${
                    message.includes('잡았습니다') 
                      ? 'bg-red-100 text-red-600 border-red-200 text-lg animate-pulse' 
                      : message.includes('한 번 더') 
                        ? 'bg-blue-100 text-blue-600 border-blue-200 text-lg'
                        : 'bg-white/50 text-[#d33682] border-black/5'
                  }`}
                >
                  {message}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-4">
              <button
                onClick={handleThrow}
                disabled={gameState.isThrowing || !isMyTurn || !gameState.canThrow}
                className="flex-1 py-3 bg-[#859900] hover:bg-[#738a00] text-white rounded-xl font-bold shadow-md disabled:opacity-50 transition-colors"
              >
                윷 던지기
              </button>
              
              <button
                onClick={handleNextTurn}
                disabled={gameState.isThrowing || !isMyTurn}
                className="flex-1 py-3 bg-[#2aa198] hover:bg-[#258a82] text-white rounded-xl font-bold shadow-md disabled:opacity-50 transition-colors"
              >
                {(throwResults.length > 0 || gameState.canThrow) ? '턴 포기하고 넘기기' : '턴 넘기기'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
