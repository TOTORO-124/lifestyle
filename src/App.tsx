import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Session, Player, SessionStatus, GameType, LiarMode, MafiaRole, MafiaPhase, GameLog, UserProfile, Department } from './types';
import { sessionService } from './services/sessionService';
import { isConfigured, auth } from './firebase';
import { soundManager } from './utils/sound';
import { Chat } from './components/Chat';
import { LIAR_TOPICS } from './data/topics';
import { BINGO_TOPICS } from './data/bingoTopics';
import { DRAW_TOPICS } from './data/drawTopics';
import { Canvas } from './components/Canvas';
import { OfficeLifeBoard } from './components/OfficeLifeBoard';
import { UserProfileCard } from './components/UserProfileCard';
import { HiddenObjectPuzzle } from './components/HiddenObjectPuzzle';
import { SlidePuzzle } from './components/SlidePuzzle';
import { CubePuzzle } from './components/CubePuzzle';
import EscapeRoomUI from './components/EscapeRoomUI';
import Leaderboard from './components/Leaderboard';
import { ESCAPE_ROOM_THEMES } from './data/escapeRoomData';
import { ARENA_SKILLS, ARENA_ITEMS, ARENA_CHARACTERS, SYNERGIES } from './data/cyberArenaData';
import { Users, Shield, User, Play, LogOut, CheckCircle2, Circle, Settings2, AlertTriangle, FileText, Share2, HelpCircle, MoreVertical, Search, Filter, Grid, Download, Moon, Sun, Stethoscope, Siren, RefreshCw, ListOrdered, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Hash, Edit3, Check, Palette, Timer, Trophy, Eye, EyeOff, MessageSquare, Send, Bomb, LayoutGrid, Briefcase, Loader2, Coffee, StickyNote, Zap, Skull, ShieldCheck, Activity, Key, DoorOpen, Sword, ZapOff, Heart, ShieldAlert, Cpu, Coins, Package, Target, ShoppingBag, ChevronRight, Star, Info, Trash2, Sparkles } from 'lucide-react';

