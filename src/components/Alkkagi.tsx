import React, { useState, useEffect, useRef } from 'react';
import { Player, AlkkagiGameState, AlkkagiPieceState } from '../types';
import { sessionService } from '../services/sessionService';
import { db } from '../firebase';
import { ref, update } from 'firebase/database';

function clonePieces(pieces: any) {
  return JSON.parse(JSON.stringify(pieces));
}

// Constants
const BOARD_SIZE = 800; // virtual units
const PIECE_RADIUS = 30;
const FRICTION = 0.985;
const RESTITUTION = 0.8;
const MASS = 1;
const MAX_SPEED = 25;

interface Props {
  session: any;
  currentUser: any;
  isHost: boolean;
  isAdminMode: boolean;
}

// Fixed-step physics
function stepPhysics(simPieces: AlkkagiPieceState[]) {
  let moving = false;
  simPieces.forEach(p => {
    if (!p.isAlive) return;
    const physP = p as AlkkagiPieceState & { vx: number, vy: number };
    
    physP.x += physP.vx;
    physP.y += physP.vy;
    physP.vx *= FRICTION;
    physP.vy *= FRICTION;
    
    if (Math.abs(physP.vx) > 0.05 || Math.abs(physP.vy) > 0.05) {
      moving = true;
    } else {
      physP.vx = 0;
      physP.vy = 0;
    }
    
    // Out of bounds
    if (physP.x < -PIECE_RADIUS || physP.x > BOARD_SIZE + PIECE_RADIUS || physP.y < -PIECE_RADIUS || physP.y > BOARD_SIZE + PIECE_RADIUS) {
      physP.isAlive = false;
      physP.vx = 0;
      physP.vy = 0;
    }
  });
  
  // Collision
  for (let i = 0; i < simPieces.length; i++) {
    for (let j = i + 1; j < simPieces.length; j++) {
      let p1 = simPieces[i] as AlkkagiPieceState & { vx: number, vy: number };
      let p2 = simPieces[j] as AlkkagiPieceState & { vx: number, vy: number };
      if (!p1.isAlive || !p2.isAlive) continue;
      
      let dx = p2.x - p1.x;
      let dy = p2.y - p1.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < PIECE_RADIUS * 2) {
        // Resolve overlap
        let overlap = PIECE_RADIUS * 2 - dist;
        let nx = dx / dist;
        let ny = dy / dist;
        p1.x -= nx * overlap / 2;
        p2.x += nx * overlap / 2;
        
        let dvx = p2.vx - p1.vx;
        let dvy = p2.vy - p1.vy;
        let dotProduct = dvx * nx + dvy * ny;
        if (dotProduct < 0) { 
          let impulse = -(1 + RESTITUTION) * dotProduct / 2;
          p1.vx -= impulse * nx;
          p1.vy -= impulse * ny;
          p2.vx += impulse * nx;
          p2.vy += impulse * ny;
        }
      }
    }
  }
  return moving;
}

export function getFinalOutcome(initialPieces: Record<string, AlkkagiPieceState>, flickedPieceId: string, vx: number, vy: number) {
  let simPieces = clonePieces(initialPieces);
  let piecesArr = Object.values(simPieces) as (AlkkagiPieceState & { vx: number, vy: number })[];
  
  // Reset velocities
  piecesArr.forEach(p => { p.vx = 0; p.vy = 0; });
  
  const target = piecesArr.find(p => p.id === flickedPieceId);
  if (target) {
    target.vx = vx;
    target.vy = vy;
  }
  
  let steps = 0;
  while (steps < 2000) {
    let moving = stepPhysics(piecesArr);
    if (!moving) break;
    steps++;
  }
  
  let res: Record<string, AlkkagiPieceState> = {};
  piecesArr.forEach(p => {
    const { vx: _vx, vy: _vy, ...rest } = p;
    res[p.id] = rest;
  });
  return res;
}

