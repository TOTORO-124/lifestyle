import React, { useEffect, useRef, useState, useCallback } from 'react';
import Matter from 'matter-js';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RefreshCw, Play, ArrowLeft, Info, Star } from 'lucide-react';
import { SuikaGameState } from '../types';

interface SuikaGameProps {
  onGameOver: (score: number) => void;
  onBack: () => void;
  bestScore: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

const RANKS = [
  { label: '인턴', radius: 15, color: '#ff4d4d', score: 1, next: 1 }, // Cherry
  { label: '사원', radius: 22, color: '#ff8533', score: 3, next: 2 }, // Strawberry/Orange
  { label: '주임', radius: 30, color: '#9933ff', score: 6, next: 3 }, // Grape
  { label: '대리', radius: 38, color: '#ffcc00', score: 10, next: 4 }, // Dekopon
  { label: '과장', radius: 48, color: '#ff6600', score: 15, next: 5 }, // Persimmon
  { label: '차장', radius: 58, color: '#ff3300', score: 21, next: 6 }, // Apple
  { label: '부장', radius: 70, color: '#ffff66', score: 28, next: 7 }, // Pear
  { label: '이사', radius: 85, color: '#ff99cc', score: 36, next: 8 }, // Peach
  { label: '상무', radius: 100, color: '#ffff00', score: 45, next: 9 }, // Pineapple
  { label: '전무', radius: 120, color: '#99ff33', score: 55, next: 10 }, // Melon
  { label: '사장', radius: 145, color: '#006600', score: 66, next: -1 }, // Watermelon
];

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const TOP_LIMIT = 100;

export const SuikaGame: React.FC<SuikaGameProps> = ({ onGameOver, onBack, bestScore: initialBestScore }) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine>(Matter.Engine.create());
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const [score, setScore] = useState(0);
  const [displayScore, setDisplayScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('suika_best_score');
    return saved ? parseInt(saved) : initialBestScore;
  });
  const [isGameOver, setIsGameOver] = useState(false);
  const [nextFruitIndex, setNextFruitIndex] = useState(0);
  const [currentFruitIndex, setCurrentFruitIndex] = useState(0);
  const [isDropping, setIsDropping] = useState(false);
  const mousePosRef = useRef(CANVAS_WIDTH / 2);
  const previewRef = useRef<HTMLDivElement>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [combo, setCombo] = useState(0);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [showCombo, setShowCombo] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const scoreRef = useRef(0);
  const lastMergeTimeRef = useRef(0);
  const comboRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);

  const onGameOverRef = useRef(onGameOver);
  const onBackRef = useRef(onBack);

  useEffect(() => {
    onGameOverRef.current = onGameOver;
    onBackRef.current = onBack;
  }, [onGameOver, onBack]);

  // Animated score logic
  useEffect(() => {
    const timer = setInterval(() => {
      if (displayScore < score) {
        setDisplayScore(prev => Math.min(score, prev + Math.ceil((score - prev) / 5) + 1));
      } else if (displayScore > score) {
        setDisplayScore(score);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [score, displayScore]);

  const createParticles = (x: number, y: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: Math.random(),
        x,
        y,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        color,
        life: 1.0,
        size: Math.random() * 6 + 2
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 250);
  };

  const init = useCallback(() => {
    if (!sceneRef.current) return;

    // Reset state
    setScore(0);
    setDisplayScore(0);
    scoreRef.current = 0;
    comboRef.current = 0;
    setCombo(0);
    setIsGameOver(false);
    setIsDropping(false);
    setCurrentFruitIndex(Math.floor(Math.random() * 3));
    setNextFruitIndex(Math.floor(Math.random() * 3));
    particlesRef.current = [];

    // Clear world but keep engine
    Matter.World.clear(engineRef.current.world, false);
    Matter.Engine.clear(engineRef.current);
    engineRef.current.gravity.y = 1.2; // Slightly stronger gravity for better feel

    // Create render only if it doesn't exist
    if (!renderRef.current) {
      const render = Matter.Render.create({
        element: sceneRef.current,
        engine: engineRef.current,
        options: {
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          wireframes: false,
          background: 'transparent',
        },
      });
      
      if (render.canvas) {
        render.canvas.style.width = '100%';
        render.canvas.style.height = '100%';
        render.canvas.style.objectFit = 'contain';
      }
      
      renderRef.current = render;

      // Add labels and particles after render
      Matter.Events.on(render, 'afterRender', () => {
        const context = render.context;
        const bodies = Matter.Composite.allBodies(engineRef.current.world);

        // Draw particles
        for (let i = particlesRef.current.length - 1; i >= 0; i--) {
          const p = particlesRef.current[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.2; // gravity
          p.life -= 0.02;
          
          if (p.life <= 0) {
            particlesRef.current.splice(i, 1);
            continue;
          }

          context.globalAlpha = p.life;
          context.fillStyle = p.color;
          context.beginPath();
          context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          context.fill();
        }
        context.globalAlpha = 1.0;

        context.textAlign = 'center';
        context.textBaseline = 'middle';

        bodies.forEach(body => {
          if (body.label.startsWith('rank_')) {
            const level = parseInt(body.label.split('_')[1]);
            const rank = RANKS[level];
            
            context.save();
            context.translate(body.position.x, body.position.y);
            context.rotate(body.angle);

            // Draw label text
            context.fillStyle = level < 3 ? '#1e293b' : '#ffffff';
            const fontSize = Math.max(8, Math.min(18, body.circleRadius! / 2.5));
            context.font = `bold ${fontSize}px 'Noto Sans KR', sans-serif`;
            context.fillText(rank.label, 0, 0);

            context.restore();
          }
        });
      });

      Matter.Render.run(render);
    }

    // Create runner only if it doesn't exist
    if (!runnerRef.current) {
      const runner = Matter.Runner.create();
      runnerRef.current = runner;
      Matter.Runner.run(runner, engineRef.current);
    }

    // Create walls
    const ground = Matter.Bodies.rectangle(CANVAS_WIDTH / 2, CANVAS_HEIGHT + 25, CANVAS_WIDTH, 50, { 
      isStatic: true,
      render: { fillStyle: '#8b4513' },
      restitution: 0.5 // Bounce
    });
    const leftWall = Matter.Bodies.rectangle(-25, CANVAS_HEIGHT / 2, 50, CANVAS_HEIGHT, { 
      isStatic: true,
      render: { fillStyle: '#8b4513' }
    });
    const rightWall = Matter.Bodies.rectangle(CANVAS_WIDTH + 25, CANVAS_HEIGHT / 2, 50, CANVAS_HEIGHT, { 
      isStatic: true,
      render: { fillStyle: '#8b4513' }
    });

    Matter.Composite.add(engineRef.current.world, [ground, leftWall, rightWall]);

    // Collision event (clear old ones first)
    Matter.Events.off(engineRef.current, 'collisionStart');
    Matter.Events.on(engineRef.current, 'collisionStart', (event: Matter.IEventCollision<Matter.Engine>) => {
      event.pairs.forEach((pair) => {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;

        if (bodyA.label === bodyB.label && bodyA.label.startsWith('rank_')) {
          if ((bodyA as any).isMerged || (bodyB as any).isMerged) return;
          (bodyA as any).isMerged = true;
          (bodyB as any).isMerged = true;

          const level = parseInt(bodyA.label.split('_')[1]);
          if (level < RANKS.length - 1) {
            const nextLevel = level + 1;
            const newX = (bodyA.position.x + bodyB.position.x) / 2;
            const newY = (bodyA.position.y + bodyB.position.y) / 2;

            // Particles
            createParticles(newX, newY, RANKS[level].color);

            // Screen shake for big merges
            if (level >= 4) {
              triggerShake();
            }

            // Remove old fruits
            Matter.Composite.remove(engineRef.current.world, [bodyA, bodyB]);

            // Add new fruit
            const nextRank = RANKS[nextLevel];
            const newRank = Matter.Bodies.circle(newX, newY, nextRank.radius, {
              label: `rank_${nextLevel}`,
              render: { fillStyle: nextRank.color },
              restitution: 0.4,
              friction: 0.1,
            });
            
            Matter.Composite.add(engineRef.current.world, newRank);

            // Combo logic
            const now = Date.now();
            if (now - lastMergeTimeRef.current < 2000) {
              comboRef.current += 1;
            } else {
              comboRef.current = 1;
            }
            lastMergeTimeRef.current = now;
            setCombo(comboRef.current);
            if (comboRef.current > 1) {
              setShowCombo(true);
              setTimeout(() => setShowCombo(false), 1000);
              if (comboRef.current > 2) triggerShake();
            }

            // Update score
            const points = RANKS[level].score * 2 * comboRef.current;
            scoreRef.current += points;
            setScore(scoreRef.current);
            
            if (scoreRef.current > bestScore) {
              setBestScore(scoreRef.current);
              localStorage.setItem('suika_best_score', scoreRef.current.toString());
            }
          }
        }
      });
    });

    // Game Over Check Loop
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    const checkGameOver = setInterval(() => {
      const bodies = Matter.Composite.allBodies(engineRef.current.world);
      const ranks = bodies.filter(b => b.label.startsWith('rank_') && !b.isStatic);
      
      // Check if the top of the fruit is above the TOP_LIMIT
      const isOverLimit = ranks.some(f => (f.position.y - (f.circleRadius || 0)) < TOP_LIMIT && f.velocity.y < 0.1 && f.velocity.y > -0.1);
      
      if (isOverLimit) {
        // Wait a bit to confirm
        setTimeout(() => {
          const stillOverLimit = ranks.some(f => (f.position.y - (f.circleRadius || 0)) < TOP_LIMIT && f.velocity.y < 0.1 && f.velocity.y > -0.1);
          if (stillOverLimit) {
            setIsGameOver(true);
            clearInterval(checkGameOver);
            onGameOverRef.current(scoreRef.current);
          }
        }, 500);
      }
    }, 500);

    cleanupRef.current = () => {
      clearInterval(checkGameOver);
    };

    return cleanupRef.current;
  }, []);

  useEffect(() => {
    init();
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      // Full cleanup on unmount
      if (renderRef.current) {
        Matter.Render.stop(renderRef.current);
        if (renderRef.current.canvas) renderRef.current.canvas.remove();
        renderRef.current = null;
      }
      if (runnerRef.current) {
        Matter.Runner.stop(runnerRef.current);
        runnerRef.current = null;
      }
      if (engineRef.current) {
        Matter.World.clear(engineRef.current.world, false);
        Matter.Engine.clear(engineRef.current);
      }
    };
  }, [init]);

  const dropFruit = useCallback(() => {
    if (isDropping || isGameOver) return;

    setIsDropping(true);
    const rank = RANKS[currentFruitIndex];
    const newRank = Matter.Bodies.circle(mousePosRef.current, TOP_LIMIT - 50, rank.radius, {
      label: `rank_${currentFruitIndex}`,
      render: { fillStyle: rank.color },
      restitution: 0.4,
      friction: 0.1,
    });

    Matter.Composite.add(engineRef.current.world, newRank);

    setTimeout(() => {
      setCurrentFruitIndex(nextFruitIndex);
      setNextFruitIndex(Math.floor(Math.random() * 5)); // Only drop small ranks
      setIsDropping(false);
    }, 800);
  }, [currentFruitIndex, nextFruitIndex, isDropping, isGameOver]);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (isGameOver) return;
    const rect = sceneRef.current?.getBoundingClientRect();
    if (!rect) return;

    let clientX = 0;
    if ('clientX' in e) {
      clientX = e.clientX;
    } else if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
    } else {
      return;
    }

    // Convert screen X to canvas X
    const relativeX = clientX - rect.left;
    const scaleX = CANVAS_WIDTH / rect.width;
    let x = relativeX * scaleX;
    
    // Clamp x
    const radius = RANKS[currentFruitIndex].radius;
    x = Math.max(radius, Math.min(CANVAS_WIDTH - radius, x));
    
    mousePosRef.current = x;
    if (previewRef.current) {
      previewRef.current.style.left = `${(x / CANVAS_WIDTH) * 100}%`;
    }
  };

  return (
    <div className={`flex flex-col h-full w-full bg-[#fdf6e3] font-sans text-[#586e75] overflow-hidden safe-bottom ${isShaking ? 'animate-shake' : ''}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');
        .font-noto { font-family: 'Noto Sans KR', sans-serif; }
        .safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
      `}</style>

      {/* Header */}
      <div className="w-full flex justify-between items-center p-4 shrink-0 glass-panel z-30 border-b border-black/5">
        <button onClick={() => onBackRef.current()} className="p-2 hover:bg-black/5 rounded-full btn-interactive">
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-xl font-black tracking-tighter font-noto text-[#073642]">승진 게임</h1>
          <div className="flex gap-4 mt-0.5">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider opacity-60">
              <Trophy size={10} className="text-yellow-500" />
              <span>Best: {bestScore}</span>
            </div>
            <div className="text-[10px] font-black text-[#268bd2] uppercase tracking-wider">
              Score: {displayScore}
            </div>
          </div>
        </div>
        <button onClick={() => setShowInfo(true)} className="p-2 hover:bg-black/5 rounded-full btn-interactive">
          <Info size={24} />
        </button>
      </div>

      {/* Main Game Container */}
      <div className="flex-1 relative flex flex-col items-center justify-center p-2 overflow-hidden w-full">
        {/* Game Area Wrapper */}
        <div 
          className="relative border-8 border-[#8b4513] rounded-3xl overflow-hidden cursor-crosshair shadow-2xl glass-panel touch-none w-full max-w-[400px] aspect-[2/3] flex flex-col"
          onMouseMove={handleMouseMove}
          onTouchMove={handleMouseMove}
          onClick={dropFruit}
          onTouchEnd={(e) => {
            e.preventDefault();
            dropFruit();
          }}
        >
          {/* Top Limit Line */}
          <div 
            className="absolute w-full border-t-4 border-dashed border-red-400/30 z-10"
            style={{ top: TOP_LIMIT }}
          />

          {/* Combo Message */}
          <AnimatePresence>
            {showCombo && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 20 }}
                animate={{ scale: 1.2, opacity: 1, y: 0 }}
                exit={{ scale: 1.5, opacity: 0 }}
                className="absolute top-1/4 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
              >
                <div className="text-4xl font-black text-[#268bd2] drop-shadow-lg font-noto italic">
                  {combo} COMBO!
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Current Fruit Preview */}
          {!isGameOver && !isDropping && (
            <div 
              ref={previewRef}
              className="absolute pointer-events-none z-20 flex items-center justify-center font-bold shadow-lg"
              style={{ 
                left: `${(mousePosRef.current / CANVAS_WIDTH) * 100}%`,
                transform: 'translateX(-50%)',
                top: 20,
                width: (RANKS[currentFruitIndex].radius * 2 * 100) / CANVAS_WIDTH + '%',
                aspectRatio: '1/1',
                backgroundColor: RANKS[currentFruitIndex].color,
                borderRadius: '50%',
                fontSize: '10px',
                color: currentFruitIndex < 3 ? '#1e293b' : '#ffffff',
                border: '2px solid rgba(255,255,255,0.3)'
              }}
            >
              {RANKS[currentFruitIndex].label}
            </div>
          )}

          {/* Matter.js Canvas Container */}
          <div ref={sceneRef} className="flex-1 w-full h-full" />

          {/* Next Fruit Preview */}
          <div className="absolute top-4 right-4 glass-panel p-3 rounded-2xl border-2 border-[#8b4513]/20 flex flex-col items-center shadow-xl z-30">
            <span className="text-[9px] uppercase font-black tracking-widest opacity-40 mb-1 font-noto">Next</span>
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-[8px] font-black shadow-inner border border-black/5"
              style={{ 
                backgroundColor: RANKS[nextFruitIndex].color,
                color: nextFruitIndex < 3 ? '#1e293b' : '#ffffff'
              }}
            >
              {RANKS[nextFruitIndex].label}
            </div>
          </div>

          {/* Game Over Overlay */}
          <AnimatePresence>
            {isGameOver && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#002b36]/80 backdrop-blur-xl z-50 flex flex-col items-center justify-center text-white p-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0.5, y: 50, rotate: -5 }}
                  animate={{ scale: 1, y: 0, rotate: 0 }}
                  className="glass-panel p-10 rounded-[40px] shadow-2xl border border-white/20 w-full max-w-[320px]"
                >
                  <div className="mb-2">
                    <Star className="text-yellow-400 mx-auto animate-bounce drop-shadow-lg" size={48} fill="currentColor" />
                  </div>
                  <h2 className="text-3xl font-black mb-1 uppercase tracking-tighter font-noto text-gray-800">Game Over</h2>
                  <p className="text-xs text-gray-600 mb-6 font-medium">수고하셨습니다!</p>
                  
                  <div className="space-y-1 mb-8">
                    <div className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Final Score</div>
                    <div className="text-6xl font-black text-[#268bd2] drop-shadow-lg font-noto">{score}</div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={init}
                      className="flex items-center justify-center gap-2 w-full py-4 bg-[#268bd2] hover:bg-[#2aa198] text-white rounded-2xl font-black btn-interactive shadow-lg"
                    >
                      <RefreshCw size={20} />
                      다시 도전하기
                    </button>
                    <button 
                      onClick={() => onBackRef.current()}
                      className="w-full py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-2xl font-bold btn-interactive border border-black/10"
                    >
                      메뉴로 돌아가기
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Info Modal */}
      <AnimatePresence>
        {showInfo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowInfo(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-panel rounded-[32px] p-8 max-w-md w-full shadow-2xl font-noto"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-2xl font-black mb-6 flex items-center gap-2 text-[#073642]">
                <Info className="text-[#268bd2]" />
                게임 가이드
              </h3>
              <ul className="space-y-4 text-sm leading-relaxed text-[#586e75]">
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#268bd2]/10 text-[#268bd2] flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                  <p>화면을 터치하거나 클릭하여 사원을 배치하세요.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#268bd2]/10 text-[#268bd2] flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                  <p>같은 직급이 만나면 승진하며 점수가 올라갑니다.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#268bd2]/10 text-[#268bd2] flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                  <p>연속으로 승진하면 <span className="text-[#268bd2] font-bold">콤보 보너스</span>가 적용됩니다!</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#268bd2]/10 text-[#268bd2] flex items-center justify-center shrink-0 font-bold text-xs">4</div>
                  <p>최종 목표 '사장'을 달성하고 최고 기록을 세워보세요.</p>
                </li>
              </ul>
              <div className="mt-8 grid grid-cols-4 gap-3">
                {RANKS.map((f, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-[8px] font-black shadow-sm border border-black/5"
                      style={{ backgroundColor: f.color, color: i < 3 ? '#1e293b' : '#ffffff' }}
                    >
                      {f.label}
                    </div>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setShowInfo(false)}
                className="w-full mt-8 py-4 bg-[#073642] text-white rounded-2xl font-black hover:bg-[#586e75] btn-interactive shadow-lg"
              >
                확인 완료
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 text-center shrink-0">
        <div className="text-[9px] font-black uppercase tracking-[0.3em] opacity-20">
          Advanced Physics Engine • Matter.js
        </div>
      </div>
    </div>
  );
};
