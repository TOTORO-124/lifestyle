import React, { useEffect, useRef, useState } from 'react';
import { Session, FlappyBirdGameState, Player, SessionStatus } from '../types';
import { sessionService } from '../services/sessionService';

// --- Game Logic Encapsulation ---
class GameInstance {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  
  mode: 'SOLO' | 'AI' | 'PVP';
  difficulty: 'EASY' | 'NORMAL' | 'HARD' | 'DEVIL';
  seed: number;
  
  // Physics
  gravity = 0.38;
  jumpForce = -7.2;
  pipeSpeed = 2.5;
  pipeSpawnRate = 120; // frames
  
  // State
  frames = 0;
  score = 0;
  isGameOver = false;
  
  // Entities
  player: Bird;
  opponent: Bird | null = null;
  pipes: Pipe[] = [];
  particles: Particle[] = [];
  clouds: Cloud[] = [];
  groundX = 0;
  
  // Callbacks
  onScore: (score: number) => void;
  onGameOver: (score: number) => void;
  onSync: (y: number, score: number, isAlive: boolean) => void;
  
  lastSyncTime = 0;

  constructor(
    canvas: HTMLCanvasElement, 
    mode: 'SOLO' | 'AI' | 'PVP', 
    difficulty: 'EASY' | 'NORMAL' | 'HARD' | 'DEVIL' = 'NORMAL',
    seed: number,
    onScore: (score: number) => void,
    onGameOver: (score: number) => void,
    onSync: (y: number, score: number, isAlive: boolean) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.width = canvas.width;
    this.height = canvas.height;
    
    this.mode = mode;
    this.difficulty = difficulty;
    this.seed = seed;
    
    this.onScore = onScore;
    this.onGameOver = onGameOver;
    this.onSync = onSync;
    
    // Configure difficulty
    switch(difficulty) {
      case 'EASY': this.pipeSpeed = 2.2; break;
      case 'NORMAL': this.pipeSpeed = 2.6; break;
      case 'HARD': this.pipeSpeed = 3.0; break;
      case 'DEVIL': this.pipeSpeed = 3.4; break;
    }
    
    this.player = new Bird(this.height / 2, '#FACC15'); // Yellow
    if (this.mode !== 'SOLO') {
      this.opponent = new Bird(this.height / 2, '#EF4444'); // Red
    }
    
    // Init clouds
    for(let i=0; i<5; i++) {
      this.clouds.push(new Cloud(this.width, this.height));
    }
  }
  
  // Simple seeded random
  random() {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }

  jump() {
    if (this.isGameOver) return;
    this.player.velocity = this.jumpForce;
  }

  update() {
    if (this.isGameOver) {
      this.player.update(this.gravity, this.height);
      this.particles.forEach(p => p.update());
      return;
    }

    this.frames++;
    this.groundX = (this.groundX - this.pipeSpeed) % (this.width / 2);

    // Clouds
    this.clouds.forEach(c => c.update(this.width));

    // Player
    this.player.update(this.gravity, this.height);

    // AI Logic
    if (this.mode === 'AI' && this.opponent && this.opponent.isAlive) {
      this.updateAI();
    }

    // Pipes
    if (this.frames % this.pipeSpawnRate === 0) {
      const gap = this.difficulty === 'EASY' ? 160 : this.difficulty === 'NORMAL' ? 140 : this.difficulty === 'HARD' ? 120 : 100;
      const minPipeHeight = 50;
      const maxPos = this.height - 112 - minPipeHeight - gap; // 112 is ground height
      const yPos = Math.floor(this.random() * (maxPos - minPipeHeight + 1)) + minPipeHeight;
      this.pipes.push(new Pipe(this.width, yPos, gap));
    }

    this.pipes.forEach(pipe => {
      pipe.update(this.pipeSpeed);
      
      // Collision
      if (this.checkCollision(this.player, pipe)) {
        this.triggerGameOver();
      }
      
      // AI Collision
      if (this.mode === 'AI' && this.opponent && this.opponent.isAlive) {
        if (this.checkCollision(this.opponent, pipe)) {
          this.opponent.isAlive = false;
          this.createParticles(this.opponent.x, this.opponent.y, this.opponent.color);
        }
      }

      // Score
      if (pipe.x + pipe.width < this.player.x && !pipe.passed) {
        this.score++;
        pipe.passed = true;
        this.onScore(this.score);
      }
    });

    // Remove offscreen pipes
    if (this.pipes.length > 0 && this.pipes[0].x + this.pipes[0].width < 0) {
      this.pipes.shift();
    }

    // Ground collision
    if (this.player.y + this.player.radius >= this.height - 112) {
      this.triggerGameOver();
    }
    
    if (this.mode === 'AI' && this.opponent && this.opponent.isAlive) {
      if (this.opponent.y + this.opponent.radius >= this.height - 112) {
        this.opponent.isAlive = false;
        this.createParticles(this.opponent.x, this.opponent.y, this.opponent.color);
      }
    }

    // Particles
    this.particles.forEach(p => p.update());
    this.particles = this.particles.filter(p => p.life > 0);

    // Sync PVP
    const now = Date.now();
    if (now - this.lastSyncTime > 100) {
      this.onSync(this.player.y, this.score, !this.isGameOver);
      this.lastSyncTime = now;
    }
  }