export const Alkkagi: React.FC<Props> = ({ session, currentUser, isHost, isAdminMode }) => {
  const gameState = session.alkkagiGame as AlkkagiGameState | undefined;
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [localPieces, setLocalPieces] = useState<Record<string, AlkkagiPieceState>>(gameState?.pieces || {});
  const [isAnimating, setIsAnimating] = useState(false);
  const animRef = useRef<number>();
  
  const isSpectator = session.players[currentUser.uid]?.isSpectator;
  const isBlack = currentUser.uid === gameState?.blackPlayerId;
  const isWhite = currentUser.uid === gameState?.whitePlayerId;
  const myTeam = isBlack ? 'BLACK' : (isWhite ? 'WHITE' : null);
  const isMyTurn = !isSpectator && currentUser.uid === gameState?.currentPlayerId;
  const amIResponsibleForBot = isHost && gameState?.currentPlayerId?.startsWith('ai_');
  
  const [dragState, setDragState] = useState<{
    pieceId: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const lastActionId = useRef<string | null>(null);

  // Sync animation
  useEffect(() => {
    if (!gameState) return;
    if (!gameState.action) {
      setLocalPieces(gameState.pieces);
      return;
    }
    
    if (gameState.action.actionId !== lastActionId.current) {
      lastActionId.current = gameState.action.actionId;
      
      // Start Animation
      const initial = clonePieces(gameState.action.initialPieces);
      const simPieces = Object.values(initial) as (AlkkagiPieceState & { vx: number, vy: number })[];
      simPieces.forEach(p => { p.vx = 0; p.vy = 0; });
      const target = simPieces.find(p => p.id === gameState.action!.pieceId);
      if (target) {
        target.vx = gameState.action.vx;
        target.vy = gameState.action.vy;
      }
      
      setIsAnimating(true);
      
      // We don't use absolute time, just fixed ticks for deterministic results
      let loop = () => {
        let moving = false;
        // Run physics multiple steps per frame to speed up animation dramatically
        for (let i = 0; i < 4; i++) {
          if (stepPhysics(simPieces)) {
            moving = true;
          }
        }
        
        let res: Record<string, AlkkagiPieceState> = {};
        simPieces.forEach(p => {
          const { vx, vy, ...rest } = p;
          res[p.id] = rest;
        });
        setLocalPieces(res);
        
        if (moving) {
          animRef.current = requestAnimationFrame(loop);
        } else {
          setIsAnimating(false);
          // Snap to final state to avoid floating point desyncs
          setLocalPieces(gameState.pieces);
        }
      };
      
      animRef.current = requestAnimationFrame(loop);
    } else if (!isAnimating) {
      setLocalPieces(gameState.pieces);
    }
    
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [gameState?.action, gameState?.pieces]);

  // AI Handling
  useEffect(() => {
    if (!amIResponsibleForBot || isAnimating || gameState?.status !== 'PLAYING') return;
    
    // Check if AI action was very recent
    let delay = 1000;
    if (gameState.action) {
      const elapsed = Date.now() - gameState.action.timestamp;
      if (elapsed < 1500) {
        delay = 1500 - elapsed;
      }
    }
    
    const timeout = setTimeout(async () => {
      // Execute AI Move
      const aiTeam = gameState.currentPlayerId === gameState.blackPlayerId ? 'BLACK' : 'WHITE';
      const enemyTeam = aiTeam === 'BLACK' ? 'WHITE' : 'BLACK';
      
      const aiPieces = (Object.values(localPieces) as AlkkagiPieceState[]).filter(p => p.isAlive && p.team === aiTeam);
      const enemyPieces = (Object.values(localPieces) as AlkkagiPieceState[]).filter(p => p.isAlive && p.team === enemyTeam);
      
      if (aiPieces.length === 0 || enemyPieces.length === 0) return;
      
      const myPiece = aiPieces[Math.floor(Math.random() * aiPieces.length)];
      const enemyPiece = enemyPieces[Math.floor(Math.random() * enemyPieces.length)];
      
      let dx = enemyPiece.x - myPiece.x;
      let dy = enemyPiece.y - myPiece.y;
      let dist = Math.sqrt(dx*dx + dy*dy);
      
      let mag = 20;
      let vx = (dx / dist) * mag;
      let vy = (dy / dist) * mag;
      
      // Add slight offset for realism
      vx += (Math.random() - 0.5) * 4;
      vy += (Math.random() - 0.5) * 4;
      
      const finalPieces = getFinalOutcome(localPieces, myPiece.id, vx, vy);
      const nextPlayerId = aiTeam === 'BLACK' ? gameState.whitePlayerId : gameState.blackPlayerId;
      
      const finalBlack = Object.values(finalPieces).filter(p => p.team === 'BLACK' && p.isAlive).length;
      const finalWhite = Object.values(finalPieces).filter(p => p.team === 'WHITE' && p.isAlive).length;
      
      const updates: any = {};
      updates['alkkagiGame/action'] = {
        actionId: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        pieceId: myPiece.id,
        vx, vy,
        initialPieces: localPieces,
        finalPieces,
        nextPlayerId,
        timestamp: Date.now()
      };
      updates['alkkagiGame/currentPlayerId'] = nextPlayerId;
      updates['alkkagiGame/pieces'] = finalPieces;
      
      if (finalBlack === 0 && finalWhite === 0) {
        updates['status'] = 'SUMMARY';
        updates['alkkagiGame/status'] = 'FINISHED';
        updates['alkkagiGame/winnerId'] = 'DRAW';
      } else if (finalBlack === 0) {
        updates['status'] = 'SUMMARY';
        updates['alkkagiGame/status'] = 'FINISHED';
        updates['alkkagiGame/winnerId'] = gameState.whitePlayerId;
      } else if (finalWhite === 0) {
        updates['status'] = 'SUMMARY';
        updates['alkkagiGame/status'] = 'FINISHED';
        updates['alkkagiGame/winnerId'] = gameState.blackPlayerId;
      }
      
      await update(ref(db, `sessions/${session.id}`), updates);
      if (finalBlack === 0 || finalWhite === 0) {
        if (finalBlack === 0 && finalWhite === 0) return;
        const winner = finalBlack === 0 ? gameState.whitePlayerId : gameState.blackPlayerId;
        const winnerName = session.players[winner]?.nickname || 'AI';
        await sessionService.addLog(session.id, `알까기 대전이 종료되었습니다! 승자: ${winnerName}`, 'success');
        await sessionService.updateStats(session.id, winner);
      }
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [amIResponsibleForBot, isAnimating, gameState?.status, gameState?.currentPlayerId, localPieces]);

  // Input Handling
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isAnimating || !isMyTurn || dragState) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = BOARD_SIZE / rect.width;
    const scaleY = BOARD_SIZE / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // Find my clicked piece
    let clickedId: string | null = null;
    for (const [id, pieceValue] of Object.entries(localPieces)) {
      const piece = pieceValue as AlkkagiPieceState;
      if (!piece.isAlive || piece.team !== myTeam) continue;
      
      let dx = x - piece.x;
      let dy = y - piece.y;
      if (Math.sqrt(dx*dx + dy*dy) <= PIECE_RADIUS) {
        clickedId = id;
        break;
      }
    }
    
    if (clickedId) {
      setDragState({
        pieceId: clickedId,
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY
      });
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragState) return;
    setDragState(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);
  };

  const handlePointerUp = async (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragState) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    
    const canvas = canvasRef.current;
    if (!canvas) {
      setDragState(null);
      return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = BOARD_SIZE / rect.width;
    const scaleY = BOARD_SIZE / rect.height;
    
    const dx = (dragState.startX - dragState.currentX) * scaleX;
    const dy = (dragState.startY - dragState.currentY) * scaleY;
    
    const power = Math.sqrt(dx*dx + dy*dy);
    
    if (power > 10) {
      // Execute shot
      let vx = dx * 0.15; // tuning
      let vy = dy * 0.15;
      
      const speed = Math.sqrt(vx*vx + vy*vy);
      if (speed > MAX_SPEED) {
        vx = (vx / speed) * MAX_SPEED;
        vy = (vy / speed) * MAX_SPEED;
      }
      
      const finalPieces = getFinalOutcome(localPieces, dragState.pieceId, vx, vy);
      
      // Determine next turn
      const nextPlayerId = myTeam === 'BLACK' ? gameState.whitePlayerId : gameState.blackPlayerId;
      
      // Check win condition
      const finalBlack = Object.values(finalPieces).filter(p => p.team === 'BLACK' && p.isAlive).length;
      const finalWhite = Object.values(finalPieces).filter(p => p.team === 'WHITE' && p.isAlive).length;
      
      const updates: any = {};
      updates['alkkagiGame/action'] = {
        actionId: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        pieceId: dragState.pieceId,
        vx, vy,
        initialPieces: localPieces,
        finalPieces,
        nextPlayerId,
        timestamp: Date.now()
      };
      updates['alkkagiGame/currentPlayerId'] = nextPlayerId;
      updates['alkkagiGame/pieces'] = finalPieces;
      
      if (finalBlack === 0 && finalWhite === 0) {
        updates['status'] = 'SUMMARY';
        updates['alkkagiGame/status'] = 'FINISHED';
        updates['alkkagiGame/winnerId'] = 'DRAW';
      } else if (finalBlack === 0) {
        updates['status'] = 'SUMMARY';
        updates['alkkagiGame/status'] = 'FINISHED';
        updates['alkkagiGame/winnerId'] = gameState.whitePlayerId;
      } else if (finalWhite === 0) {
        updates['status'] = 'SUMMARY';
        updates['alkkagiGame/status'] = 'FINISHED';
        updates['alkkagiGame/winnerId'] = gameState.blackPlayerId;
      }
      
      await update(ref(db, `sessions/${session.id}`), updates);
      if (finalBlack === 0 || finalWhite === 0) {
        if (finalBlack === 0 && finalWhite === 0) return;
        const winner = finalBlack === 0 ? gameState.whitePlayerId : gameState.blackPlayerId;
        const winnerName = session.players[winner]?.nickname || 'AI';
        await sessionService.addLog(session.id, `알까기 대전이 종료되었습니다! 승자: ${winnerName}`, 'success');
        await sessionService.updateStats(session.id, winner);
      }
    }
    
    setDragState(null);
  };

  // Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let req: number;
    
    const render = () => {
      ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
      
      // Draw Board (Gomoku board style or Simple Arena)
      ctx.fillStyle = '#dbb374';
      ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);
      
      // Board Lines
      ctx.strokeStyle = '#c49a5b';
      ctx.lineWidth = 1;
      for (let i = 1; i < 15; i++) {
        const p = (BOARD_SIZE / 15) * i;
        ctx.beginPath();
        ctx.moveTo(p, 0);
        ctx.lineTo(p, BOARD_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, p);
        ctx.lineTo(BOARD_SIZE, p);
        ctx.stroke();
      }
      
      // Draw pieces
      Object.values(localPieces).forEach(pieceValue => {
        const piece = pieceValue as AlkkagiPieceState;
        if (!piece.isAlive) return;
        
        ctx.beginPath();
        ctx.arc(piece.x, piece.y, PIECE_RADIUS, 0, Math.PI * 2);
        
        if (piece.team === 'BLACK') {
          ctx.fillStyle = '#222';
          ctx.fill();
        } else {
          ctx.fillStyle = '#f8f8f8';
          ctx.fill();
        }
        
        ctx.lineWidth = 2;
        ctx.strokeStyle = piece.team === 'BLACK' ? '#000' : '#d1d1d1';
        ctx.stroke();
      });
      
      // Draw drag arrow
      if (dragState) {
        const piece = localPieces[dragState.pieceId];
        if (piece) {
          const rect = canvas.getBoundingClientRect();
          const scaleX = BOARD_SIZE / rect.width;
          const scaleY = BOARD_SIZE / rect.height;
          
          const dx = (dragState.startX - dragState.currentX) * scaleX;
          const dy = (dragState.startY - dragState.currentY) * scaleY;
          
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist > 10) {
             const angle = Math.atan2(dy, dx);
             const length = Math.min(dist, 200);
             
             ctx.save();
             ctx.translate(piece.x, piece.y);
             ctx.rotate(angle);
             
             ctx.beginPath();
             ctx.moveTo(PIECE_RADIUS + 5, 0);
             ctx.lineTo(PIECE_RADIUS + 5 + length, 0);
             ctx.strokeStyle = `rgba(239, 68, 68, ${Math.min(1, length / 200)})`; // red-500
             ctx.lineWidth = 8;
             ctx.lineCap = 'round';
             ctx.stroke();
             
             // Arrow head
             ctx.beginPath();
             ctx.moveTo(PIECE_RADIUS + 5 + length, 0);
             ctx.lineTo(PIECE_RADIUS + 5 + length - 15, -10);
             ctx.lineTo(PIECE_RADIUS + 5 + length - 15, 10);
             ctx.fillStyle = ctx.strokeStyle;
             ctx.fill();
             
             ctx.restore();
          }
        }
      }
      
      req = requestAnimationFrame(render);
    };
    
    req = requestAnimationFrame(render);
    return () => cancelAnimationFrame(req);
  }, [localPieces, dragState]);

  if (!gameState) {
    return (
      <div className="p-4 text-center">
        <p className="mb-2">알까기 게임 데이터를 불러옵니다...</p>
        <p className="text-xs text-gray-400 text-left whitespace-pre-wrap">DEBUG: session ID: {session?.id}, status: {session?.status}, hasAlkkagi: {!!session?.alkkagiGame ? 'yes' : 'no'}</p>
        {isHost && (
          <button 
            onClick={() => sessionService.resetSession(session.id, session.players)}
            className="mt-4 text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
          >
            오류 복구: 로비로 돌아가기
          </button>
        )}
        <pre className="text-xs text-left max-w-full overflow-auto mt-2 bg-gray-100 p-2 text-gray-800">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>
    );
  }

  const p1 = session.players[gameState.blackPlayerId];
  const p2 = session.players[gameState.whitePlayerId];

  return (
    <div className="flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded shadow-lg border border-[#d1d1d1] p-4">
        
        <div className="flex flex-col md:flex-row gap-4 mb-4 items-center justify-between">
            <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded font-bold text-sm ${gameState.currentPlayerId === p1?.id ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                    ⚫️ 흑: {p1?.nickname || 'AI'}
                </div>
                <div className={`px-4 py-2 rounded font-bold text-sm ${gameState.currentPlayerId === p2?.id ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                    ⚪️ 백: {p2?.nickname || 'AI'}
                </div>
            </div>
            
            <div className="text-sm font-bold text-slate-700">
                {gameState.status === 'FINISHED' ? (
                  <span className="text-red-600">게임 종료! 결과 탭을 확인하세요.</span>
                ) : isAnimating ? (
                  <span className="animate-pulse">진행 중...</span>
                ) : isMyTurn ? (
                  <span className="text-blue-600">당신의 차례입니다. 내 말을 드래그하세요.</span>
                ) : (
                  <span>상대방 차례</span>
                )}
            </div>
        </div>

        <div className="aspect-square w-full relative select-none touch-none">
          <canvas
            ref={canvasRef}
            width={BOARD_SIZE}
            height={BOARD_SIZE}
            className="w-full h-full rounded shadow-inner cursor-crosshair touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ touchAction: 'none' }}
          />
        </div>
        
        <div className="text-[10px] text-slate-400 text-center mt-4">
          오피스 알까기: 내 말을 뒤로 드래그하여 날려서 상대 말을 보드 밖으로 떨어뜨리세요!
        </div>
      </div>
    </div>
  );
}