const LogTicker = ({ logs }: { logs: GameLog[] }) => {
  const latestLogs = [...Object.values(logs || {})].sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);
  
  return (
    <div className="fixed bottom-4 right-4 w-[calc(100%-2rem)] md:w-72 bg-white/90 backdrop-blur border border-gray-200 rounded-lg shadow-xl overflow-hidden z-40 pointer-events-none">
      <div className="bg-gray-100 px-3 py-1 border-b border-gray-200 flex justify-between items-center">
        <span className="text-[9px] md:text-[10px] font-bold text-gray-500 flex items-center gap-1">
          <Activity size={10} /> 실시간 시스템 로그
        </span>
      </div>
      <div className="p-1.5 md:p-2 space-y-1">
        {latestLogs.slice(0, window.innerWidth < 768 ? 1 : 3).map((log, idx) => (
          <motion.div 
            key={`${log.id}-${idx}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[9px] md:text-[10px] flex gap-2 items-start"
          >
            <span className={`mt-1 w-1 h-1 md:w-1.5 md:h-1.5 rounded-full shrink-0 ${
              log.type === 'success' ? 'bg-green-500' :
              log.type === 'warning' ? 'bg-yellow-500' :
              'bg-blue-500'
            }`} />
            <span className="text-gray-700 line-clamp-1 md:line-clamp-2">{log.content}</span>
          </motion.div>
        ))}
        {latestLogs.length === 0 && (
          <p className="text-[9px] text-gray-400 italic text-center py-1">대기 중...</p>
        )}
      </div>
    </div>
  );
};

// [타이머 및 루프 중앙 관리용 Ref 인터페이스]
interface ArenaTimers {
  phaseTimer: any;
  animationId: any;
  minionInterval: any;
  battleInterval: any;
  enemyBattleInterval: any;
  countdownInterval: any;
}

const ArenaRebuild = () => {
  // [Ref 선언] 타이머 및 루프 중앙 관리
  const timers = useRef<ArenaTimers>({
    phaseTimer: null,
    animationId: null,
    minionInterval: null,
    battleInterval: null,
    enemyBattleInterval: null,
    countdownInterval: null
  });
  // [데이터 구조화] 캐릭터 데이터
  const characters = [
    { id: 'milk', name: '우유(밸런스)', maxHp: 150, currentHp: 150, attackPower: 15, attackSpeed: 1.0, defense: 15, speed: 3, evasion: 5, passiveName: '단단한 유막', color: '#3b82f6' },
    { id: 'soda', name: '탄산(공격)', maxHp: 100, currentHp: 100, attackPower: 25, attackSpeed: 1.8, defense: 5, speed: 3.5, evasion: 5, passiveName: '톡 쏘는 기포', color: '#ef4444' },
    { id: 'coffee', name: '커피(회피)', maxHp: 110, currentHp: 110, attackPower: 18, attackSpeed: 1.4, defense: 10, speed: 4, evasion: 25, passiveName: '카페인 각성', color: '#78350f' },
    { id: 'ion', name: '이온(탱커)', maxHp: 220, currentHp: 220, attackPower: 12, attackSpeed: 1.1, defense: 25, speed: 2.5, evasion: 0, passiveName: '수분 흡수', color: '#10b981' },
    { id: 'vitamin', name: '비타민(신속)', maxHp: 105, currentHp: 105, attackPower: 20, attackSpeed: 1.6, defense: 8, speed: 4.5, evasion: 15, passiveName: '피로 회복', color: '#fbbf24' },
  ];

  // [데이터 구조화] 50가지 아이템 데이터 생성
  const tags = ['얼음', '설탕', '카페인', '탄산', '과일', '단백질', '강철'];
  const itemNames = [
    '녹슨 검', '가죽 갑옷', '속도의 장화', '생명력의 반지', '날카로운 단검',
    '강철 방패', '마법사의 지팡이', '민첩의 망토', '힘의 벨트', '수호의 펜던트',
    '화염의 검', '얼음의 방패', '번개의 장화', '독이 든 단검', '성스러운 갑옷',
    '암흑의 망토', '빛의 지팡이', '대지의 망토', '바람의 장화', '바다의 반지',
    '드래곤 슬레이어', '티타늄 방패', '광속의 신발', '불사조의 깃털', '거인의 장갑',
    '요정의 가루', '고대인의 유산', '미스릴 갑옷', '사신의 낫', '천사의 날개',
    '발뭉', '이지스', '헤르메스의 신발', '성배', '묠니르',
    '궁니르', '엑스칼리버', '무라마사', '마사무네', '간장',
    '막야', '청룡언월도', '장팔사모', '방천화극', '의천검',
    '청강검', '칠성검', '유성추', '곤봉', '목검'
  ];

  const items = itemNames.map((name, i) => {
    const tag1 = tags[i % tags.length];
    const tag2 = i % 5 === 0 ? tags[(i + 3) % tags.length] : null;
    const price = 5 + (i % 8) * 5 + Math.floor(i / 10) * 5;
    
    // 스탯 다양화
    const statType = i % 4;
    return {
      id: `item_${i}`,
      name,
      price,
      statBoost: {
        attackPower: statType === 0 ? 5 + Math.floor(i / 5) : 0,
        attackSpeed: statType === 1 ? 0.1 + (i % 5) * 0.05 : 0,
        defense: statType === 2 ? 3 + Math.floor(i / 6) : 0,
        maxHp: statType === 3 ? 20 + (i % 10) * 5 : 0,
      },
      tags: tag2 ? [tag1, tag2] : [tag1]
    };
  });

  // [게임 상태 변수]
  const [currentRound, setCurrentRound] = useState(1);
  const [playerGold, setPlayerGold] = useState(20);
  const [playerInventory, setPlayerInventory] = useState<any[]>([]);
  const [enemyInventory, setEnemyInventory] = useState<any[]>([]);
  const [baseStats, setBaseStats] = useState<any>(null);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [enemyStats, setEnemyStats] = useState<any>(null);

  // [Ref 선언] 최신 스탯 참조용 (클로저 문제 해결)
  const playerStatsRef = useRef<any>(null);
  const enemyStatsRef = useRef<any>(null);

  useEffect(() => {
    playerStatsRef.current = playerStats;
  }, [playerStats]);

  useEffect(() => {
    enemyStatsRef.current = enemyStats;
  }, [enemyStats]);
  const [playerWins, setPlayerWins] = useState(0);
  const [enemyWins, setEnemyWins] = useState(0);
  const playerWinsRef = useRef(0);
  const enemyWinsRef = useRef(0);

  useEffect(() => {
    playerWinsRef.current = playerWins;
  }, [playerWins]);

  useEffect(() => {
    enemyWinsRef.current = enemyWins;
  }, [enemyWins]);

  const [finalWinner, setFinalWinner] = useState<string | null>(null);
  const [enemyGrowthMessage, setEnemyGrowthMessage] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<'SELECT' | 'FARMING' | 'SHOP' | 'BATTLE'>('SELECT');
  const [timeLeft, setTimeLeft] = useState(0);
  const [evasionLog, setEvasionLog] = useState<{ x: number, y: number, text: string } | null>(null);
  
  // [전투 관련 상태]
  const [isBattleActive, setIsBattleActive] = useState(false);
  const [battleWinner, setBattleWinner] = useState<string | null>(null);
  const [activeSynergies, setActiveSynergies] = useState<string[]>([]);
  const isRoundOver = useRef(false);
  
  // [Canvas 게임 관련 상태]
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerPos, setPlayerPos] = useState({ x: 250, y: 200 });
  const playerPosRef = useRef({ x: 250, y: 200 });
  const [minions, setMinions] = useState<any[]>([]);
  const minionsRef = useRef<any[]>([]);
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // [초기 렌더링 함수]
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  const clearAllTimers = () => {
    if (timers.current.phaseTimer) clearTimeout(timers.current.phaseTimer);
    if (timers.current.minionInterval) clearInterval(timers.current.minionInterval);
    if (timers.current.battleInterval) clearInterval(timers.current.battleInterval);
    if (timers.current.enemyBattleInterval) clearInterval(timers.current.enemyBattleInterval);
    if (timers.current.countdownInterval) clearInterval(timers.current.countdownInterval);
    if (timers.current.animationId) cancelAnimationFrame(timers.current.animationId);
    
    timers.current = {
      phaseTimer: null,
      animationId: null,
      minionInterval: null,
      battleInterval: null,
      enemyBattleInterval: null,
      countdownInterval: null
    };

    if (playerAttackTimer.current) clearInterval(playerAttackTimer.current);
    if (enemyAttackTimer.current) clearInterval(enemyAttackTimer.current);
    playerAttackTimer.current = null;
    enemyAttackTimer.current = null;
    setIsBattleActive(false);
  };

  const startPhase = (phase: 'SELECT' | 'FARMING' | 'SHOP' | 'BATTLE') => {
    // 1. 모든 타이머 및 루프 강제 초기화
    clearAllTimers();
    setCurrentPhase(phase);
    resetInput();

    if (phase === 'FARMING') {
      setTimeLeft(20);
      spawnMinions(8);
      
      // 미니언 생성 루프
      timers.current.minionInterval = setInterval(() => {
        const types = [
          { type: 'small', size: 10, gold: 2, hp: 1, speed: 1.2, color: '#fbbf24' },
          { type: 'medium', size: 18, gold: 5, hp: 3, speed: 0.8, color: '#f59e0b' },
          { type: 'large', size: 30, gold: 10, hp: 8, speed: 0.5, color: '#d97706' },
        ];
        const t = types[Math.floor(Math.random() * types.length)];
        const newMinion = {
          id: Math.random(),
          x: Math.random() * 460 + 20,
          y: Math.random() * 360 + 20,
          ...t,
          currentHp: t.hp
        };
        
        if (minionsRef.current.length < 15) {
          const updatedMinions = [...minionsRef.current, newMinion];
          minionsRef.current = updatedMinions;
          setMinions(updatedMinions);
        }
      }, 2000);

      // 애니메이션 루프
      timers.current.animationId = requestAnimationFrame(update);
      
      // 페이즈 전환 예약
      timers.current.phaseTimer = setTimeout(() => startPhase('SHOP'), 20000);
      
      // UI 카운트다운
      timers.current.countdownInterval = setInterval(() => {
        setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
      }, 1000);
    } 
    else if (phase === 'SHOP') {
      setTimeLeft(10);
      // 상점 페이즈 전환 예약
      timers.current.phaseTimer = setTimeout(() => startPhase('BATTLE'), 10000);
      
      // UI 카운트다운
      timers.current.countdownInterval = setInterval(() => {
        setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
      }, 1000);
    } 
    else if (phase === 'BATTLE') {
      setTimeLeft(0);
      // 약간의 지연 후 전투 시작 (UI 전환 보장)
      setTimeout(() => {
        startBattle();
      }, 500);
    }
  };

  const selectCharacter = (charId: string) => {
    const p = characters.find(c => c.id === charId);
    const randomEnemyChar = characters[Math.floor(Math.random() * characters.length)];
    if (p) {
      setBaseStats({ ...p });
      setPlayerStats({ ...p });
      setEnemyStats({ ...randomEnemyChar });
      startPhase('FARMING');
    }
  };

  const spawnMinions = (count: number) => {
    const types = [
      { type: 'small', size: 10, gold: 2, hp: 1, speed: 1.5, color: '#fbbf24' },
      { type: 'medium', size: 18, gold: 5, hp: 3, speed: 1.0, color: '#f59e0b' },
      { type: 'large', size: 30, gold: 10, hp: 8, speed: 0.6, color: '#d97706' },
    ];
    const newMinions = Array.from({ length: count }).map(() => {
      const t = types[Math.floor(Math.random() * types.length)];
      return {
        id: Math.random(),
        x: Math.random() * 460 + 20,
        y: Math.random() * 360 + 20,
        ...t,
        currentHp: t.hp
      };
    });
    const updatedMinions = [...minionsRef.current, ...newMinions];
    minionsRef.current = updatedMinions;
    setMinions(updatedMinions);
  };

  // [키보드 이벤트 리스너]
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // [게임 루프]
  const update = () => {
    // FARMING 페이즈가 아니거나 스탯이 없으면 루프 중단
    if (currentPhase !== 'FARMING' || !playerStats) {
      if (timers.current.animationId) cancelAnimationFrame(timers.current.animationId);
      return;
    }

    // 플레이어 이동 계산
    const speed = playerStats?.speed || 3;
    let nextX = playerPosRef.current.x;
    let nextY = playerPosRef.current.y;

    if (keysPressed.current['w'] || keysPressed.current['arrowup']) nextY -= speed;
    if (keysPressed.current['s'] || keysPressed.current['arrowdown']) nextY += speed;
    if (keysPressed.current['a'] || keysPressed.current['arrowleft']) nextX -= speed;
    if (keysPressed.current['d'] || keysPressed.current['arrowright']) nextX += speed;

    nextX = Math.max(15, Math.min(485, nextX));
    nextY = Math.max(15, Math.min(385, nextY));

    playerPosRef.current = { x: nextX, y: nextY };
    setPlayerPos({ x: nextX, y: nextY });

    // 미니언 AI 및 충돌 판정
    const nextMinions = minionsRef.current.map(m => {
      // 추적 AI: 부드러운 소수점 이동
      const dx = playerPosRef.current.x - m.x;
      const dy = playerPosRef.current.y - m.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > 1) {
        m.x += (dx / dist) * m.speed;
        m.y += (dy / dist) * m.speed;
      }
      return m;
    });

    const remainingMinions = nextMinions.filter(m => {
      const dist = Math.sqrt(Math.pow(m.x - playerPosRef.current.x, 2) + Math.pow(m.y - playerPosRef.current.y, 2));
      if (dist < 20) {
        // 플레이어 피격 (하드코어)
        setPlayerStats((prev: any) => ({
          ...prev,
          currentHp: Math.max(0, prev.currentHp - (m.type === 'large' ? 2 : 1))
        }));
        setPlayerGold(gold => gold + m.gold);
        return false;
      }
      return true;
    });

    minionsRef.current = remainingMinions;
    setMinions(remainingMinions);

    draw();
    timers.current.animationId = requestAnimationFrame(update);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 클리어 (매 프레임 한 번)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
    for (let i = 0; i < canvas.height; i += 40) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

    minionsRef.current.forEach(m => {
      ctx.fillStyle = m.color;
      ctx.fillRect(m.x - m.size / 2, m.y - m.size / 2, m.size, m.size);
    });

    ctx.fillStyle = playerStats.color || '#3b82f6';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.fillRect(playerPosRef.current.x - 15, playerPosRef.current.y - 15, 30, 30);
    ctx.strokeRect(playerPosRef.current.x - 15, playerPosRef.current.y - 15, 30, 30);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(playerStats.name, playerPosRef.current.x, playerPosRef.current.y - 20);
  };

  useEffect(() => {
    if (currentPhase === 'FARMING') {
      timers.current.animationId = requestAnimationFrame(update);
    }
    return () => {
      if (timers.current.animationId) cancelAnimationFrame(timers.current.animationId);
    };
  }, [currentPhase]);

  // [승리 조건 체크]
  const checkWinCondition = (pWins: number, eWins: number) => {
    if (pWins >= 3) {
      setFinalWinner(playerStats?.name || 'PLAYER');
      stopAllTimers();
      return true;
    } else if (eWins >= 3) {
      setFinalWinner(enemyStats?.name || 'ENEMY');
      stopAllTimers();
      return true;
    }
    return false;
  };

  useEffect(() => {
    checkWinCondition(playerWins, enemyWins);
  }, [playerWins, enemyWins]);

  // [가상 방향키 제어 함수]
  const handleDpad = (key: string, isPressed: boolean) => {
    keysPressed.current[key] = isPressed;
  };

  // [입력 초기화 함수]
  const resetInput = () => {
    keysPressed.current = {};
  };

  const playerAttackTimer = useRef<any>(null);
  const enemyAttackTimer = useRef<any>(null);

  const stopAllTimers = () => {
    if (timers.current.battleInterval) clearInterval(timers.current.battleInterval);
    if (timers.current.enemyBattleInterval) clearInterval(timers.current.enemyBattleInterval);
    if (playerAttackTimer.current) clearInterval(playerAttackTimer.current);
    if (enemyAttackTimer.current) clearInterval(enemyAttackTimer.current);
    playerAttackTimer.current = null;
    enemyAttackTimer.current = null;
    setIsBattleActive(false);
  };

  // [전투 로직] startBattle
  const startBattle = () => {
    if (!playerStats || !enemyStats) {
      console.warn("Battle started without stats!", { playerStats, enemyStats });
      return;
    }
    
    // 이미 전투 중이거나 승패가 결정된 경우 중복 실행 방지
    if (isBattleActive || battleWinner || finalWinner) {
      console.log("Battle already active or finished, skipping startBattle.");
      return;
    }

    console.log("Starting Battle Loop...");
    setIsBattleActive(true);
    isRoundOver.current = false;

    const getDamageLocal = (attacker: any, defender: any, isAttackerPlayer: boolean) => {
      // 스탯 안전장치 (undefined 방지)
      const atkPower = Number(attacker?.attackPower) || 0;
      const defPower = Number(defender?.defense) || 0;
      const evasion = Number(defender?.evasion) || 0;

      // 회피 로직
      if (Math.random() * 100 < evasion) {
        setEvasionLog({ x: isAttackerPlayer ? 300 : 100, y: 150, text: 'EVADED!' });
        setTimeout(() => setEvasionLog(null), 500);
        return { damage: 0, isEvaded: true };
      }
      
      // 시너지 효과 반영 (statsUpdate에서 합산된 값들)
      const atkMult = Number(attacker?.atkMult) || 1;
      const effectiveAtk = atkPower * atkMult;
      
      const armorPen = Number(attacker?.armorPen) || 0;
      const bonusDef = Number(defender?.bonusDef) || 0;
      const effectiveDefense = Math.max(0, (defPower + bonusDef) - armorPen);
      
      const damage = Math.max(1, Math.floor(effectiveAtk - effectiveDefense));
      return { damage, isEvaded: false };
    };

    // 설탕 시너지 (재생)
    const regenInterval = setInterval(() => {
      if (isRoundOver.current) {
        clearInterval(regenInterval);
        return;
      }
      setPlayerStats((p: any) => {
        if (p?.regen) return { ...p, currentHp: Math.min(p.maxHp, p.currentHp + p.regen) };
        return p;
      });
      setEnemyStats((e: any) => {
        if (e?.regen) return { ...e, currentHp: Math.min(e.maxHp, e.currentHp + e.regen) };
        return e;
      });
    }, 1000);

    const pAtkSpeed = Math.max(0.1, playerStatsRef.current?.attackSpeed || 1);
    const pAtkSpeedMult = Math.max(0.1, playerStatsRef.current?.attackSpeedMult || 1);
    const pInterval = (1 / (pAtkSpeed * pAtkSpeedMult)) * 1000;

    console.log(`Player Attack Interval: ${pInterval}ms`);

    timers.current.battleInterval = setInterval(() => {
      setEnemyStats((prevE: any) => {
        const currentPlayerStats = playerStatsRef.current;
        if (!prevE || prevE.currentHp <= 0 || isRoundOver.current || !currentPlayerStats) return prevE;
        
        const { damage, isEvaded } = getDamageLocal(currentPlayerStats, prevE, true);
        if (isEvaded) return prevE;

        const nextHp = Math.max(0, prevE.currentHp - damage);
        console.log(`Player deals ${damage} damage. Enemy HP: ${nextHp}`);
        
        // 흡혈 시너지
        if (currentPlayerStats?.lifesteal && damage > 0) {
          setPlayerStats((p: any) => ({ ...p, currentHp: Math.min(p.maxHp, p.currentHp + damage * currentPlayerStats.lifesteal) }));
        }

        if (nextHp <= 0) {
          isRoundOver.current = true;
          console.log("Enemy Defeated!");
          stopAllTimers();
          clearInterval(regenInterval);
          setBattleWinner(currentPlayerStats?.name || 'PLAYER');
          
          const newWins = playerWinsRef.current + 1;
          setPlayerWins(newWins);
          
          const isFinal = checkWinCondition(newWins, enemyWinsRef.current);
          if (!isFinal) {
            setTimeout(() => nextRound(), 3000);
          }
        }
        return { ...prevE, currentHp: nextHp };
      });
    }, pInterval); 

    const eAtkSpeed = Math.max(0.1, enemyStatsRef.current?.attackSpeed || 1);
    const eAtkSpeedMult = Math.max(0.1, enemyStatsRef.current?.attackSpeedMult || 1);
    const eInterval = (1 / (eAtkSpeed * eAtkSpeedMult)) * 1000;

    console.log(`Enemy Attack Interval: ${eInterval}ms`);

    timers.current.enemyBattleInterval = setInterval(() => {
      setPlayerStats((prevP: any) => {
        const currentEnemyStats = enemyStatsRef.current;
        if (!prevP || prevP.currentHp <= 0 || isRoundOver.current || !currentEnemyStats) return prevP;
        
        const { damage, isEvaded } = getDamageLocal(currentEnemyStats, prevP, false);
        if (isEvaded) return prevP;

        const nextHp = Math.max(0, prevP.currentHp - damage);
        console.log(`Enemy deals ${damage} damage. Player HP: ${nextHp}`);
        
        if (nextHp <= 0) {
          isRoundOver.current = true;
          console.log("Player Defeated!");
          stopAllTimers();
          clearInterval(regenInterval);
          setBattleWinner(currentEnemyStats?.name || 'ENEMY');
          
          const newWins = enemyWinsRef.current + 1;
          setEnemyWins(newWins);
          
          const isFinal = checkWinCondition(playerWinsRef.current, newWins);
          if (!isFinal) {
            setTimeout(() => nextRound(), 3000);
          }
        }
        return { ...prevP, currentHp: nextHp };
      });
    }, eInterval);
  };

  // [시너지 체크 함수]
  const getSynergyEffects = (inventory: any[]) => {
    const tagCounts: { [key: string]: number } = {};
    inventory.forEach(item => {
      item.tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const synergies: string[] = [];
    const statsUpdate: any = {
      attackSpeedMult: 1,
      armorPen: 0,
      atkMult: 1,
      lifesteal: 0,
      bonusDef: 0,
      regen: 0
    };

    if (tagCounts['얼음'] >= 6) synergies.push('빙결(6)');
    else if (tagCounts['얼음'] >= 4) synergies.push('빙결(4)');
    else if (tagCounts['얼음'] >= 2) synergies.push('빙결(2)');

    if (tagCounts['설탕'] >= 6) statsUpdate.regen = 10;
    else if (tagCounts['설탕'] >= 4) statsUpdate.regen = 5;
    else if (tagCounts['설탕'] >= 2) statsUpdate.regen = 2;

    if (tagCounts['카페인'] >= 6) statsUpdate.attackSpeedMult = 1.8;
    else if (tagCounts['카페인'] >= 4) statsUpdate.attackSpeedMult = 1.45;
    else if (tagCounts['카페인'] >= 2) statsUpdate.attackSpeedMult = 1.2;

    if (tagCounts['탄산'] >= 6) statsUpdate.armorPen = 50;
    else if (tagCounts['탄산'] >= 4) statsUpdate.armorPen = 25;
    else if (tagCounts['탄산'] >= 2) statsUpdate.armorPen = 10;

    if (tagCounts['과일'] >= 6) statsUpdate.atkMult = 1.6;
    else if (tagCounts['과일'] >= 4) statsUpdate.atkMult = 1.35;
    else if (tagCounts['과일'] >= 2) statsUpdate.atkMult = 1.15;

    if (tagCounts['단백질'] >= 6) statsUpdate.lifesteal = 0.4;
    else if (tagCounts['단백질'] >= 4) statsUpdate.lifesteal = 0.2;
    else if (tagCounts['단백질'] >= 2) statsUpdate.lifesteal = 0.1;

    if (tagCounts['강철'] >= 6) statsUpdate.bonusDef = 70;
    else if (tagCounts['강철'] >= 4) statsUpdate.bonusDef = 30;
    else if (tagCounts['강철'] >= 2) statsUpdate.bonusDef = 10;

    return { synergies, statsUpdate };
  };

  // [스탯 통합 정산 함수]
  const updatePlayerStats = (inventory: any[]) => {
    if (!baseStats) return;
    
    // 1. 기본 스탯으로 리셋
    let next = { ...baseStats };
    
    // 2. 아이템 스탯 합산
    inventory.forEach(item => {
      if (item.statBoost.attackPower) next.attackPower += item.statBoost.attackPower;
      if (item.statBoost.attackSpeed) next.attackSpeed += item.statBoost.attackSpeed;
      if (item.statBoost.defense) next.defense += item.statBoost.defense;
      if (item.statBoost.maxHp) next.maxHp += item.statBoost.maxHp;
    });

    // 3. 시너지 체크 및 합산
    const { synergies, statsUpdate } = getSynergyEffects(inventory);
    next = { ...next, ...statsUpdate };
    
    // 4. 상태 업데이트
    setActiveSynergies(synergies);
    setPlayerStats(next);
  };

  // [아이템 구매 함수]
  const buyItem = (item: any) => {
    if (playerInventory.length >= 6) return;
    if (playerGold < item.price) return;

    const newInventory = [...playerInventory, item];
    setPlayerGold(prev => prev - item.price);
    setPlayerInventory(newInventory);

    // 통합 정산 함수 호출
    updatePlayerStats(newInventory);
  };

  // [다음 라운드 진행]
  const nextRound = () => {
    if (finalWinner || !playerStats || !enemyStats) return; 

    clearAllTimers();
    isRoundOver.current = false;
    
    const isPlayerWinner = battleWinner === playerStats?.name;
    const reward = isPlayerWinner ? 10 : 15;
    setPlayerGold(prev => prev + reward);

    setCurrentRound(prev => prev + 1);
    setBattleWinner(null);
    
    // 체력 회복
    setPlayerStats((prev: any) => ({
      ...prev,
      currentHp: prev.maxHp
    }));

    // 적군 강화 로직
    const randomItemCount = Math.floor(Math.random() * 2) + 1;
    const selectedItems: any[] = [];
    
    setEnemyStats((prev: any) => {
      const next = { ...prev, currentHp: prev.maxHp };
      for (let i = 0; i < randomItemCount; i++) {
        const randomIndex = Math.floor(Math.random() * items.length);
        const item = items[randomIndex];
        selectedItems.push(item);
        if (item.statBoost.attackPower) next.attackPower += item.statBoost.attackPower;
        if (item.statBoost.attackSpeed) next.attackSpeed += item.statBoost.attackSpeed;
        if (item.statBoost.defense) next.defense += item.statBoost.defense;
        if (item.statBoost.maxHp) {
          next.maxHp += item.statBoost.maxHp;
          next.currentHp += item.statBoost.maxHp;
        }
      }
      return next;
    });

    const newEnemyInventory = [...enemyInventory, ...selectedItems];
    setEnemyInventory(newEnemyInventory);
    
    // 적군 시너지 체크 (간소화)
    const { statsUpdate } = getSynergyEffects(newEnemyInventory);
    setEnemyStats((prev: any) => ({ ...prev, ...statsUpdate }));

    const itemNames = selectedItems.map(it => it.name).join(', ');
    setEnemyGrowthMessage(`적이 [${itemNames}]을(를) 장착하여 강해졌습니다!`);
    setTimeout(() => setEnemyGrowthMessage(null), 3000);

    startPhase('FARMING');
  };

  // [새 게임 시작 함수]
  const startNewGame = () => {
    clearAllTimers();
    resetInput();
    isRoundOver.current = false;
    setCurrentPhase('SELECT');
    setTimeLeft(0);
    setCurrentRound(1);
    setPlayerGold(20);
    setPlayerInventory([]);
    setEnemyInventory([]);
    setPlayerWins(0);
    setEnemyWins(0);
    setFinalWinner(null);
    setBattleWinner(null);
    setActiveSynergies([]);
    setEnemyGrowthMessage(null);
    setPlayerStats(null);
    setEnemyStats(null);
    setBaseStats(null);
    playerPosRef.current = { x: 250, y: 200 };
    setPlayerPos({ x: 250, y: 200 });
    minionsRef.current = [];
    setMinions([]);
  };

  if (currentPhase === 'SELECT' || !playerStats || !enemyStats) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 overflow-y-auto font-sans">
        <h1 className="text-4xl font-black italic uppercase text-yellow-400 mb-2 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">CYBER ARENA</h1>
        <p className="text-gray-400 font-bold mb-8 uppercase tracking-widest italic">Select Your Champion</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
          {characters.map(char => (
            <button 
              key={char.id}
              onClick={() => selectCharacter(char.id)}
              className="group relative bg-white border-4 border-gray-900 p-6 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all text-left"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{char.passiveName}</span>
                  <span className="font-black text-2xl italic uppercase leading-none" style={{ color: char.color }}>{char.name}</span>
                </div>
                <div className="w-12 h-12 rounded-2xl border-2 border-gray-900 flex items-center justify-center bg-gray-50 group-hover:bg-yellow-400 transition-colors">
                  <Sword size={24} className="text-gray-900" />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black uppercase">
                  <span className="text-gray-400">HP</span>
                  <span>{char.maxHp}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                  <div className="h-full bg-red-500" style={{ width: `${(char.maxHp / 220) * 100}%` }}></div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-400 uppercase">Attack</span>
                    <span className="font-black text-sm italic">{char.attackPower}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-400 uppercase">Defense</span>
                    <span className="font-black text-sm italic">{char.defense}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-400 uppercase">Speed</span>
                    <span className="font-black text-sm italic">{char.speed}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-400 uppercase">Evasion</span>
                    <span className="font-black text-sm italic text-blue-500">{char.evasion}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-100">
                <span className="text-[10px] font-black text-yellow-600 uppercase italic group-hover:underline">Click to Select Champion</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 pb-16 font-sans text-gray-900">
      <div className="w-full max-w-[500px] mx-auto space-y-4">
        
        <header className="bg-white border-4 border-gray-900 p-3 sm:p-4 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div id="score-board" className="mb-4 bg-gray-900 text-white p-2 rounded-xl flex justify-between items-center border-2 border-gray-900 shadow-[4px_4px_0px_0px_rgba(33,115,70,1)]">
            <div className="flex flex-col items-center flex-1">
              <span className="text-[8px] font-black uppercase text-blue-400">MILKJIN</span>
              <span className="text-xl font-black italic">{playerWins}</span>
            </div>
            <div className="px-4 font-black text-lg italic text-yellow-400">VS</div>
            <div className="flex flex-col items-center flex-1">
              <span className="text-[8px] font-black uppercase text-red-400">SODACHAN</span>
              <span className="text-xl font-black italic">{enemyWins}</span>
            </div>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-1.5 bg-yellow-400 border-2 border-gray-900 px-3 py-1 font-black text-sm italic">
              <Coins size={16} /> {playerGold} GOLD
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase text-gray-400 leading-none mb-1">{currentPhase} PHASE</span>
              <span className={`text-2xl font-black italic leading-none ${timeLeft <= 5 ? 'text-red-600 animate-pulse' : 'text-gray-900'}`}>
                {currentPhase === 'BATTLE' ? 'VS' : timeLeft}
              </span>
            </div>
            <span className="bg-gray-900 text-white px-4 py-1 font-black text-base uppercase italic rounded-lg">
              ROUND {currentRound}
            </span>
          </div>
          
          <div className="flex flex-col gap-4">
            {/* 플레이어 정보 */}
            <div className="w-full space-y-1">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest leading-none">{playerStats?.passiveName}</span>
                  <span className="font-black text-lg italic uppercase leading-tight">{playerStats?.name}</span>
                </div>
                <span className="font-bold text-xs text-red-600">{Math.ceil(playerStats?.currentHp || 0)} / {playerStats?.maxHp || 100}</span>
              </div>
              <div className="w-full h-6 bg-gray-200 border-2 border-gray-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full border-r-2 border-gray-900 transition-all duration-100 ${playerStats?.currentHp < (playerStats?.maxHp || 100) * 0.3 ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${((playerStats?.currentHp || 0) / (playerStats?.maxHp || 100)) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* 적 정보 */}
            <div className="w-full space-y-1 text-right">
              <div className="flex justify-between items-end flex-row-reverse">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-red-600 uppercase tracking-widest leading-none">{enemyStats?.passiveName}</span>
                  <span className="font-black text-lg italic uppercase leading-tight">{enemyStats?.name}</span>
                </div>
                <span className="font-bold text-xs text-red-600">{Math.ceil(enemyStats?.currentHp || 0)} / {enemyStats?.maxHp || 100}</span>
              </div>
              <div className="w-full h-6 bg-gray-200 border-2 border-gray-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full border-l-2 border-gray-900 float-right transition-all duration-100 ${enemyStats?.currentHp < (enemyStats?.maxHp || 100) * 0.3 ? 'bg-red-500' : 'bg-green-500'}`}
                  style={{ width: `${((enemyStats?.currentHp || 0) / (enemyStats?.maxHp || 100)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </header>

        <main className="relative bg-gray-900 border-4 border-gray-900 rounded-3xl h-[400px] overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-around">
          {currentPhase === 'FARMING' ? (
            <>
              <canvas 
                ref={canvasRef}
                width={500}
                height={400}
                className="w-full h-full block"
              />
              
              <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-sm p-2 rounded-lg border border-white/20">
                <p className="text-[10px] font-black text-white uppercase italic">WASD / Arrow Keys to Move</p>
                <p className="text-[10px] font-black text-yellow-400 uppercase italic">Collect Yellow Cubes for Gold</p>
              </div>

              {/* 모바일 가상 방향키 (D-pad) */}
              <div id="mobile-dpad" className="absolute bottom-6 left-6 z-50 grid grid-cols-3 gap-2 select-none pointer-events-auto md:hidden">
                <div />
                <button 
                  onMouseDown={() => handleDpad('w', true)} 
                  onMouseUp={() => handleDpad('w', false)}
                  onMouseLeave={() => handleDpad('w', false)}
                  onTouchStart={(e) => { e.preventDefault(); handleDpad('w', true); }}
                  onTouchEnd={(e) => { e.preventDefault(); handleDpad('w', false); }}
                  onTouchCancel={(e) => { e.preventDefault(); handleDpad('w', false); }}
                  className="w-14 h-14 bg-white/20 backdrop-blur-md border-2 border-white/40 rounded-2xl flex items-center justify-center active:bg-white/40 shadow-lg touch-none"
                >
                  <span className="text-white text-xl">⬆️</span>
                </button>
                <div />
                <button 
                  onMouseDown={() => handleDpad('a', true)} 
                  onMouseUp={() => handleDpad('a', false)}
                  onMouseLeave={() => handleDpad('a', false)}
                  onTouchStart={(e) => { e.preventDefault(); handleDpad('a', true); }}
                  onTouchEnd={(e) => { e.preventDefault(); handleDpad('a', false); }}
                  onTouchCancel={(e) => { e.preventDefault(); handleDpad('a', false); }}
                  className="w-14 h-14 bg-white/20 backdrop-blur-md border-2 border-white/40 rounded-2xl flex items-center justify-center active:bg-white/40 shadow-lg touch-none"
                >
                  <span className="text-white text-xl">⬅️</span>
                </button>
                <button 
                  onMouseDown={() => handleDpad('s', true)} 
                  onMouseUp={() => handleDpad('s', false)}
                  onMouseLeave={() => handleDpad('s', false)}
                  onTouchStart={(e) => { e.preventDefault(); handleDpad('s', true); }}
                  onTouchEnd={(e) => { e.preventDefault(); handleDpad('s', false); }}
                  onTouchCancel={(e) => { e.preventDefault(); handleDpad('s', false); }}
                  className="w-14 h-14 bg-white/20 backdrop-blur-md border-2 border-white/40 rounded-2xl flex items-center justify-center active:bg-white/40 shadow-lg touch-none"
                >
                  <span className="text-white text-xl">⬇️</span>
                </button>
                <button 
                  onMouseDown={() => handleDpad('d', true)} 
                  onMouseUp={() => handleDpad('d', false)}
                  onMouseLeave={() => handleDpad('d', false)}
                  onTouchStart={(e) => { e.preventDefault(); handleDpad('d', true); }}
                  onTouchEnd={(e) => { e.preventDefault(); handleDpad('d', false); }}
                  onTouchCancel={(e) => { e.preventDefault(); handleDpad('d', false); }}
                  className="w-14 h-14 bg-white/20 backdrop-blur-md border-2 border-white/40 rounded-2xl flex items-center justify-center active:bg-white/40 shadow-lg touch-none"
                >
                  <span className="text-white text-xl">➡️</span>
                </button>
              </div>
            </>
          ) : currentPhase === 'SHOP' ? (
            <div className="flex flex-col items-center justify-center text-center p-6">
              <div className="w-20 h-20 bg-yellow-400 border-4 border-gray-900 rounded-full flex items-center justify-center mb-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                <ShoppingBag size={40} className="text-gray-900" />
              </div>
              <h2 className="text-2xl font-black italic uppercase text-white mb-2">Shop Phase</h2>
              <p className="text-gray-400 text-sm font-bold uppercase italic">Buy items and prepare for battle!</p>
              <div className="mt-8 bg-white/10 border-2 border-white/20 p-4 rounded-2xl backdrop-blur-sm">
                <p className="text-yellow-400 font-black text-xl italic">{timeLeft}s REMAINING</p>
              </div>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 opacity-20 pointer-events-none" 
                   style={{ backgroundImage: 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
              
              {battleWinner && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md p-4 text-center">
                  <h2 className="text-yellow-400 font-black italic uppercase mb-6 drop-shadow-[0_2px_0_rgba(0,0,0,1)]"
                      style={{ fontSize: 'clamp(1.5rem, 8vw, 3rem)', maxWidth: '90%' }}>
                    {battleWinner} 승리!
                  </h2>
                  {!finalWinner ? (
                    <button 
                      onClick={nextRound}
                      className="bg-white hover:bg-yellow-400 text-gray-900 border-4 border-gray-900 px-6 py-2 font-black text-base uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                    >
                      다음 라운드로
                    </button>
                  ) : (
                    <div className="bg-white border-4 border-gray-900 p-6 rounded-3xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in zoom-in duration-300">
                      <h1 className="text-3xl font-black italic uppercase text-red-600 mb-2">FINAL WINNER</h1>
                      <p className="text-xl font-black uppercase mb-6">{finalWinner}!</p>
                      <button 
                        onClick={startNewGame}
                        className="bg-red-600 hover:bg-red-500 text-white border-4 border-gray-900 px-8 py-3 font-black text-lg italic uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
                      >
                        새 게임 시작
                      </button>
                    </div>
                  )}
                </div>
              )}

              {evasionLog && (
                <motion.div 
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: -50 }}
                  className="absolute z-50 font-black text-blue-400 italic text-xl drop-shadow-md"
                  style={{ left: evasionLog.x, top: evasionLog.y }}
                >
                  {evasionLog.text}
                </motion.div>
              )}

              {/* 플레이어 더미 */}
              <div className={`z-10 flex flex-col items-center gap-2 transition-transform ${isBattleActive ? 'animate-bounce' : ''}`}>
                <div className="w-16 h-16 bg-blue-500 border-2 border-gray-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center text-white font-black">
                  <span className="text-[8px] opacity-70">ATK: {playerStats?.attackPower}</span>
                  <span className="text-xs">PLAYER</span>
                  <span className="text-[8px] opacity-70">DEF: {playerStats?.defense}</span>
                </div>
                <span className="bg-white border-2 border-gray-900 px-2 py-0.5 font-black text-[10px]">{playerStats?.name}</span>
              </div>

              <div className="font-black text-2xl italic text-gray-700 px-2">VS</div>

              {/* 적 더미 */}
              <div className={`z-10 flex flex-col items-center gap-2 transition-transform ${isBattleActive ? 'animate-pulse' : ''}`}>
                <div className="w-16 h-16 bg-red-500 border-2 border-gray-900 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center justify-center text-white font-black">
                  <span className="text-[8px] opacity-70">ATK: {enemyStats?.attackPower}</span>
                  <span className="text-xs">ENEMY</span>
                  <span className="text-[8px] opacity-70">DEF: {enemyStats?.defense}</span>
                </div>
                <span className="bg-white border-2 border-gray-900 px-2 py-0.5 font-black text-[10px]">{enemyStats?.name}</span>
              </div>
            </>
          )}

          {enemyGrowthMessage && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-red-600 text-white px-4 py-2 border-2 border-gray-900 font-black text-[10px] uppercase italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-in slide-in-from-top duration-300">
              {enemyGrowthMessage}
            </div>
          )}
        </main>

        <div id="bottom-ui" className={`space-y-4 pb-8 ${currentPhase === 'FARMING' || currentPhase === 'BATTLE' ? 'hidden' : ''}`}>
          {/* 시너지 보드 영역 */}
          <div id="synergy-board" className="bg-white border-4 border-gray-900 p-3 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black text-[10px] uppercase mb-2 italic text-gray-400">Active Synergies</h3>
            <div className="flex flex-col gap-1.5">
              {activeSynergies.length > 0 ? (
                activeSynergies.map((s, idx) => (
                  <div key={`${s}-${idx}`} className="bg-purple-600 text-white px-3 py-1 rounded-lg text-[10px] font-black animate-pulse border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] w-fit">
                    {s} 발동!
                  </div>
                ))
              ) : (
                <span className="text-gray-300 text-[10px] font-bold italic">활성화된 시너지 없음</span>
              )}
            </div>
          </div>

          {/* 인벤토리 영역 */}
          <div className="bg-white border-4 border-gray-900 p-4 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black text-sm uppercase mb-3 italic border-b-2 border-gray-100 pb-1 flex justify-between items-center">
              MY INVENTORY
              <span className="text-[10px] font-bold text-gray-400">{playerInventory.length} / 6</span>
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <div key={i} className="aspect-square bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-300 font-bold text-[10px] overflow-hidden">
                  {playerInventory[i] ? (
                    <div className="w-full h-full bg-blue-50 flex flex-col items-center justify-center p-1 text-blue-600 border-2 border-blue-500 rounded-lg">
                       <span className="text-[8px] text-center leading-tight font-black">{playerInventory[i].name}</span>
                       <span className="text-[7px] opacity-70">
                         {playerInventory[i].statBoost.attackPower ? `ATK+${playerInventory[i].statBoost.attackPower}` : 
                          playerInventory[i].statBoost.attackSpeed ? `SPD+${playerInventory[i].statBoost.attackSpeed}` :
                          playerInventory[i].statBoost.defense ? `DEF+${playerInventory[i].statBoost.defense}` :
                          playerInventory[i].statBoost.maxHp ? `HP+${playerInventory[i].statBoost.maxHp}` : ''}
                       </span>
                    </div>
                  ) : (
                    `SLOT ${i + 1}`
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 상점 영역 */}
          <div className="bg-white border-4 border-gray-900 p-4 rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="font-black text-sm uppercase mb-3 italic border-b-2 border-gray-100 pb-1">ARENA SHOP</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar snap-x">
              {items.map((item) => (
                <div 
                  key={item.id} 
                  className={`min-w-[140px] flex-shrink-0 flex flex-col p-3 border-2 border-gray-900 rounded-xl transition-all snap-start ${playerGold >= item.price ? 'bg-gray-50' : 'bg-gray-200 opacity-70'}`}
                >
                  <div className="w-10 h-10 bg-gray-200 border-2 border-gray-900 rounded-lg flex items-center justify-center mb-2 mx-auto">
                    <Package size={20} className="text-gray-600" />
                  </div>
                  <div className="text-center mb-2">
                    <p className="font-black text-xs uppercase leading-tight h-8 flex items-center justify-center">{item.name}</p>
                    <div className="flex justify-center gap-1 mt-1">
                      {item.tags.map((tag, idx) => (
                        <span key={`${tag}-${idx}`} className="text-[7px] bg-white border border-gray-300 px-1 rounded font-bold text-gray-500">#{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-auto space-y-2">
                    <div className="flex items-center justify-center gap-1 font-black text-xs">
                      <Coins size={12} className="text-yellow-600" /> {item.price}G
                    </div>
                    <button 
                      onClick={() => buyItem(item)}
                      disabled={playerGold < item.price || playerInventory.length >= 6}
                      className={`w-full py-1.5 border-2 border-gray-900 font-black text-[10px] uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all ${playerGold >= item.price && playerInventory.length < 6 ? 'bg-yellow-400 hover:bg-yellow-300' : 'bg-gray-300 cursor-not-allowed'}`}
                    >
                      BUY
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #111;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

const CyberArenaShop = ({ session, currentUser, isHost }: { session: Session, currentUser: any, isHost: boolean }) => {
  return (
    <div className="relative w-full h-full">
      {isHost && (
        <button 
          onClick={() => sessionService.resetSession(session.id, session.players)}
          className="absolute top-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-red-700 transition-colors"
        >
          로비로 돌아가기
        </button>
      )}
      <ArenaRebuild />
    </div>
  );
};

const CyberArenaUI = ({ session, currentUser, isSpectator, isHost }: { session: Session, currentUser: any, isSpectator: boolean, isHost: boolean }) => {
  return (
    <div className="relative w-full h-full">
      {isHost && (
        <button 
          onClick={() => sessionService.resetSession(session.id, session.players)}
          className="absolute top-4 right-4 z-50 bg-red-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-red-700 transition-colors"
        >
          로비로 돌아가기
        </button>
      )}
      <ArenaRebuild />
    </div>
  );
};

const DisclaimerModal = ({ onAccept }: { onAccept: () => void }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white border border-[#d1d1d1] rounded-lg shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-[#217346] text-white px-6 py-4 flex items-center gap-3">
          <AlertTriangle size={24} />
          <h2 className="text-lg font-bold">서비스 이용 안내 및 고지사항</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
            <p className="font-bold text-gray-900 border-b border-gray-100 pb-2">
              본 사이트는 개인이 제작한 비공식 오락용 프로젝트입니다.
            </p>
            <ul className="list-disc list-inside space-y-2 text-[13px]">
              <li>본 서비스는 실제 회사 또는 특정 조직과 아무런 관련이 없습니다.</li>
              <li>사이트 내 모든 결과 및 콘텐츠는 재미와 오락을 위한 용도로만 이용해 주세요.</li>
              <li>업무 시간 내 사용으로 인해 발생하는 개인의 피해나 불이익에 대해 개발자는 어떠한 책임도 지지 않습니다.</li>
              <li>모든 데이터는 실시간으로 동기화되나, 비공식 프로젝트 특성상 데이터 보존을 보장하지 않습니다.</li>
            </ul>
          </div>
          <div className="pt-4">
            <button
              onClick={onAccept}
              className="w-full office-btn-primary py-3 text-sm font-bold rounded-md shadow-md hover:scale-[1.02] transition-transform"
            >
              위 내용을 확인하였으며, 동의합니다
            </button>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 text-center">
          <p className="text-[10px] text-gray-400">© 2026 Office Sheets Project. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [showDisclaimer, setShowDisclaimer] = useState(() => {
    return !localStorage.getItem('disclaimer_accepted');
  });
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [activeSheet, setActiveSheet] = useState<'GAME' | 'ROLES' | 'LOGS' | 'STATS' | 'HELP' | 'LEADERBOARD'>('GAME');
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [menuMode, setMenuMode] = useState<'create' | 'join'>('create');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const isHost = session?.hostId === currentUser?.uid;
  const me = session?.players?.[currentUser?.uid];
  const isSpectator = !me || me.isSpectator || (!me.isAlive && session.status !== SessionStatus.LOBBY && session.status !== SessionStatus.SUMMARY);

  const [copied, setCopied] = useState(false);
  const [selectedVoteTarget, setSelectedVoteTarget] = useState<string | null>(null);
  const [selectedNightTarget, setSelectedNightTarget] = useState<string | null>(null);
  const [omokBlackId, setOmokBlackId] = useState<string>('');
  const [omokWhiteId, setOmokWhiteId] = useState<string>('');
  const [omokDifficulty, setOmokDifficulty] = useState<number>(1);
  const [isOmokAIMatch, setIsOmokAIMatch] = useState<boolean>(false);
  const [bingoBoard, setBingoBoard] = useState<string[][]>(Array(5).fill(null).map(() => Array(5).fill('')));
  const [bingoSubmitted, setBingoSubmitted] = useState(false);
  const [omokHint, setOmokHint] = useState<{x: number, y: number} | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminInput, setAdminInput] = useState('');
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [drawGuess, setDrawGuess] = useState('');
  const [showBingoWords, setShowBingoWords] = useState(false);
  const [showLiarKeyword, setShowLiarKeyword] = useState(false);
  const [selectedSudokuCell, setSelectedSudokuCell] = useState<{r: number, c: number} | null>(null);
  const [globalLeaderboards, setGlobalLeaderboards] = useState<Record<string, any[]>>({});
  const [bingoLinesInput, setBingoLinesInput] = useState<string>('3');
  const [showSystemLogs, setShowSystemLogs] = useState(true);

  useEffect(() => {
    if (session?.settings?.bingoLines) {
      setBingoLinesInput(String(session.settings.bingoLines));
    }
  }, [session?.settings?.bingoLines]);

  useEffect(() => {
    if (session?.gameType === GameType.BINGO) {
      if (session.bingoGame?.boards?.[currentUser?.uid]) {
        setBingoBoard(session.bingoGame.boards[currentUser.uid]);
        setBingoSubmitted(true);
      } else if (session.status === SessionStatus.LOBBY) {
        setBingoSubmitted(false);
        setBingoBoard(Array(5).fill(null).map(() => Array(5).fill('')));
      } else if (session.status === SessionStatus.PREPARING) {
        setBingoSubmitted(false);
        // Don't reset board here if it's already being filled
      }
    }
  }, [session?.gameType, session?.bingoGame?.boards?.[currentUser?.uid], currentUser?.uid, session?.status]);

  useEffect(() => {
    setSelectedVoteTarget(null);
    setSelectedNightTarget(null);
  }, [session?.status]);

  useEffect(() => {
    let interval: any;
    if (session?.status === SessionStatus.PLAYING && session.gameType === GameType.DRAW && isHost) {
      interval = setInterval(() => {
        if (session.drawGame && session.drawGame.timer > 0) {
          sessionService.updateDrawTimer(session.id, session.drawGame.timer - 1);
        } else if (session.drawGame && session.drawGame.timer === 0) {
          sessionService.nextDrawTurn(session.id, session);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session?.status, session?.gameType, session?.drawGame?.timer, isHost]);

  // Synchronized Transitions
  useEffect(() => {
    if (!session || !session.players) return;
    
    // Only host triggers transitions
    if (session.hostId !== currentUser?.uid) return;

    const players = Object.values(session?.players || {}) as Player[];
    
    // Reveal -> Playing/Night
    if (session.status === SessionStatus.REVEAL) {
      const allConfirmed = players.every(p => p.hasConfirmedRole);
      if (allConfirmed && players.length > 0) {
        if (session.gameType === GameType.MAFIA) {
          sessionService.startNightPhase(session.id, session.players);
        } else {
          sessionService.advanceStatus(session.id, SessionStatus.PLAYING);
        }
      }
    }

    // Voting -> Vote Result
    if (session.status === SessionStatus.VOTING) {
      const alivePlayers = players.filter(p => p.isAlive);
      // Only require votes from connected players
      const activePlayers = alivePlayers.filter(p => p.isConnected !== false);
      const allVoted = activePlayers.every(p => p.voteTarget);
      
      if (allVoted && activePlayers.length > 0) {
        if (session.gameType === GameType.LIAR && session.liarGame) {
          sessionService.processLiarVote(session.id, session.players, session.liarGame);
        } else if (session.gameType === GameType.MAFIA) {
          sessionService.processMafiaVote(session.id, session.players);
        }
      }
    }

    // Mafia Night -> Day Transition
    if (session.status === SessionStatus.NIGHT && session.gameType === GameType.MAFIA && session.mafiaGame) {
      const alivePlayers = players.filter(p => p.isAlive);
      const aliveMafia = alivePlayers.filter(p => p.role === 'MAFIA');
      const aliveDoctor = alivePlayers.filter(p => p.role === 'DOCTOR');
      const alivePolice = alivePlayers.filter(p => p.role === 'POLICE');

      const mafiaDone = aliveMafia.every(m => session.mafiaGame?.mafiaTargets?.[m.id]);
      const doctorDone = aliveDoctor.length === 0 || session.mafiaGame.doctorTarget;
      const policeDone = alivePolice.length === 0 || session.mafiaGame.policeTarget;

      if (mafiaDone && doctorDone && policeDone) {
        sessionService.processNightPhase(session.id, session.players, session.mafiaGame);
      }
    }
  }, [session, currentUser]);

  useEffect(() => {
    if (session?.id && currentUser && session.players?.[currentUser.uid]) {
      sessionService.updatePresence(session.id, currentUser.uid, true);
      
      return () => {
        sessionService.updatePresence(session.id, currentUser.uid, false);
      };
    }
  }, [session?.id, currentUser?.uid]);

  useEffect(() => {
    const winner = 
      session?.omokGame?.winner || 
      session?.mafiaGame?.winner || 
      session?.liarGame?.winner || 
      session?.bingoGame?.winner || 
      session?.officeLifeGame?.winner;
      
    if (winner) {
      import('canvas-confetti').then(confetti => {
        confetti.default({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#217346', '#ffffff', '#fbc02d']
        });
      });
    }
  }, [
    session?.omokGame?.winner, 
    session?.mafiaGame?.winner, 
    session?.liarGame?.winner, 
    session?.bingoGame?.winner, 
    session?.officeLifeGame?.winner
  ]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setJoinCode(roomParam);
    }
  }, []);

  useEffect(() => {
    sessionService.authenticate().then(user => {
      setCurrentUser(user);
      if (user) {
        sessionService.getUserProfile(user.uid).then(profile => {
          setUserProfile(profile);
          if (profile && profile.nickname && profile.nickname !== '익명 사원') {
            setNickname(profile.nickname);
          }
        });
      }
    });
  }, []);

  useEffect(() => {
    const unsubscribe = sessionService.subscribeToGlobalLeaderboards((data) => {
      setGlobalLeaderboards(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (sessionId) {
      const unsubscribe = sessionService.subscribeToSession(sessionId, (data) => {
        if (!data) {
          setSessionId(null);
          setSession(null);
          setError('세션이 종료되었거나 찾을 수 없습니다.');
        } else {
          if (currentUser && data.players && !data.players[currentUser.uid]) {
            setSessionId(null);
            setSession(null);
            setError('방장에 의해 강퇴되었습니다.');
            return;
          }
          setSession(data);
        }
      });
      return () => unsubscribe();
    }
  }, [sessionId]);

  // Timer effect for Draw Game
  useEffect(() => {
    if (!session || session.gameType !== GameType.DRAW || session.status !== SessionStatus.PLAYING) return;
    if (!session.drawGame) return;

    // Only host manages the timer
    if (isHost) {
      const timerId = setInterval(() => {
        if (session.drawGame && session.drawGame.timer > 0) {
          sessionService.updateDrawTimer(session.id, session.drawGame.timer - 1);
        } else if (session.drawGame && session.drawGame.timer === 0) {
          // Time's up!
          sessionService.nextDrawTurn(session.id, session);
        }
      }, 1000);

      return () => clearInterval(timerId);
    }
  }, [session?.id, session?.gameType, session?.status, session?.drawGame?.timer, isHost]);

  // AI Simulation Effect
  useEffect(() => {
    if (!session || !isHost || !isAdminMode) return;
    
    const interval = setInterval(() => {
      sessionService.processAllAIMoves(session.id, session);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [session?.id, session?.status, session?.gameType, isHost, isAdminMode, session?.omokGame?.currentPlayerId, session?.bingoGame?.currentTurnIndex, session?.mafiaGame?.mafiaTarget, session?.mafiaGame?.doctorTarget, session?.mafiaGame?.policeTarget]);

  // Cyber Arena Game Loop (Disabled: UI uses standalone local component ArenaRebuild)
  /*
  useEffect(() => {
    if (!session || session.gameType !== GameType.CYBER_ARENA || session.status !== SessionStatus.PLAYING) return;
    if (!session.cyberArenaGame || session.cyberArenaGame.status === 'FINISHED') return;

    // Only host manages the game loop
    if (isHost) {
      const interval = setInterval(() => {
        if (sessionRef.current) {
          sessionService.updateArenaLoop(sessionRef.current.id, sessionRef.current);
        }
      }, 100); // 10 FPS for smoother movement

      return () => clearInterval(interval);
    }
  }, [session?.id, session?.gameType, session?.status, session?.cyberArenaGame?.status, isHost]); // Removed lastUpdate to keep interval stable
  */

  // Keyboard support for 2048 and Sudoku
  useEffect(() => {
    if (!session || session.status !== SessionStatus.PLAYING) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent scrolling with arrow keys when playing 2048
      if (session.gameType === GameType.OFFICE_2048 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      if (session.gameType === GameType.OFFICE_2048) {
        if (e.key === 'ArrowUp') sessionService.moveOffice2048(session.id, 'UP', session);
        if (e.key === 'ArrowDown') sessionService.moveOffice2048(session.id, 'DOWN', session);
        if (e.key === 'ArrowLeft') sessionService.moveOffice2048(session.id, 'LEFT', session);
        if (e.key === 'ArrowRight') sessionService.moveOffice2048(session.id, 'RIGHT', session);
      } else if (session.gameType === GameType.SUDOKU && selectedSudokuCell) {
        if (e.key >= '1' && e.key <= '9') {
          sessionService.updateSudokuCell(session.id, selectedSudokuCell.r, selectedSudokuCell.c, parseInt(e.key), session);
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
          sessionService.updateSudokuCell(session.id, selectedSudokuCell.r, selectedSudokuCell.c, null, session);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session, selectedSudokuCell]);

  const [chatMessage, setChatMessage] = useState('');
  const chatContainerRef = React.useRef<HTMLDivElement>(null);

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !session || !currentUser) return;
    await sessionService.sendMessage(session.id, currentUser.uid, nickname, chatMessage);
    setChatMessage('');
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [session?.messages]);

  const handleCreateSession = async (gameType: GameType) => {
    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      setError('닉네임을 입력해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (userProfile && userProfile.nickname !== trimmedNickname) {
        await sessionService.updateUserProfile(currentUser.uid, { nickname: trimmedNickname });
        setUserProfile({ ...userProfile, nickname: trimmedNickname });
      }
      const id = await sessionService.createSession(trimmedNickname, gameType);
      setSessionId(id);
      setActiveSheet('GAME');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async () => {
    const trimmedNickname = nickname.trim();
    const trimmedJoinCode = joinCode.trim();

    if (trimmedJoinCode === 'ad0419**') {
      const newMode = !isAdminMode;
      setIsAdminMode(newMode);
      setJoinCode('');
      setError(newMode ? '어드민 모드가 활성화되었습니다.' : '어드민 모드가 해제되었습니다.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!trimmedNickname) {
      setError('닉네임을 입력해주세요.');
      return;
    }
    if (!trimmedJoinCode) {
      setError('세션 코드를 입력해주세요.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (userProfile && userProfile.nickname !== trimmedNickname) {
        await sessionService.updateUserProfile(currentUser.uid, { nickname: trimmedNickname });
        setUserProfile({ ...userProfile, nickname: trimmedNickname });
      }
      await sessionService.joinSession(trimmedJoinCode, trimmedNickname);
      setSessionId(trimmedJoinCode);
      setActiveSheet('GAME');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReady = async () => {
    if (session && currentUser) {
      const player = session.players?.[currentUser.uid];
      await sessionService.updatePlayerReady(session.id, currentUser.uid, !player.isReady);
    }
  };

  const handleStartGame = async () => {
    if (!session || session.status !== SessionStatus.LOBBY) return;
    try {
      if (session.gameType === GameType.LIAR) {
        await sessionService.startLiarGame(session.id, session.players, session.settings, session.turnOrder);
      } else if (session.gameType === GameType.MAFIA) {
        await sessionService.startMafiaGame(session.id, session.players, session.settings, session.turnOrder);
      } else if (session.gameType === GameType.OMOK) {
        if (!omokBlackId || !omokWhiteId) {
          setError('두 명의 플레이어를 선택해주세요.');
          return;
        }
        await sessionService.startOmokGame(session.id, omokBlackId, omokWhiteId);
      } else if (session.gameType === GameType.BINGO) {
        await sessionService.startBingoSetup(session.id, session.settings);
      } else if (session.gameType === GameType.DRAW) {
        await sessionService.startDrawGame(session.id, session.players, session.settings, session.turnOrder || Object.keys(session.players || {}));
      } else if (session.gameType === GameType.MINESWEEPER) {
        await sessionService.startMinesweeperGame(session.id, session.settings.minesweeperDifficulty || 'EASY');
      } else if (session.gameType === GameType.OFFICE_2048) {
        await sessionService.startOffice2048Game(session.id);
      } else if (session.gameType === GameType.SUDOKU) {
        await sessionService.startSudokuGame(session.id, session.settings.sudokuDifficulty || 'EASY');
      } else if (session.gameType === GameType.OFFICE_LIFE) {
        await sessionService.startOfficeLifeGame(session.id, session.players, session.turnOrder, session.settings.officeLifeMode || 'INDIVIDUAL');
      } else if (session.gameType === GameType.ESCAPE_ROOM) {
        await sessionService.startEscapeRoom(session.id, session.settings.escapeRoomThemeId || 'universe_escape', session.settings);
      } else if (session.gameType === GameType.CYBER_ARENA) {
        await sessionService.startCyberArena(session.id, session.players, session.settings);
      }
    } catch (e: any) {
      setError(e.message || '게임을 시작하는 중 오류가 발생했습니다.');
    }
  };

  const handleLeaveSession = () => {
    setSessionId(null);
    setSession(null);
  };

  const handleCopyLink = () => {
    if (!session) return;
    const link = `${window.location.origin}${window.location.pathname}?room=${session.id}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSortedPlayers = () => {
    if (!session) return [];
    const players = Object.values(session?.players || {}) as Player[];
    if (!session.turnOrder) return players;
    
    return [...players].sort((a, b) => {
      const idxA = session.turnOrder!.indexOf(a.id);
      const idxB = session.turnOrder!.indexOf(b.id);
      // If a player is not in turnOrder (newly joined), put them at the end
      if (idxA === -1 && idxB === -1) return 0;
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });
  };

  const handleMovePlayer = (index: number, direction: 'up' | 'down') => {
    if (!session) return;
    const currentOrder = getSortedPlayers().map(p => p.id);
    if (direction === 'up' && index > 0) {
      [currentOrder[index], currentOrder[index - 1]] = [currentOrder[index - 1], currentOrder[index]];
    } else if (direction === 'down' && index < currentOrder.length - 1) {
      [currentOrder[index], currentOrder[index + 1]] = [currentOrder[index + 1], currentOrder[index]];
    }
    sessionService.updateTurnOrder(session.id, currentOrder);
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        {showDisclaimer && (
          <DisclaimerModal onAccept={() => {
            localStorage.setItem('disclaimer_accepted', 'true');
            setShowDisclaimer(false);
          }} />
        )}
        <div className="max-w-md w-full space-y-6 bg-white p-8 border border-red-200 rounded-lg shadow-sm">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600">
              <AlertTriangle size={24} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Firebase 설정 필요</h1>
            <p className="text-sm text-slate-500 leading-relaxed">
              애플리케이션을 실행하려면 Firebase 설정이 필요합니다. <br/>
              <code className="bg-slate-100 px-1 rounded">.env.example</code> 파일을 참고하여 환경 변수를 설정해주세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen desk-texture flex flex-col relative overflow-hidden">
        {/* Desk Background Decorations */}
        <div className="absolute top-20 -left-10 opacity-10 rotate-12 pointer-events-none hidden lg:block">
          <Coffee size={200} />
        </div>
        <div className="absolute bottom-10 -right-10 opacity-10 -rotate-12 pointer-events-none hidden lg:block">
          <StickyNote size={150} />
        </div>
        
        {showDisclaimer && (
          <DisclaimerModal onAccept={() => {
            localStorage.setItem('disclaimer_accepted', 'true');
            setShowDisclaimer(false);
          }} />
        )}
        {/* Excel-style Header */}
        <header className="bg-[#217346] text-white px-4 py-1.5 flex items-center justify-between shrink-0 z-20 shadow-md">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-sm">
              <Grid className="text-[#217346]" size={16} />
            </div>
            <h1 className="text-sm font-bold tracking-tight">프로젝트_시트.xlsx</h1>
          </div>
          <div className="flex items-center gap-4 text-[10px] opacity-90">
            <span className="hidden sm:inline">자동 저장: 켬</span>
            <span className="bg-white/20 px-2 py-0.5 rounded">v2.5.0</span>
          </div>
        </header>

        {/* Formula Bar */}
        <div className="office-toolbar h-8 z-10">
          <div className="bg-[#f8f9fa] border border-[#d1d1d1] px-3 py-0 min-w-[60px] flex items-center justify-center text-xs font-mono">A1</div>
          <div className="h-4 w-px bg-[#d1d1d1]" />
          <div className="flex-1 bg-white border border-[#d1d1d1] px-2 py-0 flex items-center gap-2">
            <span className="text-[#217346] font-bold italic text-xs">fx</span>
            <span className="font-mono text-xs truncate text-gray-600">=IF(사용자_인증, "전사_명예의_전당_준비완료", "본인_확인_대기중")</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-6 p-4 lg:p-8 z-10 overflow-auto">
          {/* Left Side: Profile & Stats */}
          <div className="w-full lg:w-80 space-y-6">
            {currentUser && (
              <UserProfileCard uid={currentUser.uid} />
            )}
            
            <div className="bg-white border border-[#d1d1d1] rounded-lg shadow-sm p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-50 -mr-8 -mt-8 rotate-45" />
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Trophy size={14} className="text-yellow-500" />
                오늘의 우수 사원
              </h3>
              <div className="space-y-3">
                {globalLeaderboards.OMOK_AI?.slice(0, 3).map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-gray-300 text-white' : 'bg-orange-300 text-white'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-800">{entry.nickname}</p>
                      <p className="text-[9px] text-gray-400">{entry.score}점</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="post-it hidden lg:block">
              <h4 className="text-[10px] font-black text-[#f57f17] uppercase mb-2">업무 지시 사항</h4>
              <ul className="text-[11px] text-[#795548] space-y-1 list-disc pl-4 font-medium">
                <li>오목 AI를 이기고 승진하세요.</li>
                <li>마피아 게임에서 스파이를 찾으세요.</li>
                <li>오피스 라이프에서 자산을 늘리세요.</li>
              </ul>
            </div>
          </div>

          {/* Right Side: Game Selection */}
          <div className="flex-1">
            {activeSheet === 'GAME' ? (
            <div className="max-w-md w-full bg-white border border-[#d1d1d1] shadow-md rounded">
              <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 text-[10px] font-bold text-[#666] flex justify-between items-center">
                <span>사용자_인증_프롬프트</span>
                <MoreVertical size={12} />
              </div>
              
              {/* Tabs */}
              <div className="flex border-b border-[#d1d1d1]">
                <button 
                  className={`flex-1 py-3 text-xs font-bold transition-colors ${menuMode === 'create' ? 'bg-white border-b-2 border-b-[#217346] text-[#217346]' : 'bg-[#f8f9fa] text-[#999] hover:bg-[#f1f1f1]'}`}
                  onClick={() => setMenuMode('create')}
                >
                  새 세션 만들기
                </button>
                <button 
                  className={`flex-1 py-3 text-xs font-bold transition-colors ${menuMode === 'join' ? 'bg-white border-b-2 border-b-[#217346] text-[#217346]' : 'bg-[#f8f9fa] text-[#999] hover:bg-[#f1f1f1]'}`}
                  onClick={() => setMenuMode('join')}
                >
                  코드로 참여하기
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#666] uppercase">사용자 이름</label>
                    <input
                      type="text"
                      className="office-input border-[#d1d1d1]"
                      placeholder="닉네임을 입력하세요..."
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          if (menuMode === 'join') handleJoinSession();
                          else handleCreateSession(GameType.LIAR);
                        }
                      }}
                    />
                  </div>

                  {menuMode === 'create' ? (
                    <div className="space-y-3 pt-2">
                      <p className="text-[10px] text-[#999]">새로운 오피스 시트 세션을 생성하고 팀원들을 초대합니다.</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button 
                          onClick={() => handleCreateSession(GameType.LIAR)} 
                          className="office-btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
                          disabled={loading}
                        >
                          <span className="font-bold">라이어 시트</span>
                          <span className="text-[9px] font-normal opacity-80">거짓말쟁이 찾기</span>
                        </button>
                        <button 
                          onClick={() => handleCreateSession(GameType.MAFIA)} 
                          className="office-btn py-3 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
                          disabled={loading}
                        >
                          <span className="font-bold">마피아 시트</span>
                          <span className="text-[9px] font-normal opacity-80">범인 색출 작전</span>
                        </button>
                        <button 
                          onClick={() => handleCreateSession(GameType.OMOK)} 
                          className="office-btn py-3 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
                          disabled={loading}
                        >
                          <span className="font-bold">오목 (1:1)</span>
                          <span className="text-[9px] font-normal opacity-80">전략 보드 시트</span>
                        </button>
                        <button 
                          onClick={() => handleCreateSession(GameType.BINGO)} 
                          className="office-btn py-3 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
                          disabled={loading}
                        >
                          <span className="font-bold">빙고 (다수)</span>
                          <span className="text-[9px] font-normal opacity-80">데이터 매칭 감사</span>
                        </button>
                        <button 
                          onClick={() => handleCreateSession(GameType.DRAW)} 
                          className="office-btn py-3 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
                          disabled={loading}
                        >
                          <span className="font-bold">캐치마인드</span>
                          <span className="text-[9px] font-normal opacity-80">비주얼 브리핑</span>
                        </button>
                        <button 
                          onClick={() => handleCreateSession(GameType.MINESWEEPER)} 
                          className="office-btn py-3 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
                          disabled={loading}
                        >
                          <span className="font-bold">지뢰 찾기</span>
                          <span className="text-[9px] font-normal opacity-80">데이터 오류 검수</span>
                        </button>
                        <button 
                          onClick={() => handleCreateSession(GameType.OFFICE_2048)} 
                          className="office-btn py-3 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
                          disabled={loading}
                        >
                          <span className="font-bold">2048</span>
                          <span className="text-[9px] font-normal opacity-80">직급 승진 대작전</span>
                        </button>
                        <button 
                          onClick={() => handleCreateSession(GameType.SUDOKU)} 
                          className="office-btn py-3 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
                          disabled={loading}
                        >
                          <span className="font-bold">스도쿠</span>
                          <span className="text-[9px] font-normal opacity-80">데이터 무결성 검증</span>
                        </button>
                        <button 
                          onClick={() => handleCreateSession(GameType.OFFICE_LIFE)} 
                          className="office-btn py-3 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
                          disabled={loading}
                        >
                          <span className="font-bold">승진 대작전</span>
                          <span className="text-[9px] font-normal opacity-80">오피스 라이프 보드</span>
                        </button>
                        <button 
                          onClick={() => handleCreateSession(GameType.ESCAPE_ROOM)} 
                          className="office-btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
                          disabled={loading}
                        >
                          <span className="font-bold">방탈출</span>
                          <span className="text-[9px] font-normal opacity-80">비밀의 오피스</span>
                        </button>
                        <button 
                          onClick={() => handleCreateSession(GameType.CYBER_ARENA)} 
                          className="office-btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1"
                          disabled={loading}
                        >
                          <span className="font-bold">사이버 아레나</span>
                          <span className="text-[9px] font-normal opacity-80">1:1 배틀 시뮬레이션</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-2">
                      <p className="text-[10px] text-[#999]">공유받은 세션 코드를 입력하여 참여합니다.</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="office-input flex-1"
                          placeholder="세션_코드 (예: -Nxyz...)"
                          value={joinCode}
                          onChange={(e) => setJoinCode(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleJoinSession()}
                        />
                        <button 
                          onClick={handleJoinSession} 
                          className="office-btn px-6 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                          disabled={loading}
                        >
                          {loading ? '참여 중...' : '입장'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {error && <p className="text-[10px] text-red-600 font-mono bg-red-50 p-2 rounded border border-red-100">#오류: {error}</p>}
              </div>
            </div>
          ) : activeSheet === 'LEADERBOARD' ? (
            <div className="max-w-6xl w-full bg-white border border-[#d1d1d1] shadow-md rounded overflow-hidden">
              <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 text-[10px] font-bold text-[#666]">
                프로젝트_시트 (글로벌)
              </div>
              <div className="p-6">
                <p className="text-xs text-gray-500 mb-6 italic">* 전사 시트에서 기록된 실시간 순위입니다. (글로벌 통합)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Leaderboard entries={globalLeaderboards?.OFFICE_2048 || []} title="직급 승진 (2048)" sessionId="GLOBAL" gameType="OFFICE_2048" />
                  <Leaderboard entries={globalLeaderboards?.MINESWEEPER || []} title="데이터 검수 (지뢰찾기)" sessionId="GLOBAL" gameType="MINESWEEPER" />
                  <Leaderboard entries={globalLeaderboards?.SUDOKU || []} title="데이터 무결성 (스도쿠)" sessionId="GLOBAL" gameType="SUDOKU" />
                  <Leaderboard entries={globalLeaderboards?.OMOK_AI || []} title="오목 마스터 (부장급 AI)" sessionId="GLOBAL" gameType="OMOK_AI" />
                  <Leaderboard entries={globalLeaderboards?.ESCAPE_ROOM || []} title="방탈출 마스터" sessionId="GLOBAL" gameType="ESCAPE_ROOM" />
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl w-full bg-white border border-[#d1d1d1] shadow-md rounded overflow-hidden">
              <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 text-[10px] font-bold text-[#666]">
                시스템_설정_및_도움말
              </div>
              <div className="p-8 text-center space-y-4">
                <HelpCircle size={48} className="mx-auto text-[#217346] opacity-20" />
                <h3 className="text-lg font-bold text-gray-800">도움말 및 설정</h3>
                <p className="text-sm text-gray-500">세션에 입장한 후 상세한 시트 매뉴얼과 설정을 확인하실 수 있습니다.</p>
                <button 
                  onClick={() => setActiveSheet('GAME')}
                  className="office-btn-primary px-6 py-2"
                >
                  메인으로 돌아가기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Sheet Tabs */}
        <footer className="bg-[#f8f9fa] border-t border-[#d1d1d1] flex items-center h-8 shrink-0">
          <button 
            onClick={() => setActiveSheet('GAME')}
            className={`office-tab ${activeSheet === 'GAME' ? 'active' : ''}`}
          >
            메인_입력
          </button>
          <button 
            className="office-tab opacity-30 cursor-not-allowed"
            disabled
          >
            로그_시트
          </button>
          <button 
            onClick={() => setActiveSheet('LEADERBOARD')}
            className={`office-tab ${activeSheet === 'LEADERBOARD' ? 'active' : ''}`}
          >
            명예의_전당
          </button>
          <button 
            onClick={() => setActiveSheet('HELP')}
            className={`office-tab ${activeSheet === 'HELP' ? 'active' : ''}`}
          >
            설정
          </button>
          <div className="flex-1" />
          <div className="px-4 text-[10px] text-[#999]">100% 준비됨</div>
        </footer>
      </div>
    );
  }

  // Handle spectator mode - REMOVED restrictive view to allow seeing the game board
  // We now handle spectator state within the main render logic

  if (!session) return <div className="flex items-center justify-center h-screen spreadsheet-bg font-mono text-[10px] text-[#666]">#리소스_로드_중...</div>;

  return (
    <div className="min-h-screen spreadsheet-bg flex flex-col font-sans">
      {showDisclaimer && (
        <DisclaimerModal onAccept={() => {
          localStorage.setItem('disclaimer_accepted', 'true');
          setShowDisclaimer(false);
        }} />
      )}
      {/* Header */}
      <header className="bg-[#217346] text-white px-3 sm:px-4 py-1 sm:py-1.5 flex items-center justify-between shrink-0 z-30 shadow-md">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-white p-0.5 sm:p-1 rounded-sm">
            <Grid className="text-[#217346]" size={14} />
          </div>
          <h1 className="text-xs sm:text-sm font-bold tracking-tight truncate max-w-[120px] sm:max-w-none flex items-center gap-2">
            <span>
              {session.gameType === GameType.LIAR ? '오피스_라이어_시트.xlsx' : 
               session.gameType === GameType.MAFIA ? '오피스_마피아_시트.xlsx' : 
               session.gameType === GameType.OMOK ? '오피스_오목_대전.xlsx' :
               session.gameType === GameType.BINGO ? '오피스_빙고_매칭.xlsx' : 
               session.gameType === GameType.DRAW ? '오피스_캐치마인드.xlsx' :
               session.gameType === GameType.MINESWEEPER ? '데이터_오류_검수.xlsx' :
               session.gameType === GameType.OFFICE_2048 ? '직급_승진_프로세스.xlsx' : 
               session.gameType === GameType.CYBER_ARENA ? '사이버_아레나_시뮬레이션.xlsx' : '데이터_무결성_검증.xlsx'}
            </span>
            {isSpectator && <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded font-normal">(관전)</span>}
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2 text-[9px] font-mono bg-white/10 px-2 py-0.5 rounded">
            <span>ID: {session.id}</span>
            <button 
              onClick={handleCopyLink}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              {copied ? <CheckCircle2 size={10} className="text-green-400" /> : <Share2 size={10} />}
              <span className="text-[8px]">{copied ? '복사됨' : '복사'}</span>
            </button>
          </div>
          <button onClick={handleLeaveSession} className="hover:bg-white/20 p-1 rounded transition-colors" title="세션 종료">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Formula Bar - More Compact */}
      <div className="office-toolbar h-7 sm:h-8 z-20">
        <div className="bg-[#f8f9fa] border border-[#d1d1d1] px-2 sm:px-3 py-0 flex items-center justify-center min-w-[40px] sm:min-w-[60px] text-[10px] sm:text-xs font-mono">B2</div>
        <div className="h-4 w-px bg-[#d1d1d1]" />
        <div className="flex-1 bg-white border border-[#d1d1d1] px-2 py-0 flex items-center gap-2 overflow-hidden">
          <span className="text-[#217346] font-bold italic text-xs">fx</span>
          <span className="font-mono text-[10px] sm:text-xs truncate text-gray-600">=현재_상태_확인("{session.status}")</span>
        </div>
      </div>

      {/* Quick Reaction Bar */}
      {activeSheet === 'GAME' && session.status !== SessionStatus.LOBBY && (
        <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-1.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[9px] font-bold text-[#999] uppercase whitespace-nowrap mr-2">신속_결재:</span>
          {[
            { label: '승인', color: 'bg-green-100 text-green-700 border-green-200' },
            { label: '반려', color: 'bg-red-100 text-red-700 border-red-200' },
            { label: '검토중', color: 'bg-blue-100 text-blue-700 border-blue-200' },
            { label: '수고하셨습니다', color: 'bg-gray-100 text-gray-700 border-gray-200' },
            { label: '퇴근각', color: 'bg-purple-100 text-purple-700 border-purple-200' },
            { label: '??', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
          ].map((reaction) => (
            <button
              key={reaction.label}
              onClick={() => sessionService.sendMessage(session.id, currentUser.uid, nickname, `[결재] ${reaction.label}`)}
              className={`px-2 py-0.5 rounded border text-[10px] font-bold whitespace-nowrap transition-transform active:scale-95 ${reaction.color}`}
            >
              {reaction.label}
            </button>
          ))}
        </div>
      )}

      <main className={`flex-1 min-h-0 relative ${
        (session.gameType === GameType.OFFICE_LIFE || session.gameType === GameType.CYBER_ARENA) && session.status !== SessionStatus.LOBBY 
          ? 'p-0 overflow-y-auto' 
          : 'p-3 sm:p-6 overflow-auto'
      }`}>
        <div className={`${
          (session.gameType === GameType.OFFICE_LIFE || session.gameType === GameType.CYBER_ARENA) && session.status !== SessionStatus.LOBBY 
            ? 'relative flex flex-col min-h-full' 
            : 'max-w-5xl mx-auto space-y-4 sm:space-y-6'
        }`}>
          {activeSheet === 'GAME' ? (
            <>
              {session.status === SessionStatus.LOBBY && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 excel-grid rounded overflow-hidden shadow-sm">
                <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#666]">참가자_데이터_그리드</span>
                    {isAdminMode && (
                      <div className="flex items-center gap-1">
                        <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold animate-pulse">ADMIN SIMULATION MODE</span>
                        <button 
                          onClick={() => {
                            setIsAdminMode(false);
                            setError('어드민 모드가 해제되었습니다.');
                            setTimeout(() => setError(null), 3000);
                          }}
                          className="text-[8px] bg-gray-200 text-gray-600 px-1 rounded hover:bg-gray-300 transition-colors font-bold"
                        >
                          OFF
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isAdminMode && isHost && (
                      <button 
                        onClick={async () => {
                          // Add 3 AI bots and start game
                          await sessionService.addAIPlayer(session.id);
                          await sessionService.addAIPlayer(session.id);
                          await sessionService.addAIPlayer(session.id);
                          setTimeout(() => handleStartGame(), 1000);
                        }}
                        className="text-[10px] bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors flex items-center gap-1"
                      >
                        <Zap size={10} /> 퀵 시뮬레이션
                      </button>
                    )}
                    {isHost && (
                      <button 
                        onClick={() => sessionService.addAIPlayer(session.id)}
                        className="text-[10px] text-[#217346] hover:underline flex items-center gap-1"
                      >
                        <Play size={10} /> AI 봇 추가
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                  <table className="excel-grid min-w-[600px] md:min-w-full">
                    <thead>
                      <tr>
                        <th className="w-8"></th>
                        <th className="text-left pl-4">사용자_이름</th>
                        <th className="w-24">상태</th>
                        <th className="w-20">권한</th>
                        {isHost && <th className="w-16 text-center">순서</th>}
                        {isHost && <th className="w-16 text-center">관리</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {getSortedPlayers().map((player, idx) => (
                        <tr key={player.id} className="hover:bg-[#f1f8f5]">
                          <td className="bg-[#f8f9fa] border-r border-b border-[#d1d1d1] text-[9px] font-bold text-[#999] text-center">{idx + 1}</td>
                          <td className={`excel-cell ${player.id === currentUser?.uid ? 'bg-[#e8f0fe] font-bold' : ''}`}>
                            <div className="flex items-center gap-2">
                              {player.nickname}
                              {player.isHost && <Shield size={10} className="text-[#217346]" />}
                            </div>
                          </td>
                          <td className="excel-cell text-center">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full ${player.isReady ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {player.isReady ? '준비됨' : '대기중'}
                            </span>
                          </td>
                          <td className="excel-cell text-center text-[9px] text-[#999]">
                            {player.isHost ? '관리자' : '사용자'}
                          </td>
                          {isHost && (
                            <td className="excel-cell text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button 
                                  onClick={() => handleMovePlayer(idx, 'up')}
                                  disabled={idx === 0}
                                  className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30 text-[#666]"
                                  title="위로 이동"
                                >
                                  <ArrowUp size={12} />
                                </button>
                                <button 
                                  onClick={() => handleMovePlayer(idx, 'down')}
                                  disabled={idx === getSortedPlayers().length - 1}
                                  className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30 text-[#666]"
                                  title="아래로 이동"
                                >
                                  <ArrowDown size={12} />
                                </button>
                              </div>
                            </td>
                          )}
                          {isHost && (
                            <td className="excel-cell text-center">
                              {!player.isHost && (
                                <button 
                                  onClick={() => {
                                    if (confirm(`${player.nickname}님을 강퇴하시겠습니까?`)) {
                                      sessionService.kickPlayer(session.id, player.id);
                                    }
                                  }}
                                  className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                                  title="강퇴"
                                >
                                  <LogOut size={12} />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-[#d1d1d1] p-4 rounded shadow-sm space-y-4">
                  <h3 className="text-[10px] font-bold text-[#666] border-b border-[#d1d1d1] pb-2 uppercase">초대_정보</h3>
                  <div className="space-y-2">
                    <p className="text-[10px] text-[#999]">동료들을 감사 세션에 초대하세요.</p>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-[#f8f9fa] border border-[#d1d1d1] px-2 py-1 text-[10px] font-mono truncate">
                        {session.id}
                      </div>
                      <button 
                        onClick={handleCopyLink}
                        className="office-btn px-3 py-1 text-[10px] flex items-center gap-1"
                      >
                        {copied ? <CheckCircle2 size={10} /> : <Share2 size={10} />}
                        {copied ? '복사됨' : '링크_복사'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#d1d1d1] p-4 rounded shadow-sm space-y-4">
                  <h3 className="text-[10px] font-bold text-[#666] border-b border-[#d1d1d1] pb-2 uppercase">세션_제어</h3>
                  
                  {isHost ? (
                    <div className="space-y-4">
                      {session.gameType === GameType.LIAR && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#999]">시트_모드</label>
                            <select 
                              className="office-input text-xs"
                              value={session.settings.liarMode}
                              onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, liarMode: e.target.value })}
                            >
                              <option value={LiarMode.BASIC}>기본 (라이어 1명)</option>
                              <option value={LiarMode.FOOL}>바보 (라이어 다른 단어)</option>
                              <option value={LiarMode.SPY}>스파이 (스파이 포함)</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#999]">카테고리</label>
                            <select 
                              className="office-input text-xs"
                              value={session.settings.liarCategory}
                              onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, liarCategory: e.target.value })}
                            >
                              <option value="랜덤">랜덤</option>
                              {LIAR_TOPICS.map((t, idx) => <option key={`${t.category}-${idx}`} value={t.category}>{t.category}</option>)}
                            </select>
                          </div>
                        </div>
                      )}

                      {session.gameType === GameType.MAFIA && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#999]">마피아</label>
                              <input 
                                type="number" 
                                min="1" 
                                max="5"
                                className="office-input text-xs text-center"
                                value={session.settings.mafiaCount ?? 1}
                                onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, mafiaCount: parseInt(e.target.value) || 1 })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#999]">의사</label>
                              <input 
                                type="number" 
                                min="0" 
                                max="2"
                                className="office-input text-xs text-center"
                                value={session.settings.doctorCount ?? 1}
                                onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, doctorCount: parseInt(e.target.value) || 0 })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#999]">경찰</label>
                              <input 
                                type="number" 
                                min="0" 
                                max="2"
                                className="office-input text-xs text-center"
                                value={session.settings.policeCount ?? 1}
                                onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, policeCount: parseInt(e.target.value) || 0 })}
                              />
                            </div>
                          </div>
                          <div className="text-[10px] text-[#666] bg-[#f8f9fa] p-2 rounded border border-[#d1d1d1]">
                            <div className="flex justify-between">
                              <span>총 인원:</span>
                              <span className="font-bold">{(Object.values(session?.players || {}) as Player[]).length}명</span>
                            </div>
                            <div className="flex justify-between">
                              <span>특수직:</span>
                              <span className="font-bold">{(session.settings.mafiaCount ?? 1) + (session.settings.doctorCount ?? 1) + (session.settings.policeCount ?? 1)}명</span>
                            </div>
                            <div className="flex justify-between border-t border-[#d1d1d1] mt-1 pt-1">
                              <span>시민:</span>
                              <span className="font-bold text-[#217346]">
                                {Math.max(0, (Object.values(session?.players || {}) as Player[]).length - ((session.settings.mafiaCount ?? 1) + (session.settings.doctorCount ?? 1) + (session.settings.policeCount ?? 1)))}명
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {session.gameType === GameType.OFFICE_LIFE && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-[#d1d1d1]">
                            <div className="flex items-center gap-2">
                              <Users size={16} className="text-[#217346]" />
                              <span className="text-xs font-bold">게임 모드</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => sessionService.updateSettings(session.id, { officeLifeMode: 'INDIVIDUAL' })}
                                className={`px-3 py-1 rounded text-[10px] font-bold border ${session.settings.officeLifeMode !== 'TEAM' ? 'bg-[#217346] text-white border-[#217346]' : 'bg-white text-gray-600 border-gray-300'}`}
                              >
                                개인전
                              </button>
                              <button
                                onClick={() => sessionService.updateSettings(session.id, { officeLifeMode: 'TEAM' })}
                                className={`px-3 py-1 rounded text-[10px] font-bold border ${session.settings.officeLifeMode === 'TEAM' ? 'bg-[#217346] text-white border-[#217346]' : 'bg-white text-gray-600 border-gray-300'}`}
                              >
                                팀전
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {session.gameType === GameType.ESCAPE_ROOM && (
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#999]">테마 선택</label>
                            <select 
                              className="office-input text-xs"
                              value={session.settings.escapeRoomThemeId || 'universe_escape'}
                              onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, escapeRoomThemeId: e.target.value })}
                            >
                              {Object.values(ESCAPE_ROOM_THEMES).map(theme => (
                                <option key={theme.id} value={theme.id}>
                                  [{theme.genre}] {theme.name} ({theme.difficulty})
                                </option>
                              ))}
                            </select>
                            <p className="text-[8px] text-gray-500 mt-1">
                              {ESCAPE_ROOM_THEMES[session.settings.escapeRoomThemeId || 'universe_escape']?.description}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#999]">난이도 (시간 제한)</label>
                            <select 
                              className="office-input text-xs"
                              value={session.settings.escapeRoomDifficulty || 'NORMAL'}
                              onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, escapeRoomDifficulty: e.target.value })}
                            >
                              <option value="EASY">쉬움 (15분)</option>
                              <option value="NORMAL">보통 (10분)</option>
                              <option value="HARD">어려움 (5분)</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {session.gameType === GameType.CYBER_ARENA && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded border border-[#d1d1d1]">
                            <div className="flex items-center gap-2">
                              <Users size={16} className="text-[#217346]" />
                              <span className="text-xs font-bold">대전 모드</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => sessionService.updateSettings(session.id, { cyberArenaPvE: true })}
                                className={`px-3 py-1 rounded text-[10px] font-bold border ${session.settings.cyberArenaPvE ? 'bg-[#217346] text-white border-[#217346]' : 'bg-white text-gray-600 border-gray-300'}`}
                              >
                                vs AI
                              </button>
                              <button
                                onClick={() => sessionService.updateSettings(session.id, { cyberArenaPvE: false })}
                                className={`px-3 py-1 rounded text-[10px] font-bold border ${!session.settings.cyberArenaPvE ? 'bg-[#217346] text-white border-[#217346]' : 'bg-white text-gray-600 border-gray-300'}`}
                              >
                                vs Player
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      {session.settings.officeLifeMode === 'TEAM' && (
                            <div className="p-3 bg-blue-50 rounded border border-blue-100">
                              <p className="text-[10px] font-bold text-blue-800 mb-2">팀 배정 (클릭하여 변경)</p>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.values(session?.players || {}).map(pObj => {
                                  const p = pObj as Player;
                                  return (
                                    <div key={p.id} className="flex items-center justify-between p-2 bg-white rounded border border-blue-200">
                                      <span className="text-[10px] font-medium truncate max-w-[60px]">{p.nickname}</span>
                                      <button
                                        onClick={() => {
                                          if (p.id === currentUser.uid) {
                                            const nextTeam = p.teamId === 'TEAM_B' ? 'TEAM_A' : 'TEAM_B';
                                            sessionService.setPlayerTeam(session.id, p.id, nextTeam);
                                          }
                                        }}
                                        disabled={p.id !== currentUser.uid}
                                        className={`px-2 py-0.5 rounded text-[8px] font-bold ${p.teamId === 'TEAM_B' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'}`}
                                      >
                                        {p.teamId === 'TEAM_B' ? 'B팀' : 'A팀'}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                      {session.gameType === GameType.OMOK && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-[#d1d1d1]">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${isOmokAIMatch ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                              <span className="text-[10px] font-bold text-[#666]">AI 대전 모드</span>
                            </div>
                            <button 
                              onClick={() => setIsOmokAIMatch(!isOmokAIMatch)}
                              className={`text-[9px] px-2 py-1 rounded font-bold transition-all ${isOmokAIMatch ? 'bg-[#217346] text-white' : 'bg-white border border-[#d1d1d1] text-[#666]'}`}
                            >
                              {isOmokAIMatch ? 'ON' : 'OFF'}
                            </button>
                          </div>

                          {isOmokAIMatch && (
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#999]">AI 난이도 (직급)</label>
                              <select 
                                className="office-input text-xs"
                                value={omokDifficulty}
                                onChange={(e) => setOmokDifficulty(parseInt(e.target.value))}
                              >
                                <option value={1}>Lv.1 인턴 (랜덤)</option>
                                <option value={2}>Lv.2 사원 (기초)</option>
                                <option value={3}>Lv.3 주임 (보통)</option>
                                <option value={4}>Lv.4 대리 (숙련)</option>
                                <option value={5}>Lv.5 과장 (전문)</option>
                                <option value={6}>Lv.6 차장 (고수)</option>
                                <option value={7}>Lv.7 부장 (마스터)</option>
                              </select>
                            </div>
                          )}

                          <div className="flex gap-2">
                            <div className="flex-1 space-y-1">
                              <label className="text-[9px] font-bold text-[#999]">흑돌 (선공)</label>
                              <select 
                                className="office-input text-xs"
                                value={omokBlackId}
                                onChange={(e) => setOmokBlackId(e.target.value)}
                              >
                                <option value="">선택하세요</option>
                                {isOmokAIMatch && <option value="AI">AI 봇</option>}
                                {getSortedPlayers().map(p => (
                                  <option key={p.id} value={p.id} disabled={p.id === omokWhiteId}>{p.nickname}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex-1 space-y-1">
                              <label className="text-[9px] font-bold text-[#999]">백돌 (후공)</label>
                              <select 
                                className="office-input text-xs"
                                value={omokWhiteId}
                                onChange={(e) => setOmokWhiteId(e.target.value)}
                              >
                                <option value="">선택하세요</option>
                                {isOmokAIMatch && <option value="AI">AI 봇</option>}
                                {getSortedPlayers().map(p => (
                                  <option key={p.id} value={p.id} disabled={p.id === omokBlackId}>{p.nickname}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          
                          <div className="pt-2 border-t border-[#d1d1d1] mt-2">
                            <button 
                              onClick={() => {
                                if (!omokBlackId || !omokWhiteId) {
                                  setError('플레이어를 선택해주세요.');
                                  return;
                                }
                                if (omokBlackId === 'AI' && omokWhiteId === 'AI') {
                                  setError('두 플레이어 모두 AI일 수는 없습니다.');
                                  return;
                                }
                                sessionService.startOmokGame(session.id, omokBlackId, omokWhiteId, isOmokAIMatch, omokDifficulty);
                              }}
                              className="w-full office-btn-primary py-2 text-[10px] font-bold flex items-center justify-center gap-2"
                            >
                              <Play size={14} />
                              <span>오목 대전 시작</span>
                            </button>
                          </div>

                          <p className="text-[10px] text-[#999]">
                            * 오목은 두 명의 플레이어가 진행합니다.
                          </p>
                        </div>
                      )}

                      {session.gameType === GameType.BINGO && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#999]">빙고 줄 수</label>
                            <input 
                              type="number" 
                              min="1" 
                              max="12"
                              className="office-input text-xs text-center"
                              value={bingoLinesInput}
                              onChange={(e) => {
                                setBingoLinesInput(e.target.value);
                                const val = parseInt(e.target.value);
                                if (!isNaN(val) && val > 0) {
                                  sessionService.updateSettings(session.id, { ...session.settings, bingoLines: val });
                                }
                              }}
                              onBlur={() => {
                                if (bingoLinesInput === '' || isNaN(parseInt(bingoLinesInput))) {
                                  setBingoLinesInput('3');
                                  sessionService.updateSettings(session.id, { ...session.settings, bingoLines: 3 });
                                }
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#999]">카테고리</label>
                            <select 
                              className="office-input text-xs"
                              value={session.settings.bingoCategory || '랜덤'}
                              onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, bingoCategory: e.target.value })}
                            >
                              <option value="랜덤">랜덤</option>
                              {BINGO_TOPICS.map((t, idx) => <option key={`${t.category}-${idx}`} value={t.category}>{t.category}</option>)}
                            </select>
                          </div>
                        </div>
                      )}

                      {session.gameType === GameType.DRAW && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#999]">라운드 수</label>
                              <input 
                                type="number" 
                                min="1" 
                                max="10"
                                className="office-input text-xs text-center"
                                value={session.settings.drawRounds || 3}
                                onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, drawRounds: parseInt(e.target.value) || 3 })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#999]">제한 시간(초)</label>
                              <input 
                                type="number" 
                                min="30" 
                                max="180"
                                className="office-input text-xs text-center"
                                value={session.settings.drawTime || 60}
                                onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, drawTime: parseInt(e.target.value) || 60 })}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#999]">카테고리</label>
                            <select 
                              className="office-input text-xs"
                              value={session.settings.drawCategory || '랜덤'}
                              onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, drawCategory: e.target.value })}
                            >
                              <option value="랜덤">랜덤</option>
                              {DRAW_TOPICS.map((t, idx) => <option key={`${t.category}-${idx}`} value={t.category}>{t.category}</option>)}
                            </select>
                          </div>
                        </div>
                      )}

                      {session.gameType === GameType.MINESWEEPER && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#999]">난이도</label>
                            <select 
                              className="office-input text-xs"
                              value={session.settings.minesweeperDifficulty || 'EASY'}
                              onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, minesweeperDifficulty: e.target.value })}
                            >
                              <option value="EASY">쉬움 (9x9, 지뢰 10개)</option>
                              <option value="MEDIUM">보통 (16x16, 지뢰 40개)</option>
                              <option value="HARD">어려움 (16x30, 지뢰 99개)</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {session.gameType === GameType.SUDOKU && (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#999]">난이도</label>
                            <select 
                              className="office-input text-xs"
                              value={session.settings.sudokuDifficulty || 'EASY'}
                              onChange={(e) => sessionService.updateSettings(session.id, { ...session.settings, sudokuDifficulty: e.target.value })}
                            >
                              <option value="EASY">쉬움</option>
                              <option value="MEDIUM">보통</option>
                              <option value="HARD">어려움</option>
                            </select>
                          </div>
                        </div>
                      )}

                    <button 
                        onClick={() => sessionService.shuffleTurnOrder(session.id, session.players)}
                        className="office-btn w-full py-2 flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={14} />
                        <span>참가자 순서 섞기</span>
                      </button>
                      <button 
                        onClick={handleStartGame} 
                        disabled={loading}
                        className="office-btn-primary w-full py-2 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="animate-spin" size={14} />
                            <span>보고서 생성 중...</span>
                          </>
                        ) : (
                          <span>세션_실행</span>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 text-center">
                      <p className="text-[10px] text-[#666]">관리자가 시작하기를 기다리는 중...</p>
                      <button 
                        onClick={handleToggleReady}
                        className={`w-full py-2 ${me?.isReady ? 'office-btn' : 'office-btn-primary'}`}
                      >
                        {me?.isReady ? '준비_취소' : '준비_완료'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {session.status === SessionStatus.REVEAL && (
            <div className="max-w-md mx-auto">
              <div className="bg-white border-2 border-[#217346] rounded shadow-xl overflow-hidden">
                <div className="bg-[#217346] text-white px-4 py-2 text-[10px] font-bold">
                  기밀_데이터_확인
                </div>
                <div className="p-10 text-center space-y-8">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#999] uppercase tracking-widest">배정된 역할</span>
                    <div className="text-4xl font-black text-[#217346]">
                      {session.gameType === GameType.LIAR ? (
                        session.liarGame?.mode === LiarMode.FOOL && session.liarGame?.liarPlayerId === currentUser?.uid ? '시민' : (
                          session.liarGame?.liarPlayerId === currentUser?.uid ? '라이어' : 
                          session.liarGame?.spyPlayerId === currentUser?.uid ? '스파이' : '시민'
                        )
                      ) : (
                        me?.role === 'MAFIA' ? '마피아' : 
                        me?.role === 'DOCTOR' ? '의사' :
                        me?.role === 'POLICE' ? '경찰' : '시민'
                      )}
                    </div>
                  </div>

                  <div className="bg-[#f8f9fa] border border-[#d1d1d1] p-6 inline-block min-w-[200px] rounded">
                    <span className="text-[10px] font-bold text-[#999] uppercase mb-2 block">
                      {session.gameType === GameType.LIAR ? `카테고리: ${session.liarGame?.category}` : '목표 키워드'}
                    </span>
                    <div className="text-2xl font-bold text-[#333]">
                      {session.gameType === GameType.LIAR ? (
                        session.liarGame?.liarPlayerId === currentUser?.uid ? (
                          session.liarGame.mode === LiarMode.FOOL ? session.liarGame.liarWord : '???'
                        ) : session.liarGame?.commonWord
                      ) : '해당 없음'}
                    </div>
                  </div>

                  {me?.hasConfirmedRole ? (
                    <div className="p-4 bg-gray-100 rounded text-center">
                      <div className="animate-pulse text-sm font-bold text-gray-500">다른 플레이어 대기 중...</div>
                      <div className="text-[10px] text-gray-400 mt-1">
                        {(Object.values(session?.players || {}) as Player[]).filter(p => p.hasConfirmedRole).length} / {(Object.values(session?.players || {}) as Player[]).length} 명 확인 완료
                      </div>
                      {isHost && (
                        <button 
                          onClick={() => {
                            if (session.gameType === GameType.MAFIA) {
                              sessionService.startNightPhase(session.id, session.players);
                            } else {
                              sessionService.advanceStatus(session.id, SessionStatus.PLAYING);
                            }
                          }}
                          className="mt-4 text-xs text-red-500 underline hover:text-red-700"
                        >
                          강제 시작 (모든 플레이어 확인 무시)
                        </button>
                      )}
                    </div>
                  ) : (
                    <button 
                      onClick={() => sessionService.confirmRole(session.id, currentUser.uid)}
                      className="office-btn-primary w-full py-3"
                    >
                      데이터_확인_완료
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {session.status === SessionStatus.PREPARING && session.gameType === GameType.BINGO && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white border border-[#d1d1d1] rounded shadow-lg overflow-hidden">
                <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-[#666]">빙고_시트_작성</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => {
                        const category = session.bingoGame?.category || '랜덤';
                        let words: string[] = [];
                        if (category === '랜덤') {
                          words = Array.from(new Set(BINGO_TOPICS.flatMap(t => t.words)));
                        } else {
                          words = Array.from(new Set(BINGO_TOPICS.find(t => t.category === category)?.words || []));
                        }
                        const shuffled = [...words].sort(() => 0.5 - Math.random());
                        const newBoard = Array(5).fill(null).map((_, r) => 
                          Array(5).fill(null).map((_, c) => shuffled[r * 5 + c] || '')
                        );
                        setBingoBoard(newBoard);
                      }}
                      className="text-[10px] text-[#217346] hover:underline flex items-center gap-1"
                    >
                      <RefreshCw size={10} /> 자동 채우기
                    </button>
                  </div>
                </div>
                
                <div className="p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="grid grid-cols-5 gap-0.5 md:gap-1 bg-[#d1d1d1] p-0.5 md:p-1 border border-[#d1d1d1]">
                      {bingoBoard.map((row, r) => (
                        row.map((cell, c) => (
                          <input
                            key={`${r}-${c}`}
                            type="text"
                            value={cell}
                            onChange={(e) => {
                              const newBoard = [...bingoBoard.map(row => [...row])];
                              newBoard[r][c] = e.target.value;
                              setBingoBoard(newBoard);
                            }}
                            disabled={bingoSubmitted}
                            className="w-full aspect-square text-center text-xs p-1 focus:outline-none focus:bg-[#e8f0fe] border border-transparent focus:border-[#217346]"
                            placeholder="..."
                          />
                        ))
                      ))}
                    </div>
                  </div>

                  <div className="w-full md:w-64 space-y-4">
                    <div className="bg-[#f8f9fa] border border-[#d1d1d1] rounded p-3 h-full flex flex-col">
                      <div className="flex justify-between items-center mb-2 shrink-0">
                        <h4 className="text-[9px] font-bold text-[#999] uppercase flex items-center gap-1">
                          <ListOrdered size={10} />
                          추천 단어 ({session.bingoGame?.category || '랜덤'})
                        </h4>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2 max-h-[300px] content-start pr-1">
                        {(session.bingoGame?.category === '랜덤' 
                          ? Array.from(new Set(BINGO_TOPICS.flatMap(t => t.words)))
                          : Array.from(new Set(BINGO_TOPICS.find(t => t.category === session.bingoGame?.category)?.words || []))
                        ).map((word, idx) => (
                          <button
                            key={`${word}-${idx}`}
                            onClick={() => {
                              if (bingoSubmitted) return;
                              // Find first empty cell
                              const newBoard = [...bingoBoard.map(row => [...row])];
                              let found = false;
                              for (let r = 0; r < 5; r++) {
                                for (let c = 0; c < 5; c++) {
                                  if (!newBoard[r][c]) {
                                    newBoard[r][c] = word;
                                    found = true;
                                    break;
                                  }
                                }
                                if (found) break;
                              }
                              if (found) setBingoBoard(newBoard);
                            }}
                            className="text-[10px] p-2 bg-white border border-[#d1d1d1] hover:bg-[#e8f0fe] hover:border-[#217346] hover:text-[#217346] text-left rounded transition-colors flex items-center h-8"
                            title="클릭하여 빈 칸에 추가"
                          >
                            <span className="truncate w-full">{word}</span>
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 text-[9px] text-[#999] text-center shrink-0">
                        단어를 클릭하면 빈 칸에 자동으로 채워집니다.
                      </div>
                    </div>
                  </div>
                </div>
                  
                  <div className="mt-6 flex flex-col items-center gap-4">
                    {bingoSubmitted ? (
                      <div className="text-center">
                        <div className="animate-pulse text-sm font-bold text-[#217346]">시트 제출 완료! 다른 플레이어 대기 중...</div>
                        <div className="text-[10px] text-gray-400 mt-1">
                          {Object.keys(session.bingoGame?.boards || {}).length} / {Object.keys(session?.players || {}).length} 명 완료
                        </div>
                        {isHost && (
                          <button 
                            onClick={() => sessionService.startBingoGame(session.id, session.players, session.turnOrder || Object.keys(session?.players || {}))}
                            className="mt-4 text-xs text-red-500 underline hover:text-red-700"
                          >
                            강제 시작 (미제출자 무시)
                          </button>
                        )}
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          const flatBoard = bingoBoard.flat().filter(cell => cell.trim() !== '');
                          const uniqueWords = new Set(flatBoard);
                          
                          if (flatBoard.length !== uniqueWords.size) {
                            setError('중복된 단어가 있습니다. 모든 칸을 서로 다른 단어로 채워주세요.');
                            return;
                          }

                          const isComplete = bingoBoard.every(row => row.every(cell => cell.trim() !== ''));
                          if (!isComplete && !window.confirm('빈 칸이 있습니다. 그대로 제출하시겠습니까?')) return;
                          sessionService.submitBingoBoard(session.id, currentUser.uid, bingoBoard, Object.keys(session?.players || {}).length);
                          setBingoSubmitted(true);
                        }}
                        className="office-btn-primary px-12 py-2"
                      >
                        시트_제출
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

          {session.status === SessionStatus.PLAYING && (
            session.gameType === GameType.OMOK ? (
              <div className="max-w-xl mx-auto space-y-6">
                <div className="bg-white border border-[#d1d1d1] rounded shadow-lg overflow-hidden">
                  <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 flex flex-col sm:flex-row justify-between items-center gap-2">
                    <span className="text-[10px] font-bold text-[#666]">오목_대전_보드</span>
                    <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3 text-xs">
                      {userProfile?.department === Department.DEV && session.omokGame?.currentPlayerId === currentUser.uid && (
                        <button 
                          onClick={async () => {
                            if (!session.omokGame) return;
                            const isBlack = session.omokGame.currentPlayerId === session.omokGame.blackPlayerId;
                            const hint = await sessionService.getOmokBestMove(
                              session.omokGame.board, 
                              isBlack ? 1 : 2, 
                              isBlack ? 2 : 1,
                              3
                            );
                            setOmokHint(hint);
                            setTimeout(() => setOmokHint(null), 3000);
                          }}
                          className="text-[10px] bg-[#217346] text-white px-2 py-1 rounded hover:bg-[#1a5c38] transition-colors flex items-center gap-1"
                        >
                          <HelpCircle size={10} /> AI 힌트
                        </button>
                      )}
                      {/* Black Player Indicator */}
                      <div 
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border-2 ${String(session.omokGame?.currentPlayerId) === String(session.omokGame?.blackPlayerId) ? 'border-black shadow-lg scale-105' : 'border-transparent opacity-60'}`}
                        style={{ 
                          backgroundColor: '#222222',
                          color: '#ffffff',
                          filter: 'none',
                          colorScheme: 'light'
                        }}
                      >
                        <div className="w-3 h-3 rounded-full bg-black border border-white/40 shadow-inner" style={{ filter: 'none' }}></div>
                        <span className="font-bold whitespace-nowrap">
                          {session.omokGame!.blackPlayerId === 'AI' ? 'AI 봇' : session.players?.[session.omokGame!.blackPlayerId]?.nickname}
                        </span>
                        {String(session.omokGame!.blackPlayerId) === String(currentUser.uid) && <span className="text-[8px] opacity-70">(나)</span>}
                        {String(session.omokGame?.currentPlayerId) === String(session.omokGame?.blackPlayerId) && (
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse ml-1"></div>
                        )}
                      </div>
                      
                      <div className="text-gray-400 font-black italic">VS</div>
                      
                      {/* White Player Indicator */}
                      <div 
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border-2 ${String(session.omokGame?.currentPlayerId) === String(session.omokGame?.whitePlayerId) ? 'border-gray-400 shadow-lg scale-105' : 'border-transparent opacity-60'}`}
                        style={{ 
                          backgroundColor: '#ffffff',
                          color: '#333333',
                          filter: 'none',
                          colorScheme: 'light'
                        }}
                      >
                        <div className="w-3 h-3 rounded-full bg-white border border-gray-300 shadow-sm" style={{ filter: 'none' }}></div>
                        <span className="font-bold whitespace-nowrap">
                          {session.omokGame!.whitePlayerId === 'AI' ? 'AI 봇' : session.players?.[session.omokGame!.whitePlayerId]?.nickname}
                        </span>
                        {String(session.omokGame!.whitePlayerId) === String(currentUser.uid) && <span className="text-[8px] opacity-70">(나)</span>}
                        {String(session.omokGame?.currentPlayerId) === String(session.omokGame?.whitePlayerId) && (
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-1"></div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 md:p-8 flex justify-center bg-white" style={{ filter: 'none', colorScheme: 'light' }}>
                    <div 
                      className="bg-[#dcb35c] border-[3px] border-[#5d4037] shadow-2xl rounded-sm relative"
                      style={{ 
                        width: 'min(100%, 500px)', 
                        aspectRatio: '1/1', 
                        filter: 'none', 
                        colorScheme: 'light',
                        padding: '3.33%' // Margin around the grid
                      }}
                    >
                      {/* Grid Lines Layer */}
                      <div className="absolute inset-0 pointer-events-none z-0" style={{ filter: 'none', padding: '3.33%' }}>
                        <div className="relative w-full h-full">
                          {/* Horizontal lines */}
                          {Array.from({ length: 15 }).map((_, i) => (
                            <div 
                              key={`h-${i}`} 
                              className="absolute w-full h-[1.5px] bg-[#3e2723]/80" 
                              style={{ top: `${(i / 14) * 100}%`, transform: 'translateY(-50%)' }} 
                            />
                          ))}
                          {/* Vertical lines */}
                          {Array.from({ length: 15 }).map((_, i) => (
                            <div 
                              key={`v-${i}`} 
                              className="absolute h-full w-[1.5px] bg-[#3e2723]/80" 
                              style={{ left: `${(i / 14) * 100}%`, transform: 'translateX(-50%)' }} 
                            />
                          ))}
                          
                          {/* Star points (Hwajeom) */}
                          {[3, 7, 11].map(ty => [3, 7, 11].map(tx => (
                            <div 
                              key={`star-${tx}-${ty}`}
                              className="absolute w-2 h-2 bg-[#3e2723] rounded-full"
                              style={{ 
                                left: `${(tx / 14) * 100}%`, 
                                top: `${(ty / 14) * 100}%`,
                                transform: 'translate(-50%, -50%)'
                              }}
                            />
                          )))}
                        </div>
                      </div>

                      {/* Interaction & Stones Layer */}
                      <div className="absolute inset-0 z-10 grid grid-cols-[repeat(15,minmax(0,1fr))] grid-rows-[repeat(15,minmax(0,1fr))]" style={{ padding: '0%' }}>
                        {Array.from({ length: 15 }).map((_, y) => (
                          Array.from({ length: 15 }).map((_, x) => {
                            const row = session.omokGame?.board ? (Array.isArray(session.omokGame.board) ? session.omokGame.board[y] : (session.omokGame.board as any)[y]) : null;
                            const cell = row ? (Array.isArray(row) ? row[x] : (row as any)[x]) : 0;
                            const stoneValue = parseInt(String(cell)) || 0;
                            const isWinningStone = session.omokGame?.winningLine?.some(pos => pos.x === x && pos.y === y);
                            
                            return (
                              <div 
                                key={`${x}-${y}`} 
                                onClick={() => {
                                  if (session.omokGame?.currentPlayerId === currentUser.uid && stoneValue === 0) {
                                    sessionService.placeOmokStone(session.id, currentUser.uid, x, y);
                                  }
                                }}
                                className={`relative flex items-center justify-center cursor-pointer hover:bg-black/5 transition-colors ${isWinningStone ? 'bg-yellow-400/20' : ''}`}
                              >
                                {/* Hint Indicator */}
                                {omokHint?.x === x && omokHint?.y === y && (
                                  <div className="absolute inset-0 bg-green-400/30 animate-pulse z-10 rounded-full" />
                                )}
                                {/* Stone */}
                                {stoneValue > 0 && (
                                  <div className="w-[90%] h-[90%] z-20 relative flex items-center justify-center pointer-events-none" style={{ filter: 'none', colorScheme: 'light' }}>
                                    <svg width="100%" height="100%" viewBox="0 0 100 100" className="drop-shadow-md" style={{ filter: 'none' }}>
                                      <circle 
                                        cx="50" cy="50" r="46" 
                                        fill={String(stoneValue) === '1' ? "#000000" : "#ffffff"} 
                                        stroke={String(stoneValue) === '1' ? "#000000" : "#cccccc"} 
                                        strokeWidth="1"
                                        style={{ 
                                          filter: 'none',
                                          fill: String(stoneValue) === '1' ? '#000000' : '#ffffff',
                                          stroke: String(stoneValue) === '1' ? '#000000' : '#cccccc'
                                        }}
                                      />
                                      {/* Subtle shine for stones */}
                                      <circle 
                                        cx="35" cy="35" r="15" 
                                        fill="white" 
                                        fillOpacity={String(stoneValue) === '1' ? "0.15" : "0.5"} 
                                        style={{ filter: 'none' }}
                                      />
                                      
                                      {session.omokGame?.lastMove?.x === x && session.omokGame?.lastMove?.y === y && (
                                        <circle cx="50" cy="50" r="10" fill="#ff4444" className="animate-pulse" style={{ filter: 'none' }} />
                                      )}
                                    </svg>
                                    {isWinningStone && (
                                      <div className="absolute inset-0 rounded-full ring-4 ring-yellow-400 animate-pulse z-30" />
                                    )}
                                  </div>
                                )}
                                
                                {/* Hover preview */}
                                {stoneValue === 0 && session.omokGame?.currentPlayerId === currentUser.uid && (
                                  <div className="absolute w-[40%] h-[40%] rounded-full opacity-0 hover:opacity-30 transition-opacity z-20 bg-black/20" />
                                )}
                              </div>
                            );
                          })
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#f8f9fa] border-t border-[#d1d1d1] px-4 py-3 text-center text-xs">
                    {session.omokGame?.currentPlayerId === currentUser.uid ? (
                      <div className="flex items-center justify-center gap-2 text-[#217346] font-bold animate-pulse">
                        <Play size={12} fill="currentColor" />
                        <span>당신의 차례입니다! 돌을 놓을 위치를 선택하세요.</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-[#666]">
                        {session.omokGame?.blackPlayerId === currentUser.uid || session.omokGame?.whitePlayerId === currentUser.uid ? (
                          <>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                            <span>상대방의 수를 기다리는 중입니다...</span>
                          </>
                        ) : (
                          <span className="font-medium text-gray-500">현재 관전 중입니다.</span>
                        )}
                      </div>
                    )}
                    <div className="mt-2 text-[10px] text-gray-400">
                      * 흑돌은 3-3, 4-4, 6목(장목) 금지 (공식 룰 적용) / 백돌은 제한 없음
                    </div>
                  </div>
                </div>

                {/* Spectator List */}
                <div className="bg-white border border-[#d1d1d1] rounded shadow-sm p-4">
                  <h3 className="text-[10px] font-bold text-[#666] mb-2 uppercase">관전 중인 플레이어</h3>
                  <div className="flex flex-wrap gap-2">
                    {(Object.values(session?.players || {}) as Player[]).filter(p => p.id !== session.omokGame?.blackPlayerId && p.id !== session.omokGame?.whitePlayerId).map(p => (
                      <div key={p.id} className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600 flex items-center gap-1">
                        <User size={10} />
                        {p.nickname}
                      </div>
                    ))}
                    {(Object.values(session?.players || {}) as Player[]).filter(p => p.id !== session.omokGame?.blackPlayerId && p.id !== session.omokGame?.whitePlayerId).length === 0 && (
                      <span className="text-xs text-gray-400">관전자가 없습니다.</span>
                    )}
                  </div>
                </div>
              </div>
            ) : session.gameType === GameType.BINGO ? (
              !session.bingoGame ? (
                <div className="flex flex-col items-center justify-center p-10">
                  <RefreshCw className="animate-spin text-[#217346] mb-4" size={32} />
                  <p className="text-sm text-gray-500">빙고 시트 데이터를 불러오는 중입니다...</p>
                </div>
              ) : (
                <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white border border-[#d1d1d1] rounded shadow-lg overflow-hidden">
                  <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#666]">빙고_감사_진행</span>
                    <div className="flex items-center gap-3">
                      <div className="text-[10px] text-[#666]">목표: <span className="font-bold text-[#217346]">{session.bingoGame?.targetLines}줄</span></div>
                      <div className="h-3 w-px bg-[#d1d1d1]" />
                      <div className="text-[10px] text-[#666]">현재: <span className="font-bold text-[#217346]">{session.bingoGame?.boards[currentUser.uid] ? sessionService.countBingoLines(session.bingoGame.boards[currentUser.uid], session.bingoGame.markedWords || []) : 0}줄</span></div>
                    </div>
                  </div>

                  <div className="p-8 md:p-12 flex flex-col md:flex-row gap-12">
                    {/* My Board (or Spectated Board) */}
                    <div className="flex-1 space-y-4">
                      <h3 className="text-[10px] font-bold text-[#999] uppercase tracking-wider">
                        {session.bingoGame?.boards?.[currentUser.uid] ? '나의 감사 시트' : `${session.players?.[session.bingoGame?.currentPlayerId || '']?.nickname || '플레이어'}의 시트 (관전)`}
                      </h3>

                      {/* Current Turn Indicator */}
                      <div className={`p-3 rounded-lg border flex items-center justify-between shadow-sm transition-all ${
                        session.bingoGame?.currentPlayerId === currentUser.uid 
                          ? 'bg-[#e8f0fe] border-[#217346] text-[#217346] ring-2 ring-[#217346]/20' 
                          : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <User size={16} className={session.bingoGame?.currentPlayerId === currentUser.uid ? 'text-[#217346]' : 'text-gray-400'} />
                            {session.bingoGame?.currentPlayerId === currentUser.uid && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold opacity-70 uppercase leading-none mb-1">현재_결재권자</span>
                            <span className="text-xs font-bold leading-none">
                              {session.bingoGame?.currentPlayerId === currentUser.uid 
                                ? '당신의 차례입니다! 단어를 선택하세요.' 
                                : `${session.players?.[session.bingoGame?.currentPlayerId || '']?.nickname || '플레이어'}님의 차례입니다.`}
                            </span>
                          </div>
                        </div>
                        {session.bingoGame?.currentPlayerId === currentUser.uid && (
                          <div className="text-[9px] font-black bg-[#217346] text-white px-2 py-1 rounded shadow-sm animate-bounce">
                            결재 대기 중
                          </div>
                        )}
                      </div>

                      <div className="relative shadow-xl rounded-lg overflow-hidden border border-[#d1d1d1]">
                        <div className="grid grid-cols-5 gap-1 bg-[#d1d1d1] p-1">
                          {(() => {
                            const targetId = session.bingoGame?.boards?.[currentUser.uid] ? currentUser.uid : session.bingoGame?.currentPlayerId;
                            const board = session.bingoGame?.boards?.[targetId || ''];
                            if (!board) return null;
                            
                            return (Array.isArray(board) ? board : Object.values(board)).map((row: any, r: number) => (
                              (Array.isArray(row) ? row : Object.values(row || {})).map((word: any, c: number) => {
                                const isMarked = (session.bingoGame?.markedWords || []).includes(word);
                                const isMyTurn = session.bingoGame?.currentPlayerId === currentUser.uid;
                                return (
                                  <button
                                    key={`${r}-${c}`}
                                    disabled={!isMyTurn || isMarked || isSpectator}
                                    onClick={() => sessionService.pickBingoWord(session.id, currentUser.uid, word, session)}
                                    className={`aspect-square flex items-center justify-center text-[10px] p-1 transition-all break-all text-center leading-tight ${
                                      isMarked 
                                        ? 'bg-[#217346] text-white font-bold' 
                                        : isMyTurn 
                                          ? 'bg-white hover:bg-[#e8f0fe] cursor-pointer' 
                                          : 'bg-white opacity-80'
                                    }`}
                                  >
                                    {word}
                                  </button>
                                );
                              })
                            ));
                          })()}
                        </div>
                        
                        {/* Strike-through lines overlay */}
                        <svg className="absolute inset-0 pointer-events-none w-full h-full z-20">
                          {(() => {
                            const targetId = session.bingoGame?.boards?.[currentUser.uid] ? currentUser.uid : session.bingoGame?.currentPlayerId;
                            const board = session.bingoGame?.boards?.[targetId || ''];
                            const marked = session.bingoGame?.markedWords || [];
                            if (!board) return null;
                            const lines: React.ReactNode[] = [];
                            
                            // Rows
                            for (let r = 0; r < 5; r++) {
                              if (board[r] && board[r].every((w: string) => marked.includes(w))) {
                                lines.push(<line key={`r-${r}`} x1="5%" y1={`${r * 20 + 10}%`} x2="95%" y2={`${r * 20 + 10}%`} stroke="red" strokeWidth="2" strokeOpacity="0.6" />);
                              }
                            }
                            // Cols
                            for (let c = 0; c < 5; c++) {
                              let colMarked = true;
                              for (let r = 0; r < 5; r++) if (!board[r] || !marked.includes(board[r][c])) colMarked = false;
                              if (colMarked) {
                                lines.push(<line key={`c-${c}`} x1={`${c * 20 + 10}%`} y1="5%" x2={`${c * 20 + 10}%`} y2="95%" stroke="red" strokeWidth="2" strokeOpacity="0.6" />);
                              }
                            }
                            // Diagonals
                            let d1 = true, d2 = true;
                            for (let i = 0; i < 5; i++) {
                              if (!board[i] || !marked.includes(board[i][i])) d1 = false;
                              if (!board[i] || !marked.includes(board[i][4 - i])) d2 = false;
                            }
                            if (d1) lines.push(<line key="d1" x1="5%" y1="5%" x2="95%" y2="95%" stroke="red" strokeWidth="2" strokeOpacity="0.6" />);
                            if (d2) lines.push(<line key="d2" x1="95%" y1="5%" x2="5%" y2="95%" stroke="red" strokeWidth="2" strokeOpacity="0.6" />);
                            
                            return lines;
                          })()}
                        </svg>
                      </div>
                    </div>

                    {/* Game Info */}
                    <div className="w-full md:w-56 space-y-6">
                      <div className="bg-[#f8f9fa] border border-[#d1d1d1] p-4 rounded">
                        <h4 className="text-[9px] font-bold text-[#999] uppercase mb-3 flex items-center gap-2">
                          <Users size={10} /> 플레이어 현황
                        </h4>
                        <div className="space-y-3">
                          {(Object.values(session?.players || {}) as Player[]).map(p => {
                            const lines = session.bingoGame?.boards[p.id] ? sessionService.countBingoLines(session.bingoGame.boards[p.id], session.bingoGame.markedWords || []) : 0;
                            return (
                              <div key={p.id} className="flex flex-col gap-1">
                                <div className="flex justify-between items-center text-xs">
                                  <span className={`truncate ${p.id === session.bingoGame?.currentPlayerId ? 'font-bold text-[#217346]' : ''}`}>
                                    {p.nickname}
                                  </span>
                                  <span className="font-mono font-bold text-[#217346]">{lines}줄</span>
                                </div>
                                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-[#217346] transition-all duration-500" 
                                    style={{ width: `${(lines / (session.bingoGame?.targetLines || 5)) * 100}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="bg-white border border-[#d1d1d1] p-3 rounded">
                        <h4 className="text-[9px] font-bold text-[#999] uppercase mb-2">최근 선택된 단어</h4>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {[...(session.bingoGame?.markedWords || [])].reverse().map((word, i) => (
                            <div key={`${word}-${(session.bingoGame?.markedWords || []).length - 1 - i}`} className="text-[10px] py-1 border-b border-[#f1f1f1] last:border-0 flex items-center gap-2">
                              <span className="text-[#999] font-mono">{(session.bingoGame?.markedWords || []).length - i}.</span>
                              <span className="font-medium">{word}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f8f9fa] border-t border-[#d1d1d1] px-4 py-3 text-center text-xs">
                    {session.bingoGame?.currentPlayerId === currentUser.uid ? (
                      <div className="flex items-center justify-center gap-2 text-[#217346] font-bold animate-pulse">
                        <Edit3 size={12} />
                        <span>당신의 차례입니다! 시트에서 단어를 선택하세요.</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-[#666]">
                        <RefreshCw size={12} className="animate-spin" />
                        <span>{session.players?.[session.bingoGame!.currentPlayerId]?.nickname}님이 단어를 고르는 중...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              )
            ) : session.gameType === GameType.MINESWEEPER ? (
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white border border-[#d1d1d1] rounded shadow-lg overflow-hidden">
                  <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-[#666]">데이터_오류_검수_진행</span>
                      <div className="h-3 w-px bg-[#d1d1d1]" />
                      <div className="text-[10px] text-[#666]">난이도: <span className="font-bold text-[#217346]">{session.minesweeperGame?.difficulty}</span></div>
                      <div className="h-3 w-px bg-[#d1d1d1]" />
                      <div className="text-[10px] text-[#666]">남은 지뢰: <span className="font-bold text-red-600">{session.minesweeperGame?.mineCount}</span></div>
                    </div>
                    {session.minesweeperGame?.status !== 'PLAYING' && (
                      <button 
                        onClick={() => sessionService.startMinesweeperGame(session.id, session.minesweeperGame?.difficulty || 'EASY')}
                        className="office-btn-primary px-3 py-1 text-[10px] font-bold"
                      >
                        재시작
                      </button>
                    )}
                  </div>

                  <div className="p-10 md:p-16 flex flex-col items-center gap-10">
                    <div 
                      className="grid gap-1 bg-[#d1d1d1] p-1 rounded shadow-2xl border border-[#d1d1d1]"
                      style={{ 
                        gridTemplateColumns: `repeat(${session.minesweeperGame?.board?.[0]?.length || (session.minesweeperGame?.board && (Object.values(session.minesweeperGame.board)[0] as any)?.length) || 0}, minmax(0, 1fr))`,
                        width: 'fit-content'
                      }}
                    >
                      {(Array.isArray(session.minesweeperGame?.board) ? session.minesweeperGame.board : Object.values(session.minesweeperGame?.board || {})).map((row: any, r: number) => (
                        (Array.isArray(row) ? row : Object.values(row || {})).map((cell: any, c: number) => (
                          <button
                            key={`${r}-${c}`}
                            onClick={() => {
                              if (!isSpectator) {
                                if (cell.isRevealed) {
                                  sessionService.chordMinesweeperCell(session.id, r, c, session);
                                } else {
                                  sessionService.revealMinesweeperCell(session.id, r, c, session);
                                }
                              }
                            }}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              if (!isSpectator && !cell.isRevealed) sessionService.flagMinesweeperCell(session.id, r, c, session);
                            }}
                            className={`w-6 h-6 md:w-8 md:h-8 flex items-center justify-center text-xs font-bold transition-all ${
                              cell.isRevealed 
                                ? 'bg-[#f1f1f1] text-[#333]' 
                                : 'bg-[#e0e0e0] hover:bg-[#d5d5d5] shadow-[inset_2px_2px_0_rgba(255,255,255,0.5),inset_-2px_-2px_0_rgba(0,0,0,0.1)] active:shadow-none'
                            } ${cell.isMine && cell.isRevealed ? 'bg-red-500 text-white' : ''} ${isSpectator ? 'cursor-default' : ''}`}
                          >
                            {cell.isRevealed ? (
                              cell.isMine ? <Bomb size={14} /> : (cell.neighborMines > 0 ? cell.neighborMines : '')
                            ) : (
                              cell.isFlagged ? <Shield size={14} className="text-red-600" /> : ''
                            )}
                          </button>
                        ))
                      ))}
                    </div>

                    {session.minesweeperGame?.status !== 'PLAYING' && (
                      <div className="w-full max-w-sm space-y-4">
                        {session.minesweeperGame?.status === 'WON' ? (
                          <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center animate-bounce">
                            <Trophy className="mx-auto text-green-600 mb-2" />
                            <p className="text-green-800 font-bold">모든 데이터 오류를 찾아냈습니다! 완벽한 검수입니다.</p>
                          </div>
                        ) : (
                          <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-center">
                            <AlertTriangle className="mx-auto text-red-600 mb-2" />
                            <p className="text-red-800 font-bold">치명적인 데이터 오류를 발견하지 못했습니다. 시스템이 충돌했습니다!</p>
                          </div>
                        )}
                        <Leaderboard 
                          entries={session.minesweeperGame?.status === 'WON' || session.minesweeperGame?.status === 'LOST' ? globalLeaderboards?.MINESWEEPER || [] : []} 
                          title="데이터 검수" 
                          sessionId="GLOBAL"
                          gameType="MINESWEEPER"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : session.gameType === GameType.ESCAPE_ROOM ? (
              <EscapeRoomUI session={session} currentUser={currentUser} isSpectator={isSpectator} />
            ) : session.gameType === GameType.CYBER_ARENA ? (
              <CyberArenaUI session={session} currentUser={currentUser} isSpectator={isSpectator} isHost={isHost} />
            ) : session.gameType === GameType.OFFICE_LIFE ? (
              <OfficeLifeBoard session={session} currentUser={currentUser} />
            ) : session.gameType === GameType.OFFICE_2048 ? (
              <div className="max-w-md mx-auto space-y-6">
                <div className="bg-white border border-[#d1d1d1] rounded shadow-lg overflow-hidden">
                  <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#666]">직급_승진_프로세스</span>
                    <div className="flex gap-4">
                      <div className="text-[10px] text-[#666]">현재 점수: <span className="font-bold text-[#217346]">{session.office2048Game?.score}</span></div>
                      <div className="text-[10px] text-[#666]">최고 기록: <span className="font-bold text-[#217346]">{session.office2048Game?.bestScore}</span></div>
                    </div>
                  </div>

                  <div className="p-10 md:p-16 flex flex-col items-center gap-10">
                    <div className="grid grid-cols-4 gap-3 bg-[#bbada0] p-3 rounded-xl w-full aspect-square shadow-2xl border-4 border-[#bbada0]">
                      {(Array.isArray(session.office2048Game?.board) ? session.office2048Game.board : Object.values(session.office2048Game?.board || {})).map((row: any, r: number) => (
                        (Array.isArray(row) ? row : Object.values(row || {})).map((val: any, c: number) => {
                          const getRank = (v: number) => {
                            if (v === 0) return '';
                            const ranks: Record<number, string> = {
                              2: '인턴', 4: '사원', 8: '주임', 16: '대리', 32: '과장', 64: '차장',
                              128: '팀장', 256: '부장', 512: '상무', 1024: '전무', 2048: '사장'
                            };
                            return ranks[v] || '고문';
                          };
                          const getColor = (v: number) => {
                            const colors: Record<number, string> = {
                              2: 'bg-[#eee4da] text-[#776e65]',
                              4: 'bg-[#ede0c8] text-[#776e65]',
                              8: 'bg-[#f2b179] text-white',
                              16: 'bg-[#f59563] text-white',
                              32: 'bg-[#f67c5f] text-white',
                              64: 'bg-[#f65e3b] text-white',
                              128: 'bg-[#edcf72] text-white',
                              256: 'bg-[#edcc61] text-white',
                              512: 'bg-[#edc850] text-white',
                              1024: 'bg-[#edc53f] text-white',
                              2048: 'bg-[#edc22e] text-white',
                            };
                            return colors[v] || 'bg-[#cdc1b4]';
                          };
                          return (
                            <div 
                              key={`${r}-${c}`}
                              className={`flex flex-col items-center justify-center rounded transition-all duration-100 ${getColor(val)} shadow-sm`}
                            >
                              <span className="text-lg font-black">{val || ''}</span>
                              <span className="text-[8px] font-bold opacity-80">{getRank(val)}</span>
                            </div>
                          );
                        })
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-2 w-full">
                      <div />
                      <button onClick={() => sessionService.moveOffice2048(session.id, 'UP', session)} className="office-btn py-2 flex justify-center"><ArrowUp size={16} /></button>
                      <div />
                      <button onClick={() => sessionService.moveOffice2048(session.id, 'LEFT', session)} className="office-btn py-2 flex justify-center"><ArrowDown className="-rotate-90" size={16} /></button>
                      <button onClick={() => sessionService.moveOffice2048(session.id, 'DOWN', session)} className="office-btn py-2 flex justify-center"><ArrowDown size={16} /></button>
                      <button onClick={() => sessionService.moveOffice2048(session.id, 'RIGHT', session)} className="office-btn py-2 flex justify-center"><ArrowUp className="rotate-90" size={16} /></button>
                    </div>

                    {session.office2048Game?.status !== 'PLAYING' && (
                      <div className="w-full space-y-4">
                        <div className={`w-full p-4 rounded-lg text-center ${session.office2048Game?.status === 'WON' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                          <p className={`font-bold ${session.office2048Game?.status === 'WON' ? 'text-green-800' : 'text-red-800'}`}>
                            {session.office2048Game?.status === 'WON' ? '축하합니다! 사장으로 승진하셨습니다!' : '승진에 실패했습니다. 다음 기회를 노려보세요.'}
                          </p>
                          <button 
                            onClick={() => sessionService.startOffice2048Game(session.id)}
                            className="mt-2 office-btn-primary px-4 py-1 text-xs"
                          >
                            다시 도전
                          </button>
                        </div>
                        <Leaderboard 
                          entries={globalLeaderboards?.OFFICE_2048 || []} 
                          title="직급 승진" 
                          sessionId="GLOBAL"
                          gameType="OFFICE_2048"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : session.gameType === GameType.SUDOKU ? (
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white border border-[#d1d1d1] rounded shadow-lg overflow-hidden">
                  <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#666]">데이터_무결성_검증_진행</span>
                    <div className="flex gap-4">
                      <div className="text-[10px] text-[#666]">난이도: <span className="font-bold text-[#217346]">{session.sudokuGame?.difficulty}</span></div>
                      <div className="text-[10px] text-[#666]">실수: <span className="font-bold text-red-600">{session.sudokuGame?.mistakes}/3</span></div>
                    </div>
                  </div>

                  <div className="p-10 md:p-16 flex flex-col md:flex-row items-center justify-center gap-12">
                    <div className="grid grid-cols-9 border-4 border-[#333] w-fit shadow-2xl rounded-sm overflow-hidden">
                      {(Array.isArray(session.sudokuGame?.currentBoard) ? session.sudokuGame.currentBoard : Object.values(session.sudokuGame?.currentBoard || {})).map((row: any, r: number) => (
                        (Array.isArray(row) ? row : Object.values(row || {})).map((val: any, c: number) => {
                          const isInitial = session.sudokuGame?.initialBoard?.[r]?.[c] !== 0 && session.sudokuGame?.initialBoard?.[r]?.[c] !== undefined;
                          const isWrong = val !== 0 && val !== undefined && val !== session.sudokuGame?.solution?.[r]?.[c];
                          const isSelected = selectedSudokuCell?.r === r && selectedSudokuCell?.c === c;
                          return (
                            <button 
                              key={`${r}-${c}`}
                              onClick={() => !isSpectator && !isInitial && setSelectedSudokuCell({r, c})}
                              className={`w-8 h-8 md:w-10 md:h-10 border border-[#ccc] flex items-center justify-center text-sm md:text-base font-bold transition-all
                                ${r % 3 === 2 && r !== 8 ? 'border-b-2 border-b-[#333]' : ''}
                                ${c % 3 === 2 && c !== 8 ? 'border-r-2 border-r-[#333]' : ''}
                                ${isInitial ? 'bg-[#f8f9fa] text-[#333]' : 'bg-white text-[#217346]'}
                                ${isWrong ? 'bg-red-100 text-red-600' : ''}
                                ${isSelected ? 'ring-2 ring-inset ring-[#217346] bg-[#e8f0fe] z-10' : ''}
                                ${isSpectator ? 'cursor-default' : ''}
                              `}
                            >
                              {val || ''}
                            </button>
                          );
                        })
                      ))}
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-3 gap-2">
                        {[1,2,3,4,5,6,7,8,9].map(num => (
                          <button 
                            key={num}
                            onClick={() => {
                              if (selectedSudokuCell) {
                                sessionService.updateSudokuCell(session.id, selectedSudokuCell.r, selectedSudokuCell.c, num, session);
                              }
                            }}
                            className="office-btn w-10 h-10 font-bold"
                          >
                            {num}
                          </button>
                        ))}
                        <button 
                          onClick={() => {
                            if (selectedSudokuCell) {
                              sessionService.updateSudokuCell(session.id, selectedSudokuCell.r, selectedSudokuCell.c, 0, session);
                            }
                          }}
                          className="office-btn w-10 h-10 font-bold text-red-600"
                        >
                          X
                        </button>
                      </div>
                      <button 
                        onClick={() => sessionService.startSudokuGame(session.id, session.sudokuGame?.difficulty || 'EASY')}
                        className="office-btn-primary py-2 text-xs font-bold"
                      >
                        새 시트
                      </button>
                    </div>
                    {session.sudokuGame?.status === 'WON' && (
                      <div className="w-full max-w-xs space-y-4">
                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center animate-bounce">
                          <Trophy className="mx-auto text-green-600 mb-2" />
                          <p className="text-green-800 font-bold">데이터 무결성 검증 완료! 완벽한 보고서입니다.</p>
                        </div>
                        <Leaderboard 
                          entries={globalLeaderboards?.SUDOKU || []} 
                          title="데이터 무결성" 
                          sessionId="GLOBAL"
                          gameType="SUDOKU"
                        />
                      </div>
                    )}
                  </div>
                  
                  <p className="text-center text-[10px] text-[#999] pb-4">빈 칸을 클릭하고 숫자를 입력하여 데이터를 검증하세요.</p>
                </div>
              </div>
            ) : session.gameType === GameType.DRAW ? (
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="bg-white border border-[#d1d1d1] rounded shadow-lg overflow-hidden">
                  <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-[#666]">비주얼_브리핑_진행</span>
                      <div className="h-3 w-px bg-[#d1d1d1]" />
                      <div className="text-[10px] text-[#666]">라운드: <span className="font-bold text-[#217346]">{session.drawGame?.round} / {session.drawGame?.maxRounds}</span></div>
                      <div className="h-3 w-px bg-[#d1d1d1]" />
                      <div className="text-[10px] font-bold text-[#217346] tracking-widest">
                        힌트: {(() => {
                          const word = session.drawGame?.word || '';
                          const timer = session.drawGame?.timer || 0;
                          const maxTime = session.settings.drawTime || 60;
                          if (session.drawGame?.presenterId === currentUser.uid) return word;
                          
                          // Hint logic:
                          // 50% time left: Show first char
                          // 25% time left: Show first two chars
                          let hint = '';
                          for (let i = 0; i < word.length; i++) {
                             if (word[i] === ' ') hint += '  '; // Double space for word separation
                             else hint += '_ ';
                          }

                          if (timer < maxTime * 0.5 && word.length > 0) {
                            // Reveal first char
                            hint = word[0] + hint.substring(2);
                          }
                          if (timer < maxTime * 0.25 && word.length > 1) {
                            // Reveal second char
                            hint = word[0] + ' ' + word[1] + hint.substring(4);
                          }
                          return hint;
                        })()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-red-600">
                      <Timer size={14} />
                      <span>{session.drawGame?.timer}s</span>
                    </div>
                  </div>

                  <div className="p-6 md:p-10 flex flex-col lg:flex-row gap-10">
                    {/* Canvas Area */}
                    <div className="flex-1 flex flex-col gap-4 min-w-0">
                      <div className="flex flex-col gap-3">
                        {session.drawGame?.presenterId === currentUser.uid && (
                          <div className="bg-[#217346] text-white px-4 py-3 rounded-lg flex justify-between items-center shadow-md border-b-4 border-[#1a5a36]">
                            <div className="flex items-center gap-3 font-bold text-base md:text-lg">
                              <Palette size={20} className="text-yellow-300" />
                              <span>제시어: <span className="text-yellow-300 font-black ml-1">{session.drawGame?.word}</span></span>
                            </div>
                            <button 
                              onClick={() => sessionService.passDrawTurn(session.id, session)}
                              className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2 active:scale-95"
                            >
                              <RefreshCw size={14} /> 패스하기
                            </button>
                          </div>
                        )}
                        <div className="relative bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-lg">
                          <Canvas 
                            isPresenter={session.drawGame?.presenterId === currentUser.uid}
                            onDraw={(data) => sessionService.updateDrawCanvas(session.id, data)}
                            initialData={session.drawGame?.canvasData}
                          />
                        </div>
                      </div>
                      
                      {session.drawGame?.presenterId !== currentUser.uid && (
                        <div className="flex gap-2 w-full max-w-2xl mx-auto">
                          <input 
                            type="text"
                            placeholder="정답을 입력하세요..."
                            className="office-input flex-1 h-12 text-base shadow-sm"
                            value={drawGuess}
                            onChange={(e) => setDrawGuess(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && drawGuess.trim()) {
                                sessionService.submitDrawGuess(session.id, currentUser.uid, drawGuess.trim(), session);
                                setDrawGuess('');
                              }
                            }}
                          />
                          <button 
                            onClick={() => {
                              if (drawGuess.trim()) {
                                sessionService.submitDrawGuess(session.id, currentUser.uid, drawGuess.trim(), session);
                                setDrawGuess('');
                              }
                            }}
                            className="office-btn-primary px-6 h-12 font-bold shadow-sm whitespace-nowrap"
                          >
                            제출
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Sidebar */}
                    <div className="w-full lg:w-64 space-y-4 shrink-0">
                      <div className="bg-[#f8f9fa] border border-[#d1d1d1] p-4 rounded shadow-sm">
                        <h4 className="text-[10px] font-bold text-[#999] uppercase mb-3 flex items-center gap-2">
                          <Trophy size={12} /> 실시간 스코어보드
                        </h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {Object.entries(session.drawGame?.scores || {}).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([pid, score]) => (
                            <div key={pid} className="flex justify-between items-center text-xs p-1 hover:bg-gray-100 rounded">
                              <div className="flex items-center gap-2 truncate flex-1">
                                {pid === session.drawGame?.presenterId && <Palette size={12} className="text-[#217346]" />}
                                <span className={`truncate ${pid === currentUser.uid ? 'font-bold text-[#217346]' : 'text-gray-700'}`}>
                                  {session.players?.[pid]?.nickname}
                                </span>
                              </div>
                              <span className="font-mono font-bold bg-gray-200 px-1.5 py-0.5 rounded text-[10px]">{score}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white border border-[#d1d1d1] p-4 rounded shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#e8f0fe] rounded-full flex items-center justify-center text-[#217346] shrink-0">
                          <User size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-bold text-[#999] uppercase mb-0.5">현재 발표자</div>
                          <div className="text-sm font-bold truncate text-gray-800">{session.players?.[session.drawGame!.presenterId]?.nickname}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f8f9fa] border-t border-[#d1d1d1] px-4 py-3 text-center text-xs">
                    {session.drawGame?.presenterId === currentUser.uid ? (
                      <div className="flex items-center justify-center gap-2 text-[#217346] font-bold animate-pulse">
                        <Palette size={12} />
                        <span>당신은 발표자입니다! 화이트보드에 제시어를 그려주세요.</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-[#666]">
                        <Search size={12} className="animate-bounce" />
                        <span>발표자의 그림을 보고 정답을 맞혀보세요!</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
            <div className="space-y-6">
              {session.gameType === GameType.MAFIA && session.mafiaGame?.nightResult && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900 text-white p-6 rounded-xl shadow-2xl border-l-4 border-red-500 overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Moon size={80} />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-slate-400">
                    <Moon size={14} className="text-yellow-500" /> 지난 밤의 사건 보고서
                  </h3>
                  <div className="space-y-4 relative z-10">
                    {session.mafiaGame?.nightResult?.eliminatedPlayerId ? (
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-900/30 rounded-full flex items-center justify-center text-red-500 border border-red-500/30">
                          <Skull size={24} />
                        </div>
                        <div>
                          <p className="text-lg font-bold">
                            <span className="text-red-400">{session.players?.[session.mafiaGame.nightResult.eliminatedPlayerId]?.nickname}</span>님이 희생되었습니다.
                          </p>
                          <p className="text-xs text-slate-400 mt-1">마피아의 잔인한 공격으로 인해 시트에서 제외되었습니다.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-900/30 rounded-full flex items-center justify-center text-green-500 border border-green-500/30">
                          <ShieldCheck size={24} />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-green-400">평화로운 밤이었습니다.</p>
                          <p className="text-xs text-slate-400 mt-1">의사의 헌신적인 치료 덕분에 아무도 희생되지 않았습니다.</p>
                        </div>
                      </div>
                    )}
                    
                    {me?.role === MafiaRole.POLICE && session.mafiaGame?.nightResult?.investigatedPlayerId && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg"
                      >
                        <div className="flex items-center gap-2 text-blue-400 mb-1">
                          <Search size={14} />
                          <span className="text-xs font-bold uppercase tracking-wider">경찰 기밀 조사 보고</span>
                        </div>
                        <p className="text-sm">
                          <span className="font-bold underline decoration-blue-500/50">{session.players?.[session.mafiaGame.nightResult.investigatedPlayerId]?.nickname}</span>님은 
                          <span className={`ml-1 font-black ${session.mafiaGame.nightResult.investigatedRole === MafiaRole.MAFIA ? 'text-red-500' : 'text-blue-400'}`}>
                            {session.mafiaGame.nightResult.investigatedRole === MafiaRole.MAFIA ? '마피아' : '선량한 시민'}
                          </span>인 것으로 확인되었습니다.
                        </p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              <div className="bg-white border border-[#d1d1d1] p-4 rounded shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <div>
                    <h3 className="text-[10px] font-bold text-[#666]">세션_활성화됨</h3>
                    <p className="text-sm font-bold">토론이 진행 중입니다...</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {session.gameType === GameType.LIAR && (
                    <div className="relative">
                      <button
                        onClick={() => setShowLiarKeyword(!showLiarKeyword)}
                        className={`office-btn px-3 py-2 text-xs flex items-center justify-center gap-1 whitespace-nowrap ${showLiarKeyword ? 'bg-yellow-100 border-yellow-300 text-yellow-800' : ''}`}
                        title="제시어 다시 확인하기"
                      >
                        {showLiarKeyword ? <Sun size={12} /> : <Moon size={12} />}
                        <span>{showLiarKeyword ? '제시어 숨기기' : '제시어 확인'}</span>
                      </button>
                      {showLiarKeyword && (
                        <div className="absolute top-full right-0 mt-2 p-3 bg-white border border-yellow-300 shadow-xl rounded z-50 min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
                          <div className="text-[10px] text-gray-500 mb-1 font-bold flex items-center gap-1">
                            <AlertTriangle size={10} className="text-yellow-500" /> 보안 주의
                          </div>
                          <div className="text-center py-2">
                            {session.liarGame?.liarPlayerId === currentUser.uid ? (
                              session.liarGame?.mode === LiarMode.FOOL ? (
                                <span className="text-[#217346] font-black text-lg">{session.liarGame?.liarWord}</span>
                              ) : (
                                <span className="text-red-600 font-black text-lg">당신은 라이어입니다</span>
                              )
                            ) : (
                              <span className="text-[#217346] font-black text-lg">{session.liarGame?.commonWord}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {isHost && (
                    <button 
                      onClick={() => sessionService.shuffleTurnOrder(session.id, session.players)}
                      className="office-btn px-3 py-2 text-xs flex items-center justify-center gap-1 whitespace-nowrap"
                      title="발언 순서 섞기"
                    >
                      <RefreshCw size={12} />
                      <span>순서 섞기</span>
                    </button>
                  )}
                  {isHost && (
                    <button 
                      onClick={() => sessionService.advanceStatus(session.id, SessionStatus.VOTING)}
                      className="office-btn-primary px-4 py-2 text-xs whitespace-nowrap flex-1 sm:flex-none"
                    >
                      투표_단계로_전환
                    </button>
                  )}
                </div>
              </div>

              {/* Turn Order Display */}
              {session.turnOrder && session.turnOrder.length > 0 && (
                <div className="bg-white border border-[#d1d1d1] rounded shadow-sm overflow-hidden">
                  <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 text-[10px] font-bold text-[#666] flex items-center gap-2">
                    <ListOrdered size={12} />
                    발언_순서
                  </div>
                  <div className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {session.turnOrder.map((pid, idx) => {
                        const player = session.players?.[pid];
                        if (!player) return null;
                        const isAlive = player.isAlive;
                        return (
                          <div 
                            key={pid} 
                            className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-colors ${
                              !isAlive 
                                ? 'bg-gray-100 text-gray-400 border-gray-200 line-through decoration-gray-400' 
                                : pid === currentUser?.uid
                                  ? 'bg-[#e8f0fe] border-[#217346] text-[#217346] font-bold shadow-sm'
                                  : 'bg-white border-[#d1d1d1] text-[#333]'
                            }`}
                          >
                            <span className={`text-[10px] font-mono w-4 text-center ${pid === currentUser?.uid ? 'text-[#217346]' : 'text-[#999]'}`}>
                              {idx + 1}
                            </span>
                            <span className="text-xs">{player.nickname}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="excel-grid rounded overflow-hidden shadow-sm">
                <table className="excel-grid">
                  <thead>
                    <tr>
                      <th className="w-8"></th>
                      <th className="text-left pl-4">사용자_이름</th>
                      <th className="w-24">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.values(session?.players || {}) as Player[]).map((p, idx) => (
                      <tr key={p.id}>
                        <td className="bg-[#f8f9fa] border-r border-b border-[#d1d1d1] text-[9px] font-bold text-[#999] text-center">{idx + 1}</td>
                        <td className="excel-cell font-medium">{p.nickname}</td>
                        <td className="excel-cell text-center">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full ${p.isAlive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {p.isAlive ? '활성' : '제거됨'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

          {session.status === SessionStatus.VOTING && (
            <div className="max-w-xl mx-auto">
              <div className="bg-white border border-[#d1d1d1] rounded-xl shadow-2xl overflow-hidden">
                <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs font-bold text-[#333] uppercase tracking-widest">긴급_투표_진행_중</span>
                  </div>
                  <div className="text-[10px] font-bold text-[#217346] bg-[#e8f0fe] px-2 py-1 rounded">
                    {(Object.values(session?.players || {}) as Player[]).filter(p => p.isAlive && p.voteTarget).length} / {(Object.values(session?.players || {}) as Player[]).filter(p => p.isAlive).length} 완료
                  </div>
                </div>
                <div className="p-8 space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-xl font-black text-gray-900">누가 마피아입니까?</h2>
                    <p className="text-xs text-gray-500">신중하게 선택하십시오. 당신의 한 표가 시트의 운명을 결정합니다.</p>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(Object.values(session?.players || {}) as Player[]).filter(p => p.isAlive).map(p => (
                      <button
                        key={p.id}
                        disabled={me?.voteTarget !== undefined || !me?.isAlive}
                        onClick={() => setSelectedVoteTarget(p.id)}
                        className={`group relative p-4 border-2 transition-all text-left rounded-xl overflow-hidden ${
                          (me?.voteTarget === p.id || selectedVoteTarget === p.id)
                            ? 'bg-[#f1f8f5] text-[#217346] border-[#217346] shadow-md' 
                            : 'bg-white text-[#333] border-gray-100 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex justify-between items-center relative z-10">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              (me?.voteTarget === p.id || selectedVoteTarget === p.id) ? 'bg-[#217346] text-white' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {p.nickname.substring(0, 1)}
                            </div>
                            <span className="font-bold">{p.nickname}</span>
                          </div>
                          {(me?.voteTarget === p.id || selectedVoteTarget === p.id) && <CheckCircle2 size={16} className="text-[#217346]" />}
                        </div>
                        {p.voteTarget && (
                          <div className="absolute bottom-0 right-0 p-1">
                            <div className="w-1.5 h-1.5 bg-[#217346] rounded-full" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-gray-100 flex flex-col items-center gap-6">
                    {me?.voteTarget ? (
                      <div className="text-center bg-gray-50 w-full py-6 rounded-xl border border-dashed border-gray-200">
                        <div className="flex justify-center gap-1 mb-3">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="w-1.5 h-1.5 bg-[#217346] rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
                          ))}
                        </div>
                        <div className="text-sm font-bold text-gray-600">투표가 성공적으로 접수되었습니다.</div>
                        <p className="text-[10px] text-gray-400 mt-1">다른 플레이어들의 결정을 기다리고 있습니다...</p>
                      </div>
                    ) : (
                      <button 
                        onClick={() => {
                          if (selectedVoteTarget) {
                            sessionService.submitVote(session.id, currentUser.uid, selectedVoteTarget);
                            setSelectedVoteTarget(null);
                          }
                        }}
                        disabled={!selectedVoteTarget || !me?.isAlive}
                        className="office-btn-primary w-full py-4 text-base font-black shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 disabled:grayscale"
                      >
                        투표_확정_및_제출
                      </button>
                    )}

                    {isHost && (
                      <button 
                        onClick={() => {
                          if (confirm('투표를 강제로 종료하시겠습니까? 투표하지 않은 플레이어는 기권 처리됩니다.')) {
                            if (session.gameType === GameType.LIAR && session.liarGame) {
                              sessionService.processLiarVote(session.id, session.players, session.liarGame);
                            } else if (session.gameType === GameType.MAFIA) {
                              sessionService.processMafiaVote(session.id, session.players);
                            }
                          }
                        }}
                        className="text-xs text-red-500 underline hover:text-red-700"
                      >
                        강제 투표 종료 (미투표자 무시)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {session.status === SessionStatus.VOTE_RESULT && (
            <div className="max-w-xl mx-auto">
              <div className="bg-white border border-[#d1d1d1] rounded shadow-lg overflow-hidden">
                <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 text-[10px] font-bold text-[#666]">
                  투표_결과_보고서
                </div>
                <div className="p-8 space-y-8 text-center">
                  {session.gameType === GameType.LIAR ? (
                    session.liarGame?.lastVotedPlayerId ? (
                      <>
                        <div className="space-y-2">
                          <div className="text-xs text-[#666]">최다 득표자:</div>
                          <div className="text-3xl font-black text-[#333]">
                            {session.players?.[session.liarGame!.lastVotedPlayerId]?.nickname || '알 수 없음'}
                          </div>
                        </div>
                        
                        <div className="py-6 border-y border-[#d1d1d1] bg-[#f8f9fa] rounded">
                          <div className="text-xs text-[#666] mb-2 uppercase tracking-widest">정체 확인 결과</div>
                          {session.liarGame!.lastVotedPlayerId === session.liarGame!.liarPlayerId ? (
                            <div className="space-y-2">
                              <div className="text-4xl font-black text-[#217346]">
                                라이어 검거 성공!
                              </div>
                              <p className="text-xs text-[#666]">해당 플레이어는 라이어가 맞습니다.</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-4xl font-black text-red-600">
                                라이어가 아닙니다
                              </div>
                              <p className="text-xs text-[#666]">해당 플레이어는 선량한 시민이었습니다.</p>
                            </div>
                          )}
                        </div>

                        {isHost ? (
                          <div className="pt-4 space-y-3">
                            {session.liarGame!.lastVotedPlayerId === session.liarGame!.liarPlayerId ? (
                               <button 
                                onClick={() => sessionService.advanceStatus(session.id, SessionStatus.SUMMARY)}
                                className="office-btn-primary w-full py-3 shadow-md hover:shadow-lg transition-all"
                              >
                                최종_결과_보기
                              </button>
                            ) : (
                              <button 
                                onClick={() => sessionService.advanceStatus(session.id, SessionStatus.PLAYING)}
                                className="office-btn-primary w-full py-3 shadow-md hover:shadow-lg transition-all"
                              >
                                시트_계속하기 (다음 라운드)
                              </button>
                            )}
                            <p className="text-[10px] text-[#999]">관리자만 진행할 수 있습니다.</p>
                          </div>
                        ) : (
                          <div className="text-center p-4 bg-gray-50 rounded border border-gray-100">
                            <div className="animate-pulse text-xs font-bold text-gray-500">관리자가 다음 단계를 진행하기를 기다리는 중...</div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-sm text-[#666]">투표 결과가 없습니다.</p>
                         {isHost && (
                          <button 
                            onClick={() => sessionService.advanceStatus(session.id, SessionStatus.PLAYING)}
                            className="office-btn w-full py-2"
                          >
                            돌아가기
                          </button>
                        )}
                      </div>
                    )
                  ) : (
                    // Mafia Game Vote Result
                    <>
                      {session.mafiaGame?.eliminatedPlayerId ? (
                        <div className="space-y-6">
                          <div className="space-y-2">
                            <div className="text-xs text-[#666]">투표로 처형된 플레이어:</div>
                            <div className="text-3xl font-black text-red-600">
                              {session.players?.[session.mafiaGame.eliminatedPlayerId]?.nickname || '알 수 없음'}
                            </div>
                          </div>
                          
                          <div className="py-4 border-y border-[#d1d1d1] bg-[#f8f9fa] rounded">
                            <p className="text-sm text-[#666]">
                              <span className="font-bold">{session.players?.[session.mafiaGame.eliminatedPlayerId]?.nickname}</span>님이 시트에서 제외되었습니다.
                            </p>
                            {/* Optional: Reveal role */}
                            <p className="text-xs text-[#999] mt-2">
                              그의 정체는 <span className="font-bold">{session.players?.[session.mafiaGame.eliminatedPlayerId]?.role === 'MAFIA' ? '마피아' : '시민(또는 특수직)'}</span>였습니다.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="text-2xl font-bold text-[#333]">투표 부결</div>
                          <p className="text-sm text-[#666]">동점표가 발생하여 아무도 처형되지 않았습니다.</p>
                        </div>
                      )}

                      {isHost ? (
                        <div className="pt-4 space-y-3">
                          <button 
                            onClick={() => sessionService.startNightPhase(session.id, session.players)}
                            className="office-btn-primary w-full py-3 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                          >
                            <Moon size={16} />
                            <span>밤이 되었습니다 (다음 단계)</span>
                          </button>
                          <p className="text-[10px] text-[#999]">관리자만 진행할 수 있습니다.</p>
                        </div>
                      ) : (
                        <div className="text-center p-4 bg-gray-50 rounded border border-gray-100">
                          <div className="animate-pulse text-xs font-bold text-gray-500">관리자가 밤 단계를 시작하기를 기다리는 중...</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {session.status === SessionStatus.NIGHT && (
            <div className="max-w-xl mx-auto">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-950 text-white border border-slate-800 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
              >
                <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">NIGHT_OPERATIONS_PROTOCOL</span>
                  </div>
                  <Moon size={16} className="text-slate-600" />
                </div>
                <div className="p-10 space-y-10">
                  <div className="text-center space-y-4">
                    <div className="inline-block p-4 bg-slate-900 rounded-full mb-2">
                      <Moon size={40} className="text-blue-400 animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter">밤이 깊었습니다</h2>
                    <p className="text-sm text-slate-400 max-w-xs mx-auto">정적 속에 숨어든 진실을 찾거나, 어둠 속에서 목표를 처리하십시오.</p>
                  </div>

                  {me?.isAlive ? (
                    <div className="space-y-8">
                      {me.role === MafiaRole.MAFIA && (
                        <div className="space-y-6">
                          <div className="flex flex-col items-center gap-2 text-red-500">
                            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                              <Siren size={24} />
                            </div>
                            <span className="font-black text-lg uppercase tracking-widest">마피아: 제거 작전</span>
                            <p className="text-xs text-red-400/70">동료들과 협력하여 제거할 대상을 선택하십시오.</p>
                          </div>
                          
                          {/* Show Mafia Teammates */}
                          <div className="bg-red-950/20 border border-red-900/30 p-3 rounded-lg flex flex-wrap gap-2 justify-center">
                            <span className="text-[10px] font-bold text-red-400 w-full text-center mb-1 uppercase tracking-tighter">조직원 명단</span>
                            {(Object.values(session?.players || {}) as Player[]).filter(p => p.role === MafiaRole.MAFIA).map(m => (
                              <div key={m.id} className="px-2 py-1 bg-red-900/40 rounded text-[10px] font-bold text-red-200 border border-red-500/20">
                                {m.nickname} {m.id === me.id && '(나)'}
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(Object.values(session?.players || {}) as Player[]).filter(p => p.isAlive && p.role !== MafiaRole.MAFIA).map(p => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setSelectedNightTarget(p.id);
                                  sessionService.submitNightAction(session.id, me.id, MafiaRole.MAFIA, p.id);
                                }}
                                className={`group relative p-3 md:p-4 rounded-xl border-2 transition-all text-sm font-bold ${
                                  session.mafiaGame?.mafiaTargets?.[me.id] === p.id
                                    ? 'bg-red-900/40 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-red-500/50 hover:text-red-400'
                                }`}
                              >
                                {p.nickname}
                                {session.mafiaGame?.mafiaTargets && Object.entries(session.mafiaGame.mafiaTargets).some(([mid, tid]) => mid !== me.id && tid === p.id) && (
                                  <div className="absolute -top-2 -right-2 bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded-full shadow-lg animate-bounce">
                                    동료의 타겟
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {me.role === MafiaRole.DOCTOR && (
                        <div className="space-y-6">
                          <div className="flex flex-col items-center gap-2 text-emerald-400">
                            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                              <Stethoscope size={24} />
                            </div>
                            <span className="font-black text-lg uppercase tracking-widest">의사: 긴급 구생</span>
                            <p className="text-xs text-emerald-400/70">마피아의 공격으로부터 보호할 대상을 선택하십시오.</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {(Object.values(session?.players || {}) as Player[]).filter(p => p.isAlive).map(p => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setSelectedNightTarget(p.id);
                                  sessionService.submitNightAction(session.id, me.id, MafiaRole.DOCTOR, p.id);
                                }}
                                className={`p-4 rounded-xl border-2 transition-all text-sm font-bold ${
                                  session.mafiaGame?.doctorTarget === p.id
                                    ? 'bg-emerald-900/40 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400'
                                }`}
                              >
                                {p.nickname} {p.id === me.id && '(자신)'}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {me.role === MafiaRole.POLICE && (
                        <div className="space-y-6">
                          <div className="flex flex-col items-center gap-2 text-blue-400">
                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                              <Search size={24} />
                            </div>
                            <span className="font-black text-lg uppercase tracking-widest">경찰: 기밀 조사</span>
                            <p className="text-xs text-blue-400/70">정체가 의심되는 플레이어를 조사하십시오.</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {(Object.values(session?.players || {}) as Player[]).filter(p => p.isAlive && p.id !== me.id).map(p => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setSelectedNightTarget(p.id);
                                  sessionService.submitNightAction(session.id, me.id, MafiaRole.POLICE, p.id);
                                }}
                                className={`p-4 rounded-xl border-2 transition-all text-sm font-bold ${
                                  session.mafiaGame?.policeTarget === p.id
                                    ? 'bg-blue-900/40 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-blue-500/50 hover:text-blue-400'
                                }`}
                              >
                                {p.nickname}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {me.role === MafiaRole.CITIZEN && (
                        <div className="text-center py-12 space-y-6 bg-slate-900/50 rounded-2xl border border-slate-800">
                          <div className="relative inline-block">
                            <Moon size={64} className="mx-auto text-slate-700" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="font-bold text-slate-300">당신은 시민입니다.</p>
                            <p className="text-xs text-slate-500 leading-relaxed">밤에는 특별한 행동을 할 수 없습니다.<br />아침이 밝을 때까지 숨을 죽이고 기다리십시오.</p>
                          </div>
                        </div>
                      )}

                      {/* AI Thinking Indicator */}
                      {isAdminMode && isHost && (
                        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-xl flex items-center justify-center gap-3">
                          <Loader2 size={16} className="text-blue-400 animate-spin" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">AI_SIMULATION_ACTIVE</span>
                            <span className="text-[9px] text-blue-400/70">봇들이 전략을 분석하고 행동을 결정하고 있습니다...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 space-y-4 bg-red-950/10 rounded-2xl border border-red-900/20">
                      <Skull size={48} className="mx-auto text-red-900/50" />
                      <div className="space-y-1">
                        <p className="font-bold text-red-400">당신은 제거되었습니다.</p>
                        <p className="text-xs text-red-400/50">영혼이 되어 시트의 진행을 지켜보고 있습니다.</p>
                      </div>
                    </div>
                  )}

                  {isHost && (
                    <div className="pt-8 border-t border-slate-800">
                      <button 
                        onClick={() => sessionService.processNightPhase(session.id, session.players, session.mafiaGame!)}
                        className="w-full py-4 bg-slate-100 hover:bg-white text-slate-950 rounded-xl font-black transition-all shadow-xl hover:shadow-white/10 flex items-center justify-center gap-3 active:scale-[0.98]"
                      >
                        <Sun size={20} />
                        <span>아침 브리핑 시작 (결과 처리)</span>
                      </button>
                      <p className="text-[10px] text-slate-600 text-center mt-4 font-bold uppercase tracking-tighter">호스트 권한으로 강제 진행 가능</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {session.status === SessionStatus.SUMMARY && (
            <div className="max-w-xl mx-auto">
              <div className="bg-white border border-[#d1d1d1] rounded shadow-xl overflow-hidden">
                <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 text-[10px] font-bold text-[#666]">
                  최종_세션_보고서
                </div>
                <div className="p-8 space-y-8">
                  <div className="text-center space-y-4">
                    <h3 className="text-[10px] font-bold text-[#999] uppercase tracking-widest">감사 결과</h3>
                    
                    <div className="py-6 border-y border-[#d1d1d1] space-y-4">
                      {session.gameType === GameType.DRAW ? (
                        <div className="space-y-6">
                          <div className="text-xs text-[#666]">최종 스코어 결과:</div>
                          <div className="grid grid-cols-1 gap-3">
                            {Object.entries(session.drawGame?.scores || {}).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([pid, score], i) => (
                              <div key={pid} className={`flex items-center justify-between p-4 rounded border ${i === 0 ? 'bg-[#e8f0fe] border-[#217346]' : 'bg-[#f8f9fa] border-[#d1d1d1]'}`}>
                                <div className="flex items-center gap-4">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${i === 0 ? 'bg-[#217346] text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    {i + 1}
                                  </div>
                                  <span className="font-bold">{session.players?.[pid]?.nickname}</span>
                                </div>
                                <div className="text-xl font-black text-[#217346]">{score}점</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : session.gameType === GameType.BINGO ? (
                        <div className="space-y-4">
                          <div className="text-xs text-[#666]">최종 승리자:</div>
                          <div className="text-4xl font-black text-[#217346]">
                            {session.players?.[session.bingoGame!.winner!]?.nickname}
                          </div>
                          <div className="py-4 bg-[#f8f9fa] rounded border border-[#d1d1d1] inline-block px-8">
                            <div className="text-[10px] text-[#999] uppercase mb-1">달성 기록</div>
                            <div className="text-xl font-bold text-[#333]">
                              {sessionService.countBingoLines(session.bingoGame!.boards[session.bingoGame!.winner!], session.bingoGame!.markedWords)}줄 완성
                            </div>
                          </div>
                        </div>
                      ) : session.gameType === GameType.OMOK ? (
                        <div className="space-y-4">
                          <div className="text-xs text-[#666]">승리:</div>
                          {session.omokGame?.isDraw ? (
                            <div className="text-3xl font-black text-[#666]">무승부</div>
                          ) : (
                            <div className="text-3xl font-black text-[#217346] truncate px-4">
                              {session.omokGame!.winner === 'AI' ? 'AI 봇' : session.players?.[session.omokGame!.winner!]?.nickname} 승리!
                            </div>
                          )}
                          
                          {session.omokGame?.lastScore !== undefined && (
                            <div className="bg-[#e8f0fe] border border-[#217346] p-4 rounded-lg inline-block">
                              <div className="text-[10px] text-[#217346] font-bold uppercase mb-1">획득 점수</div>
                              <div className="text-3xl font-black text-[#217346]">{session.omokGame.lastScore}점</div>
                            </div>
                          )}

                          <div className="flex justify-center gap-8 mt-6">
                            <div className={`text-center p-4 rounded border ${session.omokGame?.winner === session.omokGame?.blackPlayerId ? 'bg-black/5 border-black' : 'border-transparent'}`}>
                              <div className="w-12 h-12 mx-auto mb-2 shadow-lg flex items-center justify-center">
                                <svg width="48" height="48" viewBox="0 0 48 48">
                                  <circle cx="24" cy="24" r="22" fill="#000000" stroke="#ffffff" strokeWidth="1" />
                                  <text x="24" y="28" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold">흑</text>
                                </svg>
                              </div>
                              <div className="text-sm font-bold">{session.omokGame!.blackPlayerId === 'AI' ? 'AI 봇' : session.players?.[session.omokGame!.blackPlayerId]?.nickname}</div>
                              {session.omokGame?.winner === session.omokGame?.blackPlayerId && <div className="text-[10px] text-[#217346] font-bold mt-1">WINNER</div>}
                            </div>
                            <div className={`text-center p-4 rounded border ${session.omokGame?.winner === session.omokGame?.whitePlayerId ? 'bg-gray-100 border-gray-400' : 'border-transparent'}`}>
                              <div className="w-12 h-12 mx-auto mb-2 shadow-lg flex items-center justify-center">
                                <svg width="48" height="48" viewBox="0 0 48 48">
                                  <circle cx="24" cy="24" r="22" fill="#ffffff" stroke="#cccccc" strokeWidth="1" />
                                  <text x="24" y="28" textAnchor="middle" fill="#000000" fontSize="12" fontWeight="bold">백</text>
                                </svg>
                              </div>
                              <div className="text-sm font-bold">{session.omokGame!.whitePlayerId === 'AI' ? 'AI 봇' : session.players?.[session.omokGame!.whitePlayerId]?.nickname}</div>
                              {session.omokGame?.winner === session.omokGame?.whitePlayerId && <div className="text-[10px] text-[#217346] font-bold mt-1">WINNER</div>}
                            </div>
                          </div>
                          

                        </div>
                      ) : session.gameType === GameType.LIAR ? (
                        <div className="space-y-4">
                          {session.liarGame?.winner === 'LIAR' ? (
                            <div className="space-y-2">
                              <div className="text-xs text-[#666]">승리:</div>
                              <div className="text-4xl font-black text-red-600">라이어 승리!</div>
                              <div className="text-sm text-[#666]">
                                라이어는 <span className="font-bold text-[#333]">{session.players?.[session.liarGame!.liarPlayerId]?.nickname}</span> 였습니다.
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="text-xs text-[#666]">식별된 라이어:</div>
                              <div className="text-3xl font-black text-[#217346]">
                                {session.players?.[session.liarGame!.liarPlayerId]?.nickname}
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col items-center gap-2">
                            {session.liarGame?.mode === LiarMode.FOOL ? (
                              <div className="w-full space-y-2">
                                <div className="text-[10px] text-[#666] bg-[#f8f9fa] p-2 rounded flex justify-between items-center border border-[#d1d1d1]">
                                  <span className="font-bold uppercase tracking-tighter">시민 제시어</span>
                                  <span className="text-sm font-black text-[#217346]">{session.liarGame?.commonWord}</span>
                                </div>
                                <div className="text-[10px] text-[#666] bg-[#fff1f2] p-2 rounded flex justify-between items-center border border-red-100">
                                  <span className="font-bold uppercase tracking-tighter">바보 제시어</span>
                                  <span className="text-sm font-black text-red-600">{session.liarGame?.liarWord}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-[10px] text-[#666] bg-[#f8f9fa] p-2 w-full rounded flex justify-between items-center border border-[#d1d1d1]">
                                <span className="font-bold uppercase tracking-tighter">정답 제시어</span>
                                <span className="text-sm font-black text-[#333]">{session.liarGame?.commonWord}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="text-center space-y-2">
                            <div className="text-[10px] font-bold text-[#666] uppercase tracking-[0.2em]">최종_판결_결과</div>
                            <div className={`text-4xl font-black ${session.mafiaGame?.winner === 'MAFIA' ? 'text-red-600' : 'text-[#217346]'}`}>
                              {session.mafiaGame?.winner === 'MAFIA' ? 'MAFIA VICTORY' : 'CITIZENS VICTORY'}
                            </div>
                          </div>

                          <div className="py-6 border-y border-[#d1d1d1] space-y-4">
                            <div className="flex items-center justify-center gap-4">
                              <div className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
                                session.mafiaGame?.winner === 'MAFIA' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-600'
                              }`}>
                                {session.mafiaGame?.winner === 'MAFIA' ? <Skull size={32} /> : <Trophy size={32} />}
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-bold text-gray-900">
                                  {session.mafiaGame?.winner === 'MAFIA' ? '마피아가 도시를 장악했습니다.' : '모든 마피아가 소탕되었습니다.'}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {session.mafiaGame?.winner === 'MAFIA' 
                                    ? '마피아의 수가 시민의 수와 같거나 많아져 승리 조건이 달성되었습니다.' 
                                    : '시민들이 단결하여 모든 마피아를 찾아내 처형하는 데 성공했습니다.'}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="text-[10px] font-bold text-[#999] uppercase tracking-widest text-center">조직원 명단 (마피아)</div>
                            <div className="flex flex-wrap justify-center gap-2">
                              {(Object.values(session?.players || {}) as Player[]).filter(p => p.role === 'MAFIA').map(p => (
                                <div key={p.id} className="px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-sm font-bold text-red-700 shadow-sm">
                                  {p.nickname}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-[10px] font-bold text-[#999] uppercase tracking-widest">플레이어_역할_기록부</h4>
                      <div className="text-[10px] text-gray-400 font-mono">TOTAL: {(Object.values(session?.players || {}) as Player[]).length}</div>
                    </div>
                    <div className="excel-grid rounded-lg overflow-hidden border border-[#d1d1d1] shadow-sm">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-[#f8f9fa]">
                            <th className="excel-col-header w-10 py-2">#</th>
                            <th className="excel-col-header text-left pl-4">사용자</th>
                            <th className="excel-col-header w-24">역할</th>
                            <th className="excel-col-header w-20">상태</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(Object.values(session?.players || {}) as Player[]).map((p, idx) => (
                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                              <td className="bg-[#f8f9fa] border-r border-b border-[#d1d1d1] text-[9px] font-bold text-[#999] text-center">{idx + 1}</td>
                              <td className="excel-cell text-xs py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400">
                                    {p.nickname.substring(0, 1)}
                                  </div>
                                  <span className="font-medium">{p.nickname}</span>
                                </div>
                              </td>
                              <td className={`excel-cell text-xs font-black text-center ${
                                p.role === 'MAFIA' ? 'text-red-600' : 
                                p.role === 'DOCTOR' ? 'text-emerald-600' :
                                p.role === 'POLICE' ? 'text-blue-600' : 'text-gray-600'
                              }`}>
                                {session.gameType === GameType.MAFIA ? (
                                  p.role === 'MAFIA' ? '마피아' :
                                  p.role === 'DOCTOR' ? '의사' :
                                  p.role === 'POLICE' ? '경찰' : '시민'
                                ) : session.gameType === GameType.OMOK ? (
                                  String(p.id) === String(session.omokGame?.blackPlayerId) ? '흑돌' :
                                  String(p.id) === String(session.omokGame?.whitePlayerId) ? '백돌' : '관전'
                                ) : (
                                  p.id === session.liarGame?.liarPlayerId ? '라이어' :
                                  p.id === session.liarGame?.spyPlayerId ? '스파이' : '시민'
                                )}
                              </td>
                              <td className="excel-cell text-center">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                  p.isAlive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {p.isAlive ? '생존' : '사망'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {isHost && (
                    <button 
                      onClick={() => sessionService.resetSession(session.id, session.players)}
                      className="office-btn-primary w-full py-3"
                    >
                      세션_재시작
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
            </>
          ) : activeSheet === 'ROLES' ? (
            <div className="bg-white border border-[#d1d1d1] rounded shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 text-[10px] font-bold text-[#666]">
                역할_할당_데이터베이스
              </div>
              <div className="overflow-x-auto">
                <table className="excel-grid">
                  <thead>
                    <tr>
                      <th className="w-8"></th>
                      <th className="text-left pl-4">플레이어</th>
                      <th className="w-32">할당된_역할</th>
                      <th className="w-24">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.values(session?.players || {}) as Player[]).map((p, idx) => (
                      <tr key={p.id}>
                        <td className="bg-[#f8f9fa] border-r border-b border-[#d1d1d1] text-[9px] font-bold text-[#999] text-center">{idx + 1}</td>
                        <td className="excel-cell">{p.nickname}</td>
                        <td className="excel-cell text-center font-bold">
                          {session.status === SessionStatus.LOBBY ? '대기 중' : (p.role || '시민')}
                        </td>
                        <td className="excel-cell text-center">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full ${p.isAlive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {p.isAlive ? '활성' : '제거됨'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeSheet === 'LOGS' ? (
            <div className="bg-white border border-[#d1d1d1] rounded shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 text-[10px] font-bold text-[#666] flex justify-between items-center">
                <span>시스템_이벤트_로그</span>
                <span className="text-[9px] font-normal">총 {Object.keys(session.logs || {}).length}개의 레코드</span>
              </div>
              <div className="overflow-x-auto">
                <table className="excel-grid">
                  <thead>
                    <tr>
                      <th className="w-8"></th>
                      <th className="w-32 text-left pl-4">타임스탬프</th>
                      <th className="w-20 text-center">유형</th>
                      <th className="text-left pl-4">이벤트_내용</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.values(session.logs || {}) as GameLog[]).sort((a, b) => b.timestamp - a.timestamp).map((log, idx) => (
                      <tr key={`${log.id}-${idx}`}>
                        <td className="bg-[#f8f9fa] border-r border-b border-[#d1d1d1] text-[9px] font-bold text-[#999] text-center">{idx + 1}</td>
                        <td className="excel-cell font-mono text-[10px]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="excel-cell text-center">
                          <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            log.type === 'success' ? 'bg-green-100 text-green-700' :
                            log.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {log.type}
                          </span>
                        </td>
                        <td className={`excel-cell ${log.type === 'success' ? 'text-green-700 font-medium' : ''}`}>
                          {log.content}
                        </td>
                      </tr>
                    ))}
                    {Object.keys(session.logs || {}).length === 0 && (
                      <tr>
                        <td colSpan={4} className="excel-cell text-center py-8 text-gray-400 italic">
                          기록된 로그가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeSheet === 'STATS' ? (
            <div className="bg-white border border-[#d1d1d1] rounded shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 text-[10px] font-bold text-[#666]">
                세션_성과_지표_대시보드
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-[#e8f0fe] border border-[#217346] p-4 rounded">
                    <div className="text-[9px] text-[#217346] font-bold uppercase mb-1">총 라운드</div>
                    <div className="text-2xl font-black text-[#217346]">{session.round}</div>
                  </div>
                  <div className="bg-[#f8f9fa] border border-[#d1d1d1] p-4 rounded">
                    <div className="text-[9px] text-[#666] font-bold uppercase mb-1">참여 인원</div>
                    <div className="text-2xl font-black text-[#333]">{Object.keys(session?.players || {}).length}</div>
                  </div>
                  <div className="bg-[#f8f9fa] border border-[#d1d1d1] p-4 rounded">
                    <div className="text-[9px] text-[#666] font-bold uppercase mb-1">현재 시트</div>
                    <div className="text-2xl font-black text-[#333]">{session.gameType}</div>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-[#333] mb-3">플레이어별 성과 기록</h4>
                <div className="overflow-x-auto">
                  <table className="excel-grid">
                    <thead>
                      <tr>
                        <th className="w-8"></th>
                        <th className="text-left pl-4">플레이어_성함</th>
                        <th className="w-24 text-center">승리_횟수</th>
                        <th className="w-24 text-center">누적_점수</th>
                        <th className="text-left pl-4">성과_그래프</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Object.values(session?.players || {}) as Player[]).map((p, idx) => {
                        const stats = session.stats?.[p.id] || { wins: 0, totalScore: 0 };
                        const maxWins = Math.max(...Object.values(session.stats || {}).map((s: any) => s.wins), 1);
                        return (
                          <tr key={p.id}>
                            <td className="bg-[#f8f9fa] border-r border-b border-[#d1d1d1] text-[9px] font-bold text-[#999] text-center">{idx + 1}</td>
                            <td className="excel-cell font-medium">{p.nickname}</td>
                            <td className="excel-cell text-center font-bold text-[#217346]">{stats.wins}</td>
                            <td className="excel-cell text-center">{stats.totalScore}</td>
                            <td className="excel-cell">
                              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-[#217346]" 
                                  style={{ width: `${(stats.wins / maxWins) * 100}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeSheet === 'LEADERBOARD' ? (
            <div className="bg-white border border-[#d1d1d1] rounded shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 text-[10px] font-bold text-[#666]">
                프로젝트_시트
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Leaderboard entries={globalLeaderboards?.OFFICE_2048 || []} title="직급 승진 (2048)" sessionId="GLOBAL" gameType="OFFICE_2048" />
                  <Leaderboard entries={globalLeaderboards?.MINESWEEPER || []} title="데이터 검수 (지뢰찾기)" sessionId="GLOBAL" gameType="MINESWEEPER" />
                  <Leaderboard entries={globalLeaderboards?.SUDOKU || []} title="데이터 무결성 (스도쿠)" sessionId="GLOBAL" gameType="SUDOKU" />
                  <Leaderboard entries={globalLeaderboards?.OMOK_AI || []} title="오목 마스터 (부장급 AI)" sessionId="GLOBAL" gameType="OMOK_AI" />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#d1d1d1] rounded shadow-sm overflow-hidden">
              <div className="bg-[#f8f9fa] border-b border-[#d1d1d1] px-4 py-2 text-[10px] font-bold text-[#666]">
                시트_운영_매뉴얼_v1.0
              </div>
              <div className="p-8 space-y-10">
                <section>
                  <h3 className="text-lg font-bold text-[#217346] border-b-2 border-[#217346] pb-1 mb-4 flex items-center gap-2">
                    <Shield size={20} /> 라이어 시트 (LIAR)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#333]">규칙 개요</h4>
                      <p className="text-gray-600 leading-relaxed">한 명의 라이어를 제외한 모든 플레이어는 제시어를 공유합니다. 라이어는 제시어를 모른 채 대화에 참여하여 정체를 숨겨야 합니다.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#333]">승리 조건</h4>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>시민: 투표를 통해 라이어를 검거</li>
                        <li>라이어: 끝까지 살아남거나 정체가 들켰을 때 제시어를 맞힘</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-red-700 border-b-2 border-red-700 pb-1 mb-4 flex items-center gap-2">
                    <Siren size={20} /> 마피아 시트 (MAFIA)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#333]">규칙 개요</h4>
                      <p className="text-gray-600 leading-relaxed">낮에는 토론과 투표를 통해 마피아를 처형하고, 밤에는 마피아가 시민을 제거합니다. 의사와 경찰은 각자의 능력을 사용합니다.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#333]">역할 안내</h4>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>마피아: 밤마다 한 명을 제거</li>
                        <li>의사: 밤마다 한 명을 치료 (마피아 공격 방어)</li>
                        <li>경찰: 밤마다 한 명의 정체를 조사</li>
                      </ul>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-blue-700 border-b-2 border-blue-700 pb-1 mb-4 flex items-center gap-2">
                    <Grid size={20} /> 오목 대전 (OMOK)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#333]">규칙 개요</h4>
                      <p className="text-gray-600 leading-relaxed">15x15 판 위에서 돌을 번갈아 놓아 가로, 세로, 대각선 중 하나라도 5개의 돌을 먼저 잇는 사람이 승리합니다.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#333]">금수 규칙 (흑돌)</h4>
                      <p className="text-gray-600">흑돌은 3-3, 4-4, 6목(장목)이 금지됩니다. 백돌은 제한이 없습니다.</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-[#217346] border-b-2 border-[#217346] pb-1 mb-4 flex items-center gap-2">
                    <Hash size={20} /> 빙고 감사 (BINGO)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#333]">규칙 개요</h4>
                      <p className="text-gray-600 leading-relaxed">5x5 시트에 단어를 채우고, 번갈아 가며 단어를 불러 목표한 줄 수를 먼저 완성하는 플레이어가 승리합니다.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#333]">팁</h4>
                      <p className="text-gray-600">중앙 칸을 선점하고, 상대방이 부르는 단어를 잘 체크하여 전략적으로 줄을 완성하세요.</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-orange-600 border-b-2 border-orange-600 pb-1 mb-4 flex items-center gap-2">
                    <Palette size={20} /> 비주얼 브리핑 (DRAW)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#333]">규칙 개요</h4>
                      <p className="text-gray-600 leading-relaxed">발표자는 제시어를 그림으로 설명하고, 나머지 플레이어들은 채팅을 통해 정답을 맞힙니다.</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-bold text-[#333]">점수 배분</h4>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>정답자: +10점</li>
                        <li>발표자: +5점 (정답자가 나왔을 때)</li>
                      </ul>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Sheet Tabs */}
      <footer className="bg-[#f8f9fa] border-t border-[#d1d1d1] flex items-center h-10 md:h-8 shrink-0 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setActiveSheet('GAME')}
          className={`office-tab whitespace-nowrap px-4 h-full flex items-center justify-center ${activeSheet === 'GAME' ? 'active' : ''}`}
        >
          메인_입력
        </button>
        <button 
          onClick={() => setActiveSheet('ROLES')}
          className={`office-tab whitespace-nowrap px-4 h-full flex items-center justify-center ${activeSheet === 'ROLES' ? 'active' : ''}`}
        >
          역할_데이터
        </button>
        <button 
          onClick={() => setActiveSheet('LOGS')}
          className={`office-tab whitespace-nowrap px-4 h-full flex items-center justify-center ${activeSheet === 'LOGS' ? 'active' : ''}`}
        >
          로그_시트
        </button>
        <button 
          onClick={() => setActiveSheet('STATS')}
          className={`office-tab whitespace-nowrap px-4 h-full flex items-center justify-center ${activeSheet === 'STATS' ? 'active' : ''}`}
        >
          통계_보고서
        </button>
        <button 
          onClick={() => setActiveSheet('LEADERBOARD')}
          className={`office-tab whitespace-nowrap px-4 h-full flex items-center justify-center ${activeSheet === 'LEADERBOARD' ? 'active' : ''}`}
        >
          명예의_전당
        </button>
        <button 
          onClick={() => setActiveSheet('HELP')}
          className={`office-tab whitespace-nowrap px-4 h-full flex items-center justify-center ${activeSheet === 'HELP' ? 'active' : ''}`}
        >
          설정
        </button>
        <button 
          onClick={() => setShowSystemLogs(!showSystemLogs)}
          className={`office-tab whitespace-nowrap px-4 h-full flex items-center justify-center gap-1 ${showSystemLogs ? 'text-blue-600 font-bold' : 'text-gray-400'}`}
        >
          {showSystemLogs ? <Eye size={12} /> : <EyeOff size={12} />}
          로그_창
        </button>
        <div className="flex-1 min-w-[20px]" />
        <div className="px-4 text-[9px] text-[#999] flex items-center gap-3 whitespace-nowrap shrink-0">
          <span className="hidden sm:inline">{
            session.status === SessionStatus.LOBBY ? '대기실' :
            session.status === SessionStatus.REVEAL ? '역할_확인' :
            session.status === SessionStatus.PLAYING ? '진행_중' :
            session.status === SessionStatus.VOTING ? '투표_중' :
            session.status === SessionStatus.NIGHT ? '밤 (행동_중)' :
            session.status === SessionStatus.SUMMARY ? '결과_보고' : session.status
          }</span>
          <div className="h-3 w-px bg-[#d1d1d1] hidden sm:block" />
          <span>준비됨</span>
        </div>
      </footer>

      {/* Chat Component */}
      <Chat 
        session={session} 
        currentUser={currentUser} 
        nickname={session.players?.[currentUser?.uid]?.nickname || nickname}
        isSpectator={isSpectator}
      />
      {session && showSystemLogs && <LogTicker logs={session.logs} />}
    </div>
  );
}