  updateAI() {
    if (!this.opponent) return;
    
    // Find next pipe
    let targetPipe = this.pipes.find(p => p.x + p.width > this.opponent!.x);
    let targetY = this.height / 2;
    
    if (targetPipe) {
      targetY = targetPipe.y + targetPipe.gap / 2;
    }

    // Add noise based on difficulty
    let errorRate = 0.15;
    switch(this.difficulty) {
      case 'EASY': errorRate = 0.40; break;
      case 'NORMAL': errorRate = 0.15; break;
      case 'HARD': errorRate = 0.05; break;
      case 'DEVIL': errorRate = 0.01; break;
    }

    // If random < errorRate, AI makes a mistake (targets wrong Y)
    if (Math.random() < errorRate) {
      targetY += (Math.random() > 0.5 ? 100 : -100);
    }

    // Jump logic
    if (this.opponent.y > targetY && this.opponent.velocity >= 0) {
      this.opponent.velocity = this.jumpForce;
    }
    
    this.opponent.update(this.gravity, this.height);
  }

  checkCollision(bird: Bird, pipe: Pipe) {
    // Circle to AABB collision
    const cx = bird.x;
    const cy = bird.y;
    const r = bird.radius;
    
    // Top pipe
    if (cx + r > pipe.x && cx - r < pipe.x + pipe.width && cy - r < pipe.y) return true;
    // Bottom pipe
    if (cx + r > pipe.x && cx - r < pipe.x + pipe.width && cy + r > pipe.y + pipe.gap) return true;
    
    return false;
  }

  triggerGameOver() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.player.isAlive = false;
    this.createParticles(this.player.x, this.player.y, this.player.color);
    this.onGameOver(this.score);
    this.onSync(this.player.y, this.score, false);
  }

  createParticles(x: number, y: number, color: string) {
    for(let i=0; i<20; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  draw() {
    // Sky
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Clouds
    this.clouds.forEach(c => c.draw(this.ctx));

    // Pipes
    this.pipes.forEach(pipe => pipe.draw(this.ctx, this.height));

    // Ground
    this.ctx.fillStyle = '#DED895';
    this.ctx.fillRect(0, this.height - 112, this.width, 112);
    this.ctx.fillStyle = '#73BF2E';
    this.ctx.fillRect(0, this.height - 112, this.width, 12);
    
    // Ground pattern
    this.ctx.fillStyle = '#C4BA70';
    for(let i=0; i<this.width/20 + 2; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.groundX + i*40, this.height - 100);
      this.ctx.lineTo(this.groundX + i*40 + 20, this.height - 100);
      this.ctx.lineTo(this.groundX + i*40 + 10, this.height - 80);
      this.ctx.fill();
    }

    // Opponent (Ghost)
    if (this.opponent && this.opponent.isAlive) {
      this.ctx.globalAlpha = this.mode === 'PVP' ? 0.5 : 1.0;
      this.opponent.draw(this.ctx);
      this.ctx.globalAlpha = 1.0;
    }

    // Player
    if (this.player.isAlive || this.player.y < this.height - 112) {
      this.player.draw(this.ctx);
    }

    // Particles
    this.particles.forEach(p => p.draw(this.ctx));

    // Score
    if (!this.isGameOver) {
      this.ctx.fillStyle = 'white';
      this.ctx.strokeStyle = 'black';
      this.ctx.lineWidth = 4;
      this.ctx.font = '32px "Press Start 2P", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.strokeText(this.score.toString(), this.width / 2, 80);
      this.ctx.fillText(this.score.toString(), this.width / 2, 80);
    }
  }
}

