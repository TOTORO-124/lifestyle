import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, update } from 'firebase/database';
import { db } from '../firebase';
import { Session, YutNoriGameState, Player } from '../types';
import { ToggleLeft, ToggleRight } from 'lucide-react';

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
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [power, setPower] = useState(0);
  const [isCharging, setIsCharging] = useState(false);
  const [isAutoPlayEnabled, setIsAutoPlayEnabled] = useState<boolean>(false);

  if (!gameState) return null;

  const getNextTurnIndex = (currentIndex: number, rankings: string[] = []) => {
    let next = (currentIndex + 1) % gameState.turnOrder.length;
    let loopCount = 0;
    while (rankings.includes(gameState.turnOrder[next]) && loopCount < gameState.turnOrder.length) {
      next = (next + 1) % gameState.turnOrder.length;
      loopCount++;
    }
    return next;
  };

  useEffect(() => {
    if (gameState.status !== 'PLAYING' || !gameState.turnStartTime) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, 120 - Math.floor((Date.now() - gameState.turnStartTime!) / 1000));
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        clearInterval(interval);
        const myTeamId = session.players[currentUser.uid]?.teamId || 'TEAM_A';
        const isMyTurn = gameState.mode === 'TEAM' ? gameState.turnOrder[gameState.currentTurnIndex] === myTeamId : gameState.turnOrder[gameState.currentTurnIndex] === currentUser.uid;
        
        if (session.hostId === currentUser.uid || isMyTurn) {
          const nextIndex = getNextTurnIndex(gameState.currentTurnIndex, gameState.rankings || []);
          update(ref(db, `sessions/${session.id}/yutNoriGame`), {
            currentTurnIndex: nextIndex,
            throwResults: [],
            canThrow: true,
            currentSticks: null,
            lastUpdate: Date.now(),
            turnStartTime: Date.now()
          });
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState.turnStartTime, gameState.status, session.hostId, currentUser.uid, session.id, gameState.currentTurnIndex, gameState.turnOrder.length, gameState.rankings, gameState.turnOrder]);

  useEffect(() => {
    if (!isCharging) return;
    const interval = setInterval(() => {
      // Triangle wave: 0 to 100 and back, cycle takes 1.6 seconds (800ms per direction)
      setPower(Math.abs(((Date.now() / 8) % 200) - 100));
    }, 16);
    return () => clearInterval(interval);
  }, [isCharging]);

  const currentTurnId = gameState.turnOrder[gameState.currentTurnIndex];
  const myTeamId = session.players[currentUser.uid]?.teamId || 'TEAM_A';
  const isMyTurn = !isSpectator && (gameState.mode === 'TEAM' ? currentTurnId === myTeamId : currentTurnId === currentUser.uid);
  
  const isTeamOnlyBots = (teamId: string) => {
    const teamPlayers = Object.values(session.players || {}).filter(p => (p as Player).teamId === teamId);
    return teamPlayers.length > 0 && teamPlayers.every(p => (p as Player).id.startsWith('ai_'));
  };
  const isBotTurn = (gameState.mode === 'INDIVIDUAL' && currentTurnId.startsWith('ai_')) || 
                    (gameState.mode === 'TEAM' && isTeamOnlyBots(currentTurnId));
  const amIResponsibleForBot = session.hostId === currentUser.uid && isBotTurn;

  const throwResults = gameState.throwResults || [];

  const executeAutoPlay = () => {
    if (gameState.canThrow && !isShaking && !gameState.isThrowing) {
      if (isCharging) setIsCharging(false);
      executeThrow(Math.random() * 100, true);
    } else if (!gameState.canThrow && throwResults.length > 0) {
      const resultIndex = 0;
      const result = throwResults[resultIndex];
      const steps = STEPS[result];
      
      const myPieces = gameState.pieces[currentTurnId] || [];
      const validPieces = myPieces.filter(p => {
        if (p.position === 30) return false;
        if (p.position === -1 && steps === -1) return false;
        return true;
      });
      
      if (validPieces.length > 0) {
        const randomPiece = validPieces[Math.floor(Math.random() * validPieces.length)];
        handlePieceClick(randomPiece.id, resultIndex, true);
      } else {
        // No valid moves, consume the result and skip
        const newResults = [...throwResults];
        newResults.splice(resultIndex, 1);
        
        let nextIndex = gameState.currentTurnIndex;
        let canThrow = gameState.canThrow;
        if (newResults.length === 0 && !canThrow) {
          nextIndex = getNextTurnIndex(gameState.currentTurnIndex, gameState.rankings || []);
          canThrow = true;
        }
        
        const updateData: any = {
          throwResults: newResults,
          lastUpdate: Date.now(),
          turnStartTime: (nextIndex === gameState.currentTurnIndex) ? gameState.turnStartTime : Date.now()
        };
        if (nextIndex !== gameState.currentTurnIndex) {
          updateData.currentTurnIndex = nextIndex;
          updateData.canThrow = canThrow;
        }
        update(ref(db, `sessions/${session.id}/yutNoriGame`), updateData);
      }
    } else if (!gameState.canThrow && throwResults.length === 0) {
      handleNextTurn();
    }
  };

  // Auto-play logic
  useEffect(() => {
    if (gameState.status !== 'PLAYING' || isSpectator) return;
    if (!isMyTurn && !amIResponsibleForBot) return;
    
    const shouldAutoPlay = isAutoPlayEnabled || amIResponsibleForBot;
    if (!shouldAutoPlay) return;

    // Use a ref to avoid clearing the timeout when timeLeft changes, unless it's no longer auto-play
    const delay = amIResponsibleForBot ? 800 : 500;
    const timer = setTimeout(executeAutoPlay, delay);
    return () => clearTimeout(timer);
  }, [isMyTurn, amIResponsibleForBot, gameState.status, gameState.canThrow, throwResults, isShaking, isCharging, currentTurnId, session.id, isAutoPlayEnabled, gameState.isThrowing, gameState.turnStartTime, gameState.currentTurnIndex, gameState.rankings, session.players]);

  // Auto-advance turn if no actions left
  useEffect(() => {
    if (gameState.status !== 'PLAYING' || isSpectator) return;
    if (!isMyTurn) return;
    if (gameState.isThrowing) return;

    const checkHasValidMoves = () => {
      if (gameState.canThrow) return true;
      if (throwResults.length === 0) return false;
      
      const myPieces = gameState.pieces[currentTurnId] || [];
      for (const result of throwResults) {
        const steps = STEPS[result];
        const validPieces = myPieces.filter(p => {
          if (p.position === 30) return false;
          if (p.position === -1 && steps === -1) return false;
          return true;
        });
        if (validPieces.length > 0) return true;
      }
      return false;
    };
    
    if (!checkHasValidMoves()) {
      // Small delay to allow user to see the result before turn changes
      const timer = setTimeout(() => {
        handleNextTurn();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState.status, isSpectator, isMyTurn, gameState.canThrow, throwResults, gameState.isThrowing, gameState.pieces, currentTurnId]);

  const getPlayerName = (id: string) => {
    if (gameState.mode === 'TEAM') {
      return id === 'TEAM_A' ? 'A팀' : 'B팀';
    }
    return session.players[id]?.nickname || 'Unknown';
  };

  const throwYut = (finalPower: number): { result: YutResult, sticks: Stick[] } => {
    let result: YutResult = '도';
    const rand = Math.random();

    if (finalPower < 20) {
      if (rand < 0.3) result = '빽도';
      else if (rand < 0.7) result = '도';
      else result = '개';
    } else if (finalPower > 85) {
      if (rand < 0.4) result = '낙';
      else if (rand < 0.6) result = '도';
      else if (rand < 0.8) result = '개';
      else if (rand < 0.9) result = '걸';
      else if (rand < 0.95) result = '윷';
      else result = '모';
    } else if (finalPower >= 45 && finalPower <= 55) {
      if (rand < 0.1) result = '도';
      else if (rand < 0.35) result = '개';
      else if (rand < 0.65) result = '걸';
      else if (rand < 0.85) result = '윷';
      else result = '모';
    } else {
      if (rand < 0.05) result = '빽도';
      else if (rand < 0.25) result = '도';
      else if (rand < 0.60) result = '개';
      else if (rand < 0.85) result = '걸';
      else if (rand < 0.95) result = '윷';
      else result = '모';
    }

    let flatCount = 0;
    if (result === '도') { flatCount = 1; }
    else if (result === '빽도') { flatCount = 1; }
    else if (result === '개') { flatCount = 2; }
    else if (result === '걸') { flatCount = 3; }
    else if (result === '윷') { flatCount = 4; }
    else if (result === '모') { flatCount = 0; }
    else if (result === '낙') { flatCount = Math.floor(Math.random() * 5); }

    const sticks: Stick[] = Array(4).fill(null).map((_, i) => ({
      isFlat: false,
      isMarked: i === 0,
      rotation: Math.random() * 60 - 30,
      offsetX: Math.random() * 40 - 20,
      offsetY: Math.random() * 40 - 20
    }));

    if (result === '빽도') {
      sticks[0].isFlat = true;
    } else if (result === '도') {
      sticks[0].isFlat = false;
      const randomIdx = Math.floor(Math.random() * 3) + 1; // 1, 2, or 3
      sticks[randomIdx].isFlat = true;
    } else if (result === '윷') {
      sticks.forEach(s => s.isFlat = true);
    } else if (result === '모') {
      sticks.forEach(s => s.isFlat = false);
    } else {
      // 개, 걸, 낙
      const indices = [0, 1, 2, 3].sort(() => Math.random() - 0.5);
      for (let i = 0; i < flatCount; i++) {
        sticks[indices[i]].isFlat = true;
      }
    }

    if (result === '낙') {
      sticks.forEach(s => {
        s.offsetX = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 80 + 80);
        s.offsetY = (Math.random() > 0.5 ? 1 : -1) * (Math.random() * 80 + 80);
      });
    }

    return { result, sticks };
  };

  const handleChargeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (gameState.isThrowing || !isMyTurn || !gameState.canThrow) return;
    setIsCharging(true);
    setPower(0);
    setMessage('');
  };

  const handleChargeEnd = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isCharging) return;
    setIsCharging(false);
    executeThrow(power);
  };

  const executeThrow = (finalPower: number, isAutoPlay: boolean = false) => {

    // Sync throwing state to Firebase so opponents can see
    update(ref(db, `sessions/${session.id}/yutNoriGame`), {
      isThrowing: true,
      currentSticks: null,
      lastUpdate: Date.now()
    });

    setTimeout(() => {
      const { result, sticks } = throwYut(finalPower);
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
        lastUpdate: Date.now(),
        turnStartTime: isAutoPlay ? gameState.turnStartTime : Date.now()
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

  const handlePieceClick = (pieceId: string, overrideResultIndex?: number, isAutoPlay: boolean = false) => {
    if ((!isMyTurn && !amIResponsibleForBot) || isSpectator || throwResults.length === 0) return;
    if (amIResponsibleForBot && !isAutoPlay) return;

    if (gameState.canThrow) {
      setMessage('윷을 먼저 다 던져주세요!');
      return;
    }

    let resultIndex = overrideResultIndex !== undefined ? overrideResultIndex : selectedResultIndex;
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

    let newResults = [...throwResults];
    newResults.splice(resultIndex, 1);

    let canThrow = gameState.canThrow;
    if (caught) {
      canThrow = true;
      setMessage('상대 말을 잡았습니다! 한 번 더 던지세요!');
    } else {
      setMessage('');
    }

    const finishedCount = newPieces[currentTurnId].filter(p => p.position === 30).length;
    let rankings = gameState.rankings || [];
    let status = gameState.status;
    let nextIndex = gameState.currentTurnIndex;

    if (finishedCount === newPieces[currentTurnId].length && !rankings.includes(currentTurnId)) {
      rankings = [...rankings, currentTurnId];
      if (rankings.length >= gameState.turnOrder.length - 1) {
        status = 'FINISHED';
        const lastPlayer = gameState.turnOrder.find(id => !rankings.includes(id));
        if (lastPlayer && !rankings.includes(lastPlayer)) {
          rankings.push(lastPlayer);
        }
      }
    }

    if (rankings.includes(currentTurnId)) {
      canThrow = false;
      newResults = [];
      if (status !== 'FINISHED') {
        nextIndex = getNextTurnIndex(gameState.currentTurnIndex, rankings);
      }
    }

    const updateData: any = {
      pieces: newPieces,
      throwResults: newResults,
      canThrow,
      status,
      rankings,
      lastUpdate: Date.now(),
      turnStartTime: (isAutoPlay && nextIndex === gameState.currentTurnIndex) ? gameState.turnStartTime : Date.now()
    };
    if (nextIndex !== gameState.currentTurnIndex) {
      updateData.currentTurnIndex = nextIndex;
    }

    update(ref(db, `sessions/${session.id}/yutNoriGame`), updateData);

    setSelectedResultIndex(null);
  };

  const handleNextTurn = () => {
    if (!isMyTurn && !amIResponsibleForBot) return;
    const nextIndex = getNextTurnIndex(gameState.currentTurnIndex, gameState.rankings || []);
    update(ref(db, `sessions/${session.id}/yutNoriGame`), {
      currentTurnIndex: nextIndex,
      throwResults: [],
      canThrow: true,
      currentSticks: null,
      lastUpdate: Date.now(),
      turnStartTime: Date.now()
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
        <div className="flex flex-wrap gap-2 p-2 bg-white/50 rounded-lg border border-black/10 min-h-[40px]">
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
        <div className="flex flex-wrap gap-1 p-2 bg-white/50 rounded-lg border border-black/10 min-h-[40px] items-center">
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
    const rankings = gameState.rankings || [];
    return (
      <div className="flex items-center justify-center h-full w-full bg-[#fdf6e3]">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md w-full">
          <h2 className="text-4xl font-bold text-[#859900] mb-6">🎉 게임 종료! 🎉</h2>
          
          <div className="flex flex-col gap-4 mb-8">
            {rankings.map((id, index) => (
              <div key={id} className={`p-4 rounded-xl font-bold text-lg flex items-center justify-between ${index === 0 ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-400' : index === 1 ? 'bg-gray-100 text-gray-700 border border-gray-300' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                <span>{index + 1}등</span>
                <span>{getPlayerName(id)}</span>
              </div>
            ))}
          </div>

          {session.hostId === currentUser.uid ? (
            <div className="flex gap-4">
              <button
                onClick={() => {
                  const pieceCount = gameState.pieces[gameState.turnOrder[0]].length;
                  update(ref(db, `sessions/${session.id}/yutNoriGame`), {
                    status: 'PLAYING',
                    currentTurnIndex: 0,
                    throwResults: [],
                    canThrow: true,
                    rankings: [],
                    lastUpdate: Date.now(),
                    turnStartTime: Date.now(),
                    pieces: Object.keys(gameState.pieces).reduce((acc, key) => {
                      acc[key] = Array.from({ length: pieceCount }).map((_, i) => ({ id: `${key}_${i+1}`, position: -1, count: 1, path: [] }));
                      return acc;
                    }, {} as any)
                  });
                }}
                className="flex-1 py-3 bg-[#859900] hover:bg-[#738a00] text-white rounded-xl font-bold shadow-md transition-colors"
              >
                다시 시작
              </button>
              <button
                onClick={() => {
                  update(ref(db, `sessions/${session.id}`), { yutNoriGame: null });
                }}
                className="flex-1 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-bold shadow-md transition-colors"
              >
                대기실로
              </button>
            </div>
          ) : (
            <p className="text-gray-500 font-medium">방장이 다음 게임을 준비 중입니다...</p>
          )}
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
            <h3 className="text-xl font-bold mb-4 text-[#073642] flex flex-wrap items-center justify-between gap-2">
              <div>
                현재 턴: {getPlayerName(currentTurnId)}
                {isMyTurn && <span className="ml-2 text-sm text-[#859900]">(내 턴)</span>}
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsAutoPlayEnabled(!isAutoPlayEnabled)}
                  className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                  title="시간 초과 시 자동 플레이"
                >
                  {isAutoPlayEnabled ? (
                    <><ToggleRight size={18} className="text-green-500" /> 자동 플레이 ON</>
                  ) : (
                    <><ToggleLeft size={18} className="text-gray-400" /> 자동 플레이 OFF</>
                  )}
                </button>
                <div className={`text-sm px-3 py-1 rounded-full font-bold ${timeLeft <= 10 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
                  ⏱ {timeLeft}초
                </div>
              </div>
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

            <div className="min-h-[60px] mb-6 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {message ? (
                  <motion.div
                    key={message}
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`w-full text-center font-bold p-3 rounded-lg shadow-sm border ${
                      message.includes('잡았습니다') 
                        ? 'bg-red-100 text-red-600 border-red-200 text-lg animate-pulse' 
                        : message.includes('한 번 더') 
                          ? 'bg-blue-100 text-blue-600 border-blue-200 text-lg'
                          : 'bg-white/50 text-[#d33682] border-black/5'
                    }`}
                  >
                    {message}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full text-center font-bold p-3 rounded-lg border border-transparent text-gray-400 bg-gray-50/50"
                  >
                    게이지를 맞춰 윷을 던지세요!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex flex-col gap-4">
              {isMyTurn && gameState.canThrow && !gameState.isThrowing && (
                <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden relative border-2 border-gray-300 shadow-inner">
                  {/* Weak Zone (0-20) */}
                  <div className="absolute left-0 top-0 bottom-0 w-[20%] bg-yellow-400 opacity-60" />
                  {/* Perfect Zone (45-55) */}
                  <div className="absolute left-[45%] top-0 bottom-0 w-[10%] bg-green-500 opacity-80" />
                  {/* Overpower Zone (85-100) */}
                  <div className="absolute right-0 top-0 bottom-0 w-[15%] bg-red-500 opacity-60" />
                  
                  {/* Moving Cursor */}
                  <div 
                    className="absolute top-0 bottom-0 w-3 bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,1)] transition-none"
                    style={{ left: `calc(${power}% - 6px)` }}
                  />
                </div>
              )}
              
              <div className="flex gap-4">
                <button
                  onMouseDown={handleChargeStart}
                  onMouseUp={handleChargeEnd}
                  onMouseLeave={handleChargeEnd}
                  onTouchStart={handleChargeStart}
                  onTouchEnd={handleChargeEnd}
                  disabled={gameState.isThrowing || !isMyTurn || !gameState.canThrow}
                  className="flex-[2] py-4 bg-[#859900] hover:bg-[#738a00] text-white rounded-xl font-bold text-lg shadow-md disabled:opacity-50 transition-all active:scale-95 select-none touch-none"
                >
                  {isCharging ? '놓아서 던지기!' : '누르고 게이지 맞추기'}
                </button>
                
                <button
                  onClick={handleNextTurn}
                  disabled={gameState.isThrowing || !isMyTurn}
                  className="flex-1 py-4 bg-[#2aa198] hover:bg-[#258a82] text-white rounded-xl font-bold shadow-md disabled:opacity-50 transition-colors"
                >
                  {(throwResults.length > 0 || gameState.canThrow) ? '턴 포기' : '턴 넘기기'}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