class Bird {
  x = 80;
  y: number;
  velocity = 0;
  radius = 14;
  color: string;
  isAlive = true;

  constructor(y: number, color: string) {
    this.y = y;
    this.color = color;
  }

  update(gravity: number, height: number) {
    this.velocity += gravity;
    this.y += this.velocity;
    if (this.y + this.radius > height - 112) {
      this.y = height - 112 - this.radius;
      this.velocity = 0;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    // Rotate based on velocity
    const rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (this.velocity * 0.1)));
    ctx.rotate(rotation);

    // Body
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000';
    ctx.stroke();

    // Eye
    ctx.beginPath();
    ctx.arc(6, -4, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.stroke();
    
    // Pupil
    ctx.beginPath();
    ctx.arc(8, -4, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = 'black';
    ctx.fill();

    // Beak
    ctx.beginPath();
    ctx.moveTo(10, 2);
    ctx.lineTo(20, 6);
    ctx.lineTo(10, 10);
    ctx.fillStyle = '#F97316';
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}

class Pipe {
  x: number;
  y: number;
  width = 60;
  gap: number;
  passed = false;

  constructor(x: number, y: number, gap: number) {
    this.x = x;
    this.y = y;
    this.gap = gap;
  }

  update(speed: number) {
    this.x -= speed;
  }

  draw(ctx: CanvasRenderingContext2D, height: number) {
    ctx.fillStyle = '#73BF2E';
    ctx.strokeStyle = '#548C22';
    ctx.lineWidth = 4;

    // Top pipe
    ctx.fillRect(this.x, 0, this.width, this.y);
    ctx.strokeRect(this.x, 0, this.width, this.y);
    // Top cap
    ctx.fillRect(this.x - 4, this.y - 24, this.width + 8, 24);
    ctx.strokeRect(this.x - 4, this.y - 24, this.width + 8, 24);

    // Bottom pipe
    const bottomY = this.y + this.gap;
    const bottomHeight = height - 112 - bottomY;
    ctx.fillRect(this.x, bottomY, this.width, bottomHeight);
    ctx.strokeRect(this.x, bottomY, this.width, bottomHeight);
    // Bottom cap
    ctx.fillRect(this.x - 4, bottomY, this.width + 8, 24);
    ctx.strokeRect(this.x - 4, bottomY, this.width + 8, 24);
  }
}

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life = 1.0;
  color: string;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 10;
    this.vy = (Math.random() - 0.5) * 10;
    this.color = color;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 0.02;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, 6, 6);
    ctx.globalAlpha = 1.0;
  }
}

class Cloud {
  x: number;
  y: number;
  speed: number;
  scale: number;

  constructor(width: number, height: number) {
    this.x = Math.random() * width;
    this.y = Math.random() * (height / 2);
    this.speed = 0.2 + Math.random() * 0.5;
    this.scale = 0.5 + Math.random() * 1;
  }

  update(width: number) {
    this.x -= this.speed;
    if (this.x < -100) {
      this.x = width + 50;
      this.y = Math.random() * 200;
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 20 * this.scale, 0, Math.PI * 2);
    ctx.arc(this.x + 25 * this.scale, this.y - 10 * this.scale, 25 * this.scale, 0, Math.PI * 2);
    ctx.arc(this.x + 50 * this.scale, this.y, 20 * this.scale, 0, Math.PI * 2);
    ctx.fill();
  }
}

// --- React Component ---
interface FlappyBirdProps {
  session: Session;
  currentUser: any;
}

export default function FlappyBird({ session, currentUser }: FlappyBirdProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameInstance | null>(null);
  const requestRef = useRef<number>();
  
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState(3);
  
  const gameData = session.flappyBirdGame;
  const isHost = session.hostId === currentUser?.uid;
  
  useEffect(() => {
    // Import Google Font
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    if (!gameData || !canvasRef.current) return;
    
    if (gameData.status === 'PLAYING' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [gameData?.status, countdown]);

  useEffect(() => {
    if (!gameData || !canvasRef.current) return;

    if (countdown === 0 && !gameRef.current) {
      const canvas = canvasRef.current;
      
      const handleScore = (s: number) => setScore(s);
      const handleGameOver = (s: number) => {
        setGameOver(true);
        if (gameData.mode === 'SOLO' || gameData.mode === 'AI') {
          sessionService.recordLeaderboard(session.id, 'FLAPPY_BIRD', currentUser.uid, session.players[currentUser.uid]?.nickname || 'Player', s);
          if (isHost) {
            sessionService.endFlappyBirdGame(session.id);
          }
        }
      };
      const handleSync = (y: number, s: number, isAlive: boolean) => {
        if (gameData.mode === 'PVP') {
          sessionService.updateFlappyBirdPlayer(session.id, currentUser.uid, y, s, isAlive);
        }
      };

      gameRef.current = new GameInstance(
        canvas, 
        gameData.mode, 
        gameData.difficulty, 
        gameData.seed,
        handleScore,
        handleGameOver,
        handleSync
      );

      const loop = () => {
        if (gameRef.current) {
          gameRef.current.update();
          gameRef.current.draw();
        }
        requestRef.current = requestAnimationFrame(loop);
      };
      requestRef.current = requestAnimationFrame(loop);
    }

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [countdown]); // Only depend on countdown so it starts once when countdown hits 0

  // Sync opponent state in PVP
  useEffect(() => {
    if (gameData?.mode === 'PVP' && gameRef.current && gameRef.current.opponent) {
      const opponentId = Object.keys(gameData.players).find(id => id !== currentUser.uid);
      if (opponentId && gameData.players[opponentId]) {
        const oppData = gameData.players[opponentId];
        // Smooth interpolation could be added here, but direct set is fine for now
        gameRef.current.opponent.y = oppData.y;
        gameRef.current.opponent.isAlive = oppData.isAlive;
        
        // Check PVP win condition
        if (!oppData.isAlive && gameRef.current.player.isAlive && !gameRef.current.isGameOver) {
          // Opponent died, I win
          sessionService.endFlappyBirdGame(session.id, currentUser.uid);
        } else if (!gameRef.current.player.isAlive && !oppData.isAlive && isHost && gameData.status === 'PLAYING') {
          // Both dead, draw
          sessionService.endFlappyBirdGame(session.id, 'DRAW');
        }
      }
    }
  }, [gameData?.players]);

  const handleJump = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.preventDefault();
    if (gameRef.current && countdown === 0) {
      gameRef.current.jump();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleJump();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [countdown]);

  if (!gameData) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-slate-900 text-white select-none relative"
         style={{ fontFamily: '"Press Start 2P", monospace' }}>
      
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <div className="text-xs text-yellow-400">
          MODE: {gameData.mode} {gameData.difficulty && `[${gameData.difficulty}]`}
        </div>
        <div className="text-xl">SCORE: {score}</div>
      </div>

      {/* Game Canvas */}
      <div className="relative border-4 border-slate-700 rounded-lg overflow-hidden shadow-2xl"
           onMouseDown={handleJump}
           onTouchStart={handleJump}>
        <canvas 
          ref={canvasRef} 
          width={400} 
          height={600} 
          className="bg-sky-300 block max-w-full h-auto"
          style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }}
        />
        
        {/* Countdown Overlay */}
        {countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
            <span className="text-6xl text-white animate-pulse">{countdown}</span>
          </div>
        )}

        {/* Game Over Overlay */}
        {(gameOver || gameData.status === 'FINISHED') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-30 p-6 text-center">
            <h2 className="text-3xl text-red-500 mb-4">GAME OVER</h2>
            <div className="bg-slate-800 p-4 rounded border-2 border-slate-600 mb-6 w-full max-w-xs">
              <p className="text-sm text-slate-400 mb-2">SCORE</p>
              <p className="text-2xl text-yellow-400 mb-4">{score}</p>
              
              {gameData.mode === 'PVP' && gameData.winnerId && (
                <div className="mt-4 pt-4 border-t border-slate-700">
                  <p className="text-sm">
                    {gameData.winnerId === 'DRAW' ? '무승부!' : 
                     gameData.winnerId === currentUser.uid ? '승리했습니다!' : '패배했습니다...'}
                  </p>
                </div>
              )}
            </div>
            
            {isHost && (
              <button 
                onClick={() => sessionService.advanceStatus(session.id, SessionStatus.LOBBY)}
                className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded text-sm transition-colors"
              >
                로비로 돌아가기
              </button>
            )}
            {!isHost && (
              <p className="text-xs text-slate-400">방장이 게임을 종료할 때까지 대기...</p>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-4 text-xs text-slate-500 text-center">
        스페이스바 또는 화면을 터치하여 점프하세요
      </div>
    </div>
  );
}
