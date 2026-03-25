import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Wallet, 
  Shield, 
  RefreshCw, 
  ArrowRight, 
  Sparkles, 
  Skull, 
  Zap, 
  Coins, 
  ShoppingBag, 
  Info,
  ChevronRight,
  History,
  AlertTriangle,
  Ghost,
  Ticket,
  Receipt,
  ArrowUpRight
} from 'lucide-react';
import { COSMIC_ITEMS, CosmicItem } from '../data/cosmicJackpotItems';

// --- Types & Constants ---

type GamePhase = 'SHOP' | 'TURN_SELECTION' | 'SLOT' | 'GAMEOVER' | 'WHISPER';

interface Symbol {
  id: string;
  name: string;
  value: number;
  weight: number;
  icon: string;
  isSkull?: boolean;
}

interface SlotCell {
  symbol: Symbol;
  hasBattery: boolean;
}

const SYMBOLS: Symbol[] = [
  { id: 'cherry', name: '체리', value: 2, weight: 1.3, icon: '🍒' },
  { id: 'lemon', name: '레몬', value: 2, weight: 1.3, icon: '🍋' },
  { id: 'clover', name: '클로버', value: 3, weight: 1.0, icon: '🍀' },
  { id: 'bell', name: '종', value: 3, weight: 1.0, icon: '🔔' },
  { id: 'diamond', name: '다이아', value: 5, weight: 0.8, icon: '💎' },
  { id: 'treasure', name: '보물', value: 5, weight: 0.8, icon: '💰' },
  { id: 'seven', name: '세븐', value: 7, weight: 0.5, icon: '7️⃣' },
  { id: 'skull', name: '해골', value: 0, weight: 0.015, icon: '💀', isSkull: true },
  { id: 'boss', name: '보스', value: 100, weight: 0.005, icon: '👾' },
];

const ROWS = 3;
const COLS = 5;

// --- Utilities ---

const formatKoreanNumber = (num: bigint): string => {
  if (num === 0n) return '0';
  const units = ['', '만', '억', '조', '경', '해', '자', '양', '구', '간', '정', '재', '극'];
  let result = '';
  let temp = num;
  let unitIdx = 0;

  while (temp > 0n && unitIdx < units.length) {
    const part = temp % 10000n;
    if (part > 0n) {
      result = `${part}${units[unitIdx]} ${result}`;
    }
    temp = temp / 10000n;
    unitIdx++;
  }
  return result.trim() || '0';
};

const getWeightedRandomSymbol = (
  skullModifier: number = 1, 
  isBoss: boolean = false, 
  weightModifiers: Record<string, number> = {}
): Symbol => {
  const symbols = isBoss ? SYMBOLS : SYMBOLS.filter(s => s.id !== 'boss');
  
  const getEffectiveWeight = (s: Symbol) => {
    let weight = s.isSkull ? s.weight * skullModifier : s.weight;
    const mod = weightModifiers[s.id] || 1.0;
    return weight * mod;
  };

  const totalWeight = symbols.reduce((acc, s) => acc + getEffectiveWeight(s), 0);
  let random = Math.random() * totalWeight;
  
  for (const s of symbols) {
    const weight = getEffectiveWeight(s);
    if (random < weight) return s;
    random -= weight;
  }
  return symbols[0];
};

// --- Main Component ---

interface CosmicJackpotProps {
  onGameOver?: () => void;
  onClear?: () => void;
}

export const CosmicJackpot: React.FC<CosmicJackpotProps> = ({ onGameOver, onClear }) => {
  // Game State
  const [phase, setPhase] = useState<GamePhase>('TURN_SELECTION');
  const [showShopModal, setShowShopModal] = useState(false);
  const [round, setRound] = useState(1);
  const [money, setMoney] = useState<bigint>(1000n);
  const [atm, setAtm] = useState<bigint>(0n);
  const [coupons, setCoupons] = useState(5);
  const [quota, setQuota] = useState<bigint>(250n);
  const [turn, setTurn] = useState(0);
  const [maxTurns, setMaxTurns] = useState(0);
  const [selectedTurnMode, setSelectedTurnMode] = useState<number>(7);
  
  // Slot State
  const [grid, setGrid] = useState<SlotCell[][]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningCols, setSpinningCols] = useState<boolean[]>([false, false, false, false, false]);
  const [teasingCols, setTeasingCols] = useState<boolean[]>([false, false, false, false, false]);
  const [hoveredBeltIndex, setHoveredBeltIndex] = useState<number | null>(null);
  const [lastSpinTotal, setLastSpinTotal] = useState<bigint>(0n);
  const [displayMoney, setDisplayMoney] = useState<bigint>(1000n);
  const [isCountingUp, setIsCountingUp] = useState(false);
  const [receipt, setReceipt] = useState<{ name: string; value: string; amount: bigint; type: string }[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);
  const [spinsCount, setSpinsCount] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0n);
  const [roundMultiplier, setRoundMultiplier] = useState(1.0);
  const [symbolWeightModifiers, setSymbolWeightModifiers] = useState<Record<string, number>>({});
  const [winningPatterns, setWinningPatterns] = useState<{ type: string; coords: { r: number; c: number }[]; amount: bigint; multiplier: number }[]>([]);
  const [comboPopups, setComboPopups] = useState<{ id: string; text: string; amount: bigint; x: number; y: number }[]>([]);
  
  // Active Item State
  const [activeGauges, setActiveGauges] = useState<Record<string, number>>({});
  const [growthStats, setGrowthStats] = useState({
    snowballMult: 1.0,
    piggyBankSavings: 0n
  });

  // --- Count-up Animation ---
  useEffect(() => {
    const targetMoney = BigInt(money);
    const currentDisplay = BigInt(displayMoney);
    if (currentDisplay === targetMoney) return;
    
    const diff = targetMoney - currentDisplay;
    let step = diff / 10n;
    if (step === 0n && diff !== 0n) {
      step = diff > 0n ? 1n : -1n;
    }
    if (step === 0n) return;

    const timer = setTimeout(() => {
      setIsCountingUp(true);
      setDisplayMoney(prev => {
        // Faster count-up: use a larger step or smaller interval
        // Let's use 20% of the diff as step for "crazy fast" feel
        const fastStep = diff / 5n;
        const finalStep = fastStep === 0n ? (diff > 0n ? 1n : -1n) : fastStep;
        
        const next = prev + finalStep;
        if ((diff > 0n && next > targetMoney) || (diff < 0n && next < targetMoney)) {
          setIsCountingUp(false);
          return targetMoney;
        }
        return next;
      });
    }, 10); // 10ms instead of 20ms
    return () => clearTimeout(timer);
  }, [money, displayMoney]);
  
  // Items & Shop
  const [belt, setBelt] = useState<(CosmicItem | null)[]>(new Array(6).fill(null));
  const [beltSize, setBeltSize] = useState(6);
  const [shopItems, setShopItems] = useState<CosmicItem[]>([]);
  const [rerollCost, setRerollCost] = useState(100n);
  const [loading, setLoading] = useState(false);
  
  // Effects & Events
  const [whisperOptions, setWhisperOptions] = useState<any[]>([]);
  const [skullModifier, setSkullModifier] = useState(1);
  const [globalMultiplier, setGlobalMultiplier] = useState(1.0);
  const [isBossChallenge, setIsBossChallenge] = useState(false);
  const [shake, setShake] = useState(false);
  const [selectedBeltIndex, setSelectedBeltIndex] = useState<number | null>(null);

  const [floatingTexts, setFloatingTexts] = useState<{ id: string; text: string; x: number; y: number; isJackpot?: boolean }[]>([]);
  const [showBigWin, setShowBigWin] = useState(false);

  const addFloatingText = useCallback((text: string, x: number = 50, y: number = 50, isJackpot: boolean = false) => {
    const id = Math.random().toString();
    setFloatingTexts(prev => [...prev, { id, text, x, y, isJackpot }]);
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
    }, 3000); // 3 seconds to ensure animation finishes
  }, []);

  // --- Count-up Animation ---
  const spinCost = 100n * BigInt(round);
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Keyboard Listener ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && phase === 'SLOT' && !isSpinning && turn > 0 && money >= spinCost) {
        e.preventDefault();
        spin();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, isSpinning, turn, money, spinCost]);

  // --- Logic ---

  const generateShop = useCallback(() => {
    // Get IDs of items already in the belt (stripping the unique suffix if present)
    const beltItemIds = belt
      .filter((item): item is CosmicItem => item !== null)
      .map(item => item.id.split('_')[0]);

    // Filter available items to exclude those already in the belt
    const availableItems = COSMIC_ITEMS.filter(item => !beltItemIds.includes(item.id));

    if (availableItems.length === 0) {
      setShopItems([]);
      return;
    }

    // Shuffle and pick up to 3
    const shuffled = [...availableItems].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3).map(item => ({
      ...item,
      id: `${item.id}_${Math.random().toString(36).substr(2, 9)}`
    }));

    setShopItems(selected);
  }, [belt]);

  useEffect(() => {
    if (showShopModal && shopItems.length === 0) {
      generateShop();
    }
  }, [showShopModal, shopItems.length, generateShop]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const [symbolValueModifiers, setSymbolValueModifiers] = useState<Record<string, number>>({});

  const getSymbolValue = (symbol: Symbol) => {
    return BigInt(symbol.value + (symbolValueModifiers[symbol.id] || 0));
  };

  const calculateSynergy = (currentGrid: SlotCell[][], currentBelt: (CosmicItem | null)[] = belt) => {
    let baseValue = 0n;
    const steps: any[] = [];
    const patterns: any[] = [];
    let skullCount = 0;
    let batteryCount = 0;

    // 1. Base Value Calculation
    currentGrid.forEach(col => {
      col.forEach(cell => {
        const symbol = cell.symbol;
        if (symbol.isSkull) skullCount++;
        if (cell.hasBattery) batteryCount++;

        let val = getSymbolValue(symbol);
        
        // Item Effect: Lucky Clover
        if (symbol.id === 'clover' && currentBelt.some(i => i?.id === 'lucky_clover')) {
          val += 5n; // Buffed from +2 to +5
        }
        
        baseValue += val;
      });
    });

    // Add Growth Base Bonuses
    currentBelt.forEach(item => {
      if (!item) return;
      if (item.id === 'golden_fertilizer' && item.currentBaseBonus && item.currentBaseBonus > 0) {
        baseValue += BigInt(item.currentBaseBonus);
      }
      if (item.id === 'greedy_pickaxe' && item.currentBaseBonus && item.currentBaseBonus > 0) {
        baseValue += BigInt(item.currentBaseBonus);
      }
    });

    steps.push({ name: '심볼 기본 합계', value: baseValue.toString(), amount: baseValue, type: 'base' });

    // 2. Skull Penalty (Instant Loss if 3+)
    if (skullCount >= 3) {
      steps.push({ name: '해골 3개 (수익 몰수)', value: '0', amount: 0n, type: 'penalty' });
      triggerShake();
      return { total: 0n, steps, batteryCount, popups: [], patterns: [] };
    }

    let totalMultiplier = 1.0;

    // 3. Pattern Recognition (Horizontal, Vertical, Diagonal)
    const patternBonus = currentBelt.some(i => i?.id === 'magnifying_glass') ? 0.5 : 0.0;
    
    // Horizontal: 3+ consecutive in a row
    for (let r = 0; r < ROWS; r++) {
      let count = 1;
      let lastId = currentGrid[0][r].symbol.id;
      let startCol = 0;

      for (let c = 1; c < COLS; c++) {
        if (currentGrid[c][r].symbol.id === lastId && !currentGrid[c][r].symbol.isSkull) {
          count++;
        } else {
          if (count >= 3) {
            let m = count === 3 ? 2.0 : (count === 4 ? 5.0 : 20.0);
            m += patternBonus;
            totalMultiplier *= m;
            const patternName = `가로 ${count}콤보 (${currentGrid[startCol][r].symbol.name})`;
            steps.push({ name: patternName, value: `x${m.toFixed(1)}`, type: 'pattern' });
            patterns.push({ 
              type: 'horizontal', 
              coords: Array(count).fill(0).map((_, i) => ({ r, c: startCol + i })), 
              multiplier: m,
              name: patternName
            });
          }
          count = 1;
          lastId = currentGrid[c][r].symbol.id;
          startCol = c;
        }
      }
      if (count >= 3) {
        let m = count === 3 ? 2.0 : (count === 4 ? 5.0 : 20.0);
        m += patternBonus;
        totalMultiplier *= m;
        const patternName = `가로 ${count}콤보 (${currentGrid[startCol][r].symbol.name})`;
        steps.push({ name: patternName, value: `x${m.toFixed(1)}`, type: 'pattern' });
        patterns.push({ 
          type: 'horizontal', 
          coords: Array(count).fill(0).map((_, i) => ({ r, c: startCol + i })), 
          multiplier: m,
          name: patternName
        });
      }
    }

    // Vertical: 3 in a column (Full Column)
    for (let c = 0; c < COLS; c++) {
      const colSymbols = currentGrid[c].map(cell => cell.symbol);
      const firstId = colSymbols[0].id;
      if (colSymbols.every(s => s.id === firstId && !s.isSkull)) {
        let m = 4.0;
        m += patternBonus;
        totalMultiplier *= m;
        const patternName = `세로 퍼펙트 (${colSymbols[0].name})`;
        steps.push({ name: patternName, value: `x${m.toFixed(1)}`, type: 'pattern' });
        patterns.push({ 
          type: 'vertical', 
          coords: Array(ROWS).fill(0).map((_, r) => ({ r, c })), 
          multiplier: m,
          name: patternName
        });
      }
    }

    // Diagonal (3x3 area check for diagonals)
    for (let c = 0; c <= COLS - 3; c++) {
      // Downwards diagonal
      if (currentGrid[c][0].symbol.id === currentGrid[c+1][1].symbol.id && 
          currentGrid[c+1][1].symbol.id === currentGrid[c+2][2].symbol.id && 
          !currentGrid[c][0].symbol.isSkull) {
        let m = 10.0;
        m += patternBonus;
        totalMultiplier *= m;
        const patternName = `대각선 콤보 (↘)`;
        steps.push({ name: patternName, value: `x${m.toFixed(1)}`, type: 'pattern' });
        patterns.push({ 
          type: 'diagonal', 
          coords: [{ r: 0, c }, { r: 1, c: c+1 }, { r: 2, c: c+2 }], 
          multiplier: m,
          name: patternName
        });
      }
      // Upwards diagonal
      if (currentGrid[c][2].symbol.id === currentGrid[c+1][1].symbol.id && 
          currentGrid[c+1][1].symbol.id === currentGrid[c+2][0].symbol.id && 
          !currentGrid[c][2].symbol.isSkull) {
        let m = 10.0;
        m += patternBonus;
        totalMultiplier *= m;
        const patternName = `대각선 콤보 (↗)`;
        steps.push({ name: patternName, value: `x${m.toFixed(1)}`, type: 'pattern' });
        patterns.push({ 
          type: 'diagonal', 
          coords: [{ r: 2, c }, { r: 1, c: c+1 }, { r: 0, c: c+2 }], 
          multiplier: m,
          name: patternName
        });
      }
    }

    // 4. Item Synergy Multipliers
    currentBelt.forEach(item => {
      if (!item) return;
      
      // Diamond Polisher: x3 for Diamonds
      if (item.id === 'diamond_polisher' && currentGrid.some(c => c.some(cell => cell.symbol.id === 'diamond'))) {
        totalMultiplier *= 3.0;
        steps.push({ name: '다이아 광택기', value: 'x3.0', type: 'item' });
      }
      
      // Cosmic Engine: Global x2
      if (item.id === 'cosmic_engine') {
        totalMultiplier *= 2.0;
        steps.push({ name: '우주 엔진', value: 'x2.0', type: 'item' });
      }
      
      // Snowball: Growth Multiplier
      if (item.id === 'snowball' && growthStats.snowballMult > 1.0) {
        totalMultiplier *= growthStats.snowballMult;
        steps.push({ name: '스노우볼 누적', value: `x${growthStats.snowballMult.toFixed(1)}`, type: 'item' });
      }

      // Seven Heaven: x50 for 7s if in a pattern
      if (item.id === 'seven_heaven' && patterns.some(p => currentGrid[p.coords[0].c][p.coords[0].r].symbol.id === 'seven')) {
        totalMultiplier *= 50.0;
        steps.push({ name: '세븐 헤븐 (잭팟!)', value: 'x50.0', type: 'item' });
      }

      // Golden Ticket: x0.1 per 10000 in ATM
      if (item.id === 'golden_ticket') {
        const ticketMult = 1.0 + Number(atm / 10000n) * 0.1;
        if (ticketMult > 1.0) {
          totalMultiplier *= ticketMult;
          steps.push({ name: '황금 티켓', value: `x${ticketMult.toFixed(1)}`, type: 'item' });
        }
      }
    });

    // 5. Global & Round Multipliers
    if (globalMultiplier !== 1.0) {
      totalMultiplier *= globalMultiplier;
      steps.push({ name: '전역 배수 (속삭임)', value: `x${globalMultiplier.toFixed(1)}`, type: 'global' });
    }
    
    if (roundMultiplier !== 1.0) {
      totalMultiplier *= roundMultiplier;
      steps.push({ name: '라운드 전략 배수', value: `x${roundMultiplier.toFixed(1)}`, type: 'global' });
    }

    // Add Growth Multiplier Bonuses
    currentBelt.forEach(item => {
      if (!item) return;
      if (item.id === 'compound_bankbook' && item.currentMultiplierBonus && item.currentMultiplierBonus > 1.0) {
        totalMultiplier *= item.currentMultiplierBonus;
        steps.push({ name: '복리 적금 통장', value: `x${item.currentMultiplierBonus.toFixed(1)}`, type: 'item' });
      }
      if (item.id === 'patient_snail' && item.currentMultiplierBonus && item.currentMultiplierBonus > 1.0) {
        totalMultiplier *= item.currentMultiplierBonus;
        steps.push({ name: '인내의 달팽이', value: `x${item.currentMultiplierBonus.toFixed(1)}`, type: 'item' });
      }
    });

    // Tiered Jackpot & Critical Multiplier
    let finalMultiplier = totalMultiplier;
    let criticalLog = '';
    let jackpotTier = 0;
    
    if (totalMultiplier >= 100.0) {
      jackpotTier = 3;
      if (Math.random() < 0.5) {
        finalMultiplier *= 10.0;
        criticalLog = '🎲 [크리티컬 판정] COSMIC 잭팟 추가 배수 당첨! (x10)';
      }
    } else if (totalMultiplier >= 30.0) {
      jackpotTier = 2;
      if (Math.random() < 0.3) {
        finalMultiplier *= 3.0;
        criticalLog = '🎲 [크리티컬 판정] SUPER 잭팟 추가 배수 당첨! (x3)';
      }
    } else if (totalMultiplier >= 10.0) {
      jackpotTier = 1;
      if (Math.random() < 0.2) {
        finalMultiplier *= 2.0;
        criticalLog = '🎲 [크리티컬 판정] NICE 잭팟 추가 배수 당첨! (x2)';
      }
    }

    if (criticalLog) {
      console.log(criticalLog);
      triggerShake();
      steps.push({ name: '크리티컬 힛!', value: `x${(finalMultiplier / totalMultiplier).toFixed(1)}`, type: 'global' });
    }

    // Final Calculation using BigInt fixed-point
    const finalTotal = (baseValue * BigInt(Math.round(finalMultiplier * 1000))) / 1000n;
    
    const popups = patterns.map((p) => ({
      id: Math.random().toString(),
      text: `${p.name} x${p.multiplier.toFixed(1)}`,
      amount: (baseValue * BigInt(Math.round(p.multiplier * 1000))) / 1000n,
      x: p.coords[Math.floor(p.coords.length / 2)].c * 20 + 10,
      y: p.coords[Math.floor(p.coords.length / 2)].r * 33 + 15
    }));

    // 6. Growth: Piggy Bank
    if (currentBelt.some(i => i?.id === 'piggy_bank')) {
      const savings = finalTotal / 20n; // 5%
      steps.push({ name: '저금통 적립 (5%)', value: `-${formatKoreanNumber(savings)}`, type: 'growth' });
    }

    return { total: finalTotal, steps, batteryCount, popups, patterns, jackpotTier, criticalLog, finalMultiplier, totalMultiplier };
  };

  const spin = async () => {
    if (isSpinning || turn <= 0) return;

    // Softlock Prevention: Auto-withdraw from ATM if Wallet is low
    let currentMoney = money;
    if (currentMoney < spinCost) {
      const needed = spinCost - currentMoney;
      if (atm >= needed) {
        setAtm(prev => prev - needed);
        setMoney(prev => prev + needed);
        currentMoney += needed;
        // Trigger a small visual feedback for auto-withdraw
        addFloatingText(`ATM에서 ${formatKoreanNumber(needed)}원 인출`, 50 + (Math.random() * 10 - 5), 50 + (Math.random() * 10 - 5));
      } else {
        // Truly cannot afford
        return;
      }
    }

    setIsSpinning(true);
    const nextTurn = turn - 1;
    setTurn(nextTurn);
    setMoney(prev => prev - spinCost);
    setShowReceipt(false);
    setReceipt([]);
    setWinningPatterns([]);
    setComboPopups([]);

    // Calculate effective weight modifiers from Whispers and Items
    const effectiveWeightModifiers = { ...symbolWeightModifiers };
    belt.forEach(item => {
      if (!item) return;
      if (item.id === 'cherry_eraser') {
        effectiveWeightModifiers['skull'] = (effectiveWeightModifiers['skull'] || 1.0) * 0.5;
      }
      if (item.trait === 'symbol_boost' && item.symbolId) {
        effectiveWeightModifiers[item.symbolId] = (effectiveWeightModifiers[item.symbolId] || 1.0) * (item.boostAmount || 1.5);
      }
      if (item.trait === 'symbol_nerf' && item.symbolId) {
        effectiveWeightModifiers[item.symbolId] = (effectiveWeightModifiers[item.symbolId] || 1.0) * (item.nerfAmount || 0.5);
      }
    });

    console.log('[RNG] Effective Weight Modifiers for this spin:', effectiveWeightModifiers);

    // Pre-calculate the entire result
    const finalGrid = Array(COLS).fill(0).map(() => 
      Array(ROWS).fill(0).map(() => ({
        symbol: getWeightedRandomSymbol(skullModifier, isBossChallenge, effectiveWeightModifiers),
        hasBattery: Math.random() < 0.1
      }))
    );

    // Start spinning
    setSpinningCols([true, true, true, true, true]);
    setTeasingCols([false, false, false, false, false]);

    // Sequential stop
    for (let i = 0; i < COLS; i++) {
      // Fast spin: 0.1s - 0.3s base
      let waitTime = 100 + i * 100; 
      
      // Teasing logic: If columns 0-2 have jackpot symbols (e.g., '7')
      if (i >= 3) {
        const isTeasing = finalGrid[0].some((cell, rowIdx) => {
          const firstId = cell.symbol.id;
          // Check if previous columns have the same symbol in the same row
          return finalGrid.slice(0, i).every(col => col[rowIdx].symbol.id === firstId && firstId === 'seven');
        });
        
        if (isTeasing) {
          setTeasingCols(prev => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
          waitTime += 1500; // Extra time for teasing
        }
      }

      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Update the grid for this column only
      setGrid(prev => {
        const next = [...prev];
        next[i] = finalGrid[i];
        return next;
      });

      setSpinningCols(prev => {
        const next = [...prev];
        next[i] = false;
        return next;
      });
      setTeasingCols(prev => {
        const next = [...prev];
        next[i] = false;
        return next;
      });
    }

    setIsSpinning(false);
    setSpinsCount(prev => prev + 1);

    // Update Growth Items
    let gemCount = 0;
    finalGrid.forEach(col => col.forEach(cell => {
      if (cell.symbol.id === 'gem') gemCount++;
    }));

    const updatedBelt = belt.map(item => {
      if (!item) return item;
      let updatedItem = { ...item };
      
      if (item.id === 'golden_fertilizer') {
        updatedItem.currentBaseBonus = (updatedItem.currentBaseBonus || 0) + 1;
      }
      if (item.id === 'greedy_pickaxe' && gemCount > 0) {
        updatedItem.currentBaseBonus = (updatedItem.currentBaseBonus || 0) + (5 * gemCount);
      }
      
      return updatedItem;
    });
    setBelt(updatedBelt);

    // Calculate
    const { total, steps, batteryCount, popups, patterns, jackpotTier, criticalLog, finalMultiplier, totalMultiplier } = calculateSynergy(finalGrid, updatedBelt);
    
    // Sequential Popups (Chain Reaction Burst)
    if (popups.length > 0) {
      setWinningPatterns(patterns); 
      for (let i = 0; i < popups.length; i++) {
        setComboPopups(prev => [...prev, popups[i]]);
        await new Promise(resolve => setTimeout(resolve, 300)); // 0.3s interval for more impact
      }
      
      setTimeout(() => {
        setWinningPatterns([]);
        setComboPopups([]);
      }, 2000);
    }

    if (jackpotTier > 0) {
      let jackpotText = '';
      if (jackpotTier === 3) jackpotText = 'COSMIC 잭팟!!!';
      else if (jackpotTier === 2) jackpotText = 'SUPER 잭팟!!';
      else if (jackpotTier === 1) jackpotText = 'NICE 잭팟!';

      if (criticalLog) {
        jackpotText += ` x${finalMultiplier / totalMultiplier} 연속 폭발!!`;
      }
      
      addFloatingText(jackpotText, 50, 50, true);
    }

    setLastSpinTotal(total);
    setReceipt(steps);
    setMoney(prev => prev + total);
    setTotalEarnings(prev => prev + total);
    setShowReceipt(true);

    if (total > quota * 2n) {
      setShowBigWin(true);
      setTimeout(() => setShowBigWin(false), 3000);
    }

    if (total > quota * 10n) triggerShake(); // Stronger shake for big wins
    if (batteryCount > 0) {
      const batteryMult = belt.some(i => i?.id === 'battery_pack') ? 1.2 : 1.0;
      const charge = Math.floor(batteryCount * batteryMult);
      setActiveGauges(prev => {
        const next = { ...prev };
        belt.forEach(item => {
          if (item?.type === 'active') {
            next[item.id] = Math.min((next[item.id] || 0) + charge, item.maxGauge || 10);
          }
        });
        return next;
      });
    }

    // Update Growth: Snowball
    if (total > 0n && belt.some(i => i?.id === 'snowball')) {
      setGrowthStats(prev => ({ ...prev, snowballMult: prev.snowballMult + 0.5 }));
    }

    // Update Growth: Piggy Bank
    if (total > 0n && belt.some(i => i?.id === 'piggy_bank')) {
      const savings = total * 5n / 100n;
      setGrowthStats(prev => ({ ...prev, piggyBankSavings: prev.piggyBankSavings + savings }));
    }

    if (total > quota / 2n) triggerShake();

    // Auto-submit if turns reach 0
    if (nextTurn === 0) {
      setTimeout(() => {
        handleSubmit();
      }, 2500); // Wait for animations and receipt
    }
  };

  const selectTurns = (count: number) => {
    setTurn(count);
    setMaxTurns(count);
    setSelectedTurnMode(count);
    setRoundMultiplier(count === 3 ? 1.5 : 1.0);
    setShowShopModal(false);
    setPhase('SLOT');
    setGrid(Array(COLS).fill(0).map(() => Array(ROWS).fill({ symbol: SYMBOLS[0], hasBattery: false })));
  };

  const buyItem = (item: CosmicItem) => {
    if (coupons < item.cost) return;
    
    // Find empty slot
    const emptyIdx = belt.indexOf(null);
    if (emptyIdx === -1) {
      alert('벨트가 가득 찼습니다! 아이템을 판매하거나 교체하세요.');
      return;
    }

    const newBelt = [...belt];
    let purchasedItem = { ...item };
    
    // Initialize growth stats if they exist
    if (purchasedItem.currentBaseBonus !== undefined) {
      purchasedItem.currentBaseBonus = purchasedItem.currentBaseBonus; // Keep initial value from definition
    }
    if (purchasedItem.currentMultiplierBonus !== undefined) {
      purchasedItem.currentMultiplierBonus = purchasedItem.currentMultiplierBonus; // Keep initial value from definition
    }

    newBelt[emptyIdx] = purchasedItem;
    setBelt(newBelt);
    setCoupons(prev => prev - item.cost);
    setShopItems(prev => prev.filter(i => i.id !== item.id));

    // Special item effects
    if (item.id === 'legendary_vvip_card') {
      setRerollCost(0n);
    }
  };

  const sellItem = (index: number) => {
    const item = belt[index];
    if (!item) return;

    const sellPrice = 1; // Refund 1 coupon
    setCoupons(prev => prev + sellPrice);

    // Filter out the sold item and re-pad with nulls to maintain belt size
    const filteredBelt = belt.filter((_, i) => i !== index).filter(i => i !== null);
    const newBelt = [...filteredBelt];
    while (newBelt.length < beltSize) {
      newBelt.push(null);
    }
    
    setBelt(newBelt);
    setSelectedBeltIndex(null);
  };

  const rerollShop = () => {
    if (money < rerollCost) return;
    setMoney(prev => prev - rerollCost);
    setRerollCost(prev => prev * 2n);
    generateShop();

    // Growth: Patient Snail
    setBelt(prev => prev.map(item => {
      if (item?.id === 'patient_snail') {
        return {
          ...item,
          currentMultiplierBonus: (item.currentMultiplierBonus || 1.0) + 0.5
        };
      }
      return item;
    }));
  };

  const depositSmartToAtm = () => {
    const keepAmount = BigInt(turn) * spinCost;
    if (money > keepAmount) {
      const depositAmount = money - keepAmount;
      setMoney(keepAmount);
      setAtm(prev => prev + depositAmount);
      addFloatingText(`${formatKoreanNumber(depositAmount)}원 입금 완료 (스핀 비용 제외)`, 80 + (Math.random() * 10 - 5), 80 + (Math.random() * 10 - 5));
    }
  };

  const handleSubmit = () => {
    const totalAvailable = money + atm + growthStats.piggyBankSavings;
    
    if (totalAvailable >= quota) {
      // 1. Quota Deduction (Only Quota amount)
      let remainingQuota = quota;
      
      // Deduct from savings first
      const savingsUsed = growthStats.piggyBankSavings >= remainingQuota ? remainingQuota : growthStats.piggyBankSavings;
      remainingQuota -= savingsUsed;
      
      // Deduct from Wallet
      const walletUsed = money >= remainingQuota ? remainingQuota : money;
      remainingQuota -= walletUsed;
      
      // Deduct from ATM
      const atmUsed = remainingQuota;
      
      const newMoney = money - walletUsed;
      const newAtm = atm - atmUsed;
      
      setMoney(newMoney);
      setAtm(newAtm);
      setGrowthStats(prev => ({ ...prev, piggyBankSavings: 0n }));

      // 2. Early Submission Bonus
      const baseCoupons = selectedTurnMode === 3 ? 2 : 1;
      const bonusCoupons = turn * (selectedTurnMode === 3 ? 2 : 1);
      const totalCoupons = baseCoupons + bonusCoupons;
      setCoupons(prev => prev + totalCoupons);

      // Growth: Compound Bankbook
      if (turn > 0) {
        setBelt(prev => prev.map(item => {
          if (item?.id === 'compound_bankbook') {
            return {
              ...item,
              currentMultiplierBonus: (item.currentMultiplierBonus || 1.0) + 0.1
            };
          }
          return item;
        }));
      }

      // 3. Transition to Whisper
      setTurn(0);
      const nextRound = round + 1;
      setRound(nextRound);
      
      if (nextRound % 5 === 0) {
        setIsBossChallenge(true);
        setQuota(quota * 10n);
      } else {
        setIsBossChallenge(false);
        setQuota(quota * 15n / 10n + 500n);
      }
      
      generateWhispers();
      setShowShopModal(false);
      setPhase('WHISPER');
      setShopItems([]); 
      
      // Visual feedback for coupons
      if (totalCoupons > 0) {
        addFloatingText(`조기 제출 보상: 쿠폰 +${totalCoupons}장!`, 50 + (Math.random() * 10 - 5), 40 + (Math.random() * 10 - 5));
      }
    } else {
      setShowShopModal(false);
      if (onGameOver) onGameOver();
      setPhase('GAMEOVER');
    }
  };

  const generateWhispers = () => {
    const symbolsToBoost = SYMBOLS.filter(s => s.id !== 'skull' && s.id !== 'boss');
    
    const weightOptions = symbolsToBoost.flatMap(s => [
      {
        id: `w_boost_${s.id}`,
        title: `${s.name}의 부름`,
        description: `${s.name} 심볼이 등장할 확률이 2배 증가합니다.`,
        type: 'normal',
        rarity: 'Uncommon',
        effect: () => {
          setSymbolWeightModifiers(prev => ({ ...prev, [s.id]: (prev[s.id] || 1.0) * 2.0 }));
        }
      },
      {
        id: `w_nerf_${s.id}`,
        title: `${s.name}의 침묵`,
        description: `${s.name} 심볼이 등장할 확률이 절반으로 감소합니다.`,
        type: 'normal',
        rarity: 'Common',
        effect: () => {
          setSymbolWeightModifiers(prev => ({ ...prev, [s.id]: (prev[s.id] || 1.0) * 0.5 }));
        }
      }
    ]);

    const allOptions = [
      ...weightOptions,
      {
        id: 'w1',
        title: '클로버의 축복',
        description: '클로버 심볼의 가치가 영구적으로 +20 증가합니다.',
        type: 'normal',
        rarity: 'Common',
        effect: () => {
          setSymbolValueModifiers(prev => ({ ...prev, clover: (prev.clover || 0) + 20 }));
        }
      },
      {
        id: 'w2',
        title: '악마의 계약',
        description: '해골 확률 10배 증가, 대신 모든 수익 x5.0배',
        type: 'devil',
        rarity: 'Rare',
        effect: () => {
          setSkullModifier(prev => prev * 10);
          setGlobalMultiplier(prev => prev * 5.0);
        }
      },
      {
        id: 'w3',
        title: '우주의 확장',
        description: '벨트 슬롯이 영구적으로 1칸 늘어납니다.',
        type: 'salvation',
        rarity: 'Legendary',
        effect: () => {
          setBeltSize(prev => prev + 1);
          setBelt(prev => [...prev, null]);
        }
      },
      {
        id: 'w4',
        title: '황금 종소리',
        description: '전역 배수가 영구적으로 x2.0배 증가합니다.',
        type: 'salvation',
        rarity: 'Rare',
        effect: () => {
          setGlobalMultiplier(prev => prev * 2.0);
        }
      },
      {
        id: 'w5',
        title: '복리의 마법',
        description: 'ATM 잔액이 즉시 50% 증가합니다.',
        type: 'growth',
        rarity: 'Epic',
        effect: () => {
          setAtm(prev => prev * 15n / 10n);
        }
      },
      {
        id: 'w6',
        title: '무한의 루프',
        description: '즉시 쿠폰 +3장을 획득합니다.',
        type: 'normal',
        rarity: 'Common',
        effect: () => {
          setCoupons(prev => prev + 3);
        }
      }
    ];
    
    // Pick 3 random options
    const shuffled = [...allOptions].sort(() => 0.5 - Math.random());
    setWhisperOptions(shuffled.slice(0, 3));
  };

  const selectWhisper = (option: any) => {
    option.effect();
    setShowShopModal(false);
    setPhase('TURN_SELECTION');
  };

  const resetGame = () => {
    setShowShopModal(false);
    setPhase('TURN_SELECTION');
    setRound(1);
    setMoney(1000n);
    setAtm(0n);
    setCoupons(5);
    setQuota(250n);
    setTurn(0);
    setMaxTurns(0);
    setGrid([]);
    setBelt(new Array(6).fill(null));
    setBeltSize(6);
    setShopItems([]);
    setRerollCost(100n);
    setSkullModifier(1);
    setGlobalMultiplier(1.0);
    setIsBossChallenge(false);
    setTotalEarnings(0n);
    setGrowthStats({ snowballMult: 1.0, piggyBankSavings: 0n });
    setActiveGauges({});
    setSpinsCount(0);
    setLastSpinTotal(0n);
    setDisplayMoney(1000n);
    setReceipt([]);
    setShowReceipt(false);
    setWinningPatterns([]);
    setComboPopups([]);
    setFloatingTexts([]);
    setSymbolValueModifiers({});
    setSymbolWeightModifiers({});
  };

  const startNextRound = () => {
    setShowShopModal(false);
    setPhase('TURN_SELECTION');
  };

  const activateItem = (item: CosmicItem) => {
    if ((activeGauges[item.id] || 0) < (item.maxGauge || 10)) return;
    
    setActiveGauges(prev => ({ ...prev, [item.id]: 0 }));
    
    if (item.id === 'time_rewinder') {
      setTurn(prev => prev + 3);
    } else if (item.id === 'coupon_printer') {
      setCoupons(prev => prev + 50);
    }
    
    triggerShake();
  };

  const depositToAtm = (amount: bigint) => {
    if (money < amount) return;
    setMoney(prev => prev - amount);
    setAtm(prev => prev + amount);
  };

  const withdrawFromAtm = (amount: bigint) => {
    if (atm < amount) return;
    setAtm(prev => prev - amount);
    setMoney(prev => prev + amount);
  };

  // --- Render Helpers ---

  const renderSlotCell = (cell: SlotCell, colIdx: number, rowIdx: number) => {
    const isSpinningCol = spinningCols[colIdx];
    const isTeasing = teasingCols[colIdx];
    
    // Check if this cell is part of a winning pattern
    const isWinning = winningPatterns.some(p => p.coords.some(c => c.r === rowIdx && c.c === colIdx));

    return (
      <div 
        key={`${colIdx}-${rowIdx}`}
        className={`jp-slot-cell ${isSpinningCol ? 'spinning' : ''} ${isTeasing ? 'teasing' : ''} ${isWinning ? 'winning-cell' : ''}`}
      >
        <AnimatePresence mode="wait">
          {!isSpinningCol ? (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', damping: 8, stiffness: 300 }}
              className="relative flex items-center justify-center h-full w-full"
            >
              <span className="text-4xl md:text-5xl z-10 drop-shadow-sm">{cell.symbol.icon}</span>
              {cell.hasBattery && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 z-20"
                >
                  <Zap size={16} className="text-yellow-400 fill-yellow-400 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" />
                </motion.div>
              )}
            </motion.div>
          ) : (
            <div className="reel-container">
              <motion.div 
                className="reel-strip"
                animate={{ y: [0, -1500] }}
                transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
              >
                {[...SYMBOLS, ...SYMBOLS, ...SYMBOLS, ...SYMBOLS].map((s, idx) => (
                  <div key={idx} className="reel-symbol blur-[1px] opacity-70">
                    {s.icon}
                  </div>
                ))}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderSymbolStats = () => {
    const symbols = isBossChallenge ? SYMBOLS : SYMBOLS.filter(s => s.id !== 'boss');
    
    const effectiveWeightModifiers = { ...symbolWeightModifiers };
    belt.forEach(item => {
      if (!item) return;
      if (item.id === 'cherry_eraser') {
        effectiveWeightModifiers['skull'] = (effectiveWeightModifiers['skull'] || 1.0) * 0.5;
      }
      if (item.trait === 'symbol_boost' && item.symbolId) {
        effectiveWeightModifiers[item.symbolId] = (effectiveWeightModifiers[item.symbolId] || 1.0) * (item.boostAmount || 1.5);
      }
      if (item.trait === 'symbol_nerf' && item.symbolId) {
        effectiveWeightModifiers[item.symbolId] = (effectiveWeightModifiers[item.symbolId] || 1.0) * (item.nerfAmount || 0.5);
      }
    });

    const getEffectiveWeight = (s: Symbol) => {
      let weight = s.isSkull ? s.weight * (skullModifier || 1) : s.weight;
      const mod = effectiveWeightModifiers[s.id] || 1.0;
      return weight * mod;
    };

    const totalWeight = symbols.reduce((acc, s) => acc + getEffectiveWeight(s), 0);

    return (
      <div className="bg-white border-4 border-[#E0D7C6] rounded-[32px] p-6 shadow-sm">
        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Symbol Probabilities & Values</h3>
        <div className="grid grid-cols-1 gap-2">
          {symbols.map(s => {
            const weight = getEffectiveWeight(s);
            const probability = (weight / totalWeight) * 100;
            const baseValue = s.value;
            const modValue = symbolValueModifiers[s.id] || 0;
            const totalValue = baseValue + modValue;
            
            return (
              <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#FFB7B2] transition-all">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{s.icon}</div>
                  <div className="text-[10px] font-bold text-gray-600">{s.name}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-black text-gray-700">{probability.toFixed(1)}%</span>
                    <span className="text-[9px] font-bold text-gray-400">Probability</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-black text-[#FFB7B2]">{totalValue}원</span>
                    <span className="text-[9px] font-bold text-gray-400">Value</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderBelt = () => (
    <div className="jp-slot-belt flex gap-3 overflow-x-auto no-scrollbar pt-32 pb-4 px-2 -mt-28">
      {belt.map((item, idx) => (
        <div key={idx} className="relative">
          <motion.div
            whileHover={{ scale: 1.05 }}
            onMouseEnter={() => setHoveredBeltIndex(idx)}
            onMouseLeave={() => setHoveredBeltIndex(null)}
            onClick={() => sellItem(idx)}
            className={`w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-[24px] border-4 flex flex-col items-center justify-center cursor-pointer transition-all relative ${
              selectedBeltIndex === idx ? 'border-[#FFB7B2] bg-[#FFB7B2]/10 shadow-md' : 'border-[#E0D7C6] bg-white'
            }`}
          >
            {item ? (
              <>
                <div className="text-2xl md:text-3xl">{item.icon}</div>
                {item.type === 'active' && (
                  <div className="absolute bottom-2 left-2 right-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-[#FFB7B2]"
                      initial={{ width: 0 }}
                      animate={{ width: `${((activeGauges[item.id] || 0) / (item.maxGauge || 10)) * 100}%` }}
                    />
                  </div>
                )}
                {item.type === 'active' && (activeGauges[item.id] || 0) >= (item.maxGauge || 10) && (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      activateItem(item);
                    }}
                    className="absolute -top-2 -right-2 bg-[#FFB7B2] text-white p-1.5 rounded-full shadow-lg z-30 border-2 border-white"
                  >
                    <Zap size={14} fill="white" />
                  </motion.button>
                )}
              </>
            ) : (
              <div className="text-gray-200 text-xl">+</div>
            )}
          </motion.div>

          {/* Tooltip */}
          <AnimatePresence>
            {hoveredBeltIndex === idx && item && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: -10, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className={`absolute bottom-full mb-2 w-48 bg-white p-4 rounded-2xl shadow-2xl border-2 border-[#E0D7C6] z-[9999] pointer-events-none ${
                  idx === 0 ? 'left-0 translate-x-0' : 
                  idx === belt.length - 1 ? 'right-0 translate-x-0' : 
                  'left-1/2 -translate-x-1/2'
                }`}
              >
                <div className="text-xs font-black text-[#FFB7B2] uppercase mb-1">{item.type}</div>
                <div className="text-sm font-black text-gray-700 mb-1">{item.name}</div>
                <div className="text-[10px] text-gray-500 leading-tight mb-2">{item.description}</div>
                {item.id === 'snowball' && (
                  <div className="text-[10px] font-bold text-[#B2E2F2]">Current Mult: x{growthStats.snowballMult.toFixed(1)}</div>
                )}
                {item.id === 'piggy_bank' && (
                  <div className="text-[10px] font-bold text-[#B2E2F2]">Savings: {formatKoreanNumber(growthStats.piggyBankSavings)}원</div>
                )}
                {item.currentBaseBonus !== undefined && (
                  <div className="text-[10px] font-bold text-[#B2E2F2]">누적 기본값: +{item.currentBaseBonus}</div>
                )}
                {item.currentMultiplierBonus !== undefined && (
                  <div className="text-[10px] font-bold text-[#B2E2F2]">누적 배수: x{item.currentMultiplierBonus.toFixed(1)}</div>
                )}
                <div className="mt-2 pt-2 border-t border-gray-100 text-[8px] text-gray-400 font-bold">CLICK TO SELL (+1장)</div>
                <div className={`tooltip-arrow ${
                  idx === 0 ? 'left-8 translate-x-0' : 
                  idx === belt.length - 1 ? 'left-auto right-8 translate-x-0' : 
                  'left-1/2 -translate-x-1/2'
                }`} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );

  // --- Main Render ---

  return (
    <div className={`jp-game-container ${shake ? 'shake' : ''}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=JetBrains+Mono:wght@400;700&display=swap');

        .jp-game-container {
          width: 100%;
          height: 100%;
          background: #FDFBF7;
          color: #4A4A4A;
          font-family: 'Inter', sans-serif;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }

        .jp-slot-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          background: #FFFFFF;
          padding: 20px;
          border-radius: 32px;
          border: 8px solid #E0D7C6;
          box-shadow: 0 10px 30px rgba(224, 215, 198, 0.4);
          position: relative;
          width: 100%;
          max-width: 900px;
          margin: 0 auto;
        }

        .reel-container {
          height: 100%;
          width: 100%;
          overflow: hidden;
          position: relative;
        }

        .reel-strip {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .reel-symbol {
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
        }

        .winning-cell {
          background: #FFF9E6 !important;
          border-color: #FFD700 !important;
          z-index: 5;
        }

        .pattern-ribbon {
          position: absolute;
          height: 12px;
          background: linear-gradient(90deg, #FFB7B2, #FFD700);
          border-radius: 6px;
          pointer-events: none;
          z-index: 10;
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.6);
        }

        .combo-bubble {
          position: absolute;
          background: white;
          border: 4px solid #FFB7B2;
          border-radius: 32px;
          padding: 12px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 20;
          box-shadow: 0 15px 30px rgba(255, 183, 178, 0.4);
          pointer-events: none;
        }

        .combo-bubble-text {
          font-weight: 900;
          color: #FFB7B2;
          font-size: 1.1rem;
          line-height: 1;
        }

        .combo-bubble-amount {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.8rem;
          color: #4A4A4A;
          margin-top: 2px;
        }

        .tooltip-arrow {
          position: absolute;
          bottom: -8px;
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid white;
        }

        .jp-slot-cell {
          aspect-ratio: 1;
          width: 100%;
          background: #F9F6F0;
          border-radius: 20px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
          border: 2px solid #F0EBE0;
        }

        .jp-slot-cell.teasing {
          box-shadow: inset 0 0 15px rgba(255, 182, 193, 0.8);
          border: 2px solid #FFB6C1;
          animation: teasingPulse 0.5s infinite alternate;
        }

        @keyframes teasingPulse {
          from { background: #F9F6F0; }
          to { background: #FFF0F5; }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        .shake {
          animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both;
        }

        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }

        .bounce-in {
          animation: bounceIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }

        .spinning .reel-animation {
          display: flex;
          flex-direction: column;
          animation: reelScroll 0.4s linear infinite;
        }

        @keyframes reelScroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-80%); }
        }

        .shake {
          animation: shakeEffect 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }

        @keyframes shakeEffect {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }

        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .receipt-line {
          display: flex;
          justify-content: space-between;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
          margin-bottom: 6px;
          color: #4A4A4A;
        }

        .pixel-art {
          image-rendering: pixelated;
        }

        .office-btn-cute {
          background: #FFB7B2;
          color: white;
          border-radius: 20px;
          box-shadow: 0 4px 0 #E5A49F;
          transition: all 0.1s;
        }

        .office-btn-cute:active {
          transform: translateY(4px);
          box-shadow: 0 0 0 #E5A49F;
        }

        .office-btn-blue {
          background: #B2E2F2;
          color: #4A4A4A;
          border-radius: 20px;
          box-shadow: 0 4px 0 #9FCAD9;
        }
      `}</style>

      {phase === 'TURN_SELECTION' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#FDFBF7] relative overflow-y-auto">
          <button
            onClick={() => setShowShopModal(true)}
            className="absolute top-6 right-6 bg-white px-4 py-2 rounded-full border-2 border-[#E0D7C6] text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
          >
            <span>🏪</span> 상점 보기
          </button>
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-12"
          >
            <div className="inline-block px-4 py-1 bg-[#FFB7B2] text-white rounded-full text-xs font-black mb-4 tracking-widest uppercase">Select Strategy</div>
            <h2 className="text-5xl font-black mb-2 tracking-tighter italic text-gray-800">ROUND {round}</h2>
            <div className="text-gray-400 font-mono text-sm">Target Quota: {formatKoreanNumber(quota)}원</div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl px-4">
            <motion.button
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => selectTurns(7)}
              className="relative p-10 rounded-[40px] bg-white border-4 border-[#B2E2F2] flex flex-col items-center text-center group shadow-[0_15px_30px_rgba(178,226,242,0.3)]"
            >
              <div className="w-20 h-20 bg-[#B2E2F2]/20 rounded-full flex items-center justify-center text-4xl mb-6 group-hover:rotate-12 transition-transform">🛡️</div>
              <div className="text-3xl font-black mb-2 text-gray-700">7 SPINS</div>
              <div className="text-[#9FCAD9] font-black text-lg mb-4">Standard: 0% Bonus</div>
              <div className="text-sm text-gray-400 leading-relaxed">기본 7턴이 제공됩니다.<br/>안정적인 운영이 가능합니다.</div>
              <div className="absolute -top-4 -right-4 bg-[#B2E2F2] text-white px-4 py-1 rounded-full text-[10px] font-black">SAFE</div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => selectTurns(3)}
              className="relative p-10 rounded-[40px] bg-white border-4 border-[#FFB7B2] flex flex-col items-center text-center group shadow-[0_15px_30px_rgba(255,183,178,0.3)]"
            >
              <div className="w-20 h-20 bg-[#FFB7B2]/20 rounded-full flex items-center justify-center text-4xl mb-6 group-hover:rotate-12 transition-transform">🔥</div>
              <div className="text-3xl font-black mb-2 text-gray-700">3 SPINS</div>
              <div className="text-[#FFB7B2] font-black text-lg mb-4">RISK! +50% PAYOUT</div>
              <div className="text-sm text-gray-400 leading-relaxed">턴이 3개로 줄어들지만,<br/>모든 당첨금이 1.5배가 됩니다!</div>
              <div className="absolute -top-4 -right-4 bg-[#FFB7B2] text-white px-4 py-1 rounded-full text-[10px] font-black">HIGH RETURN</div>
            </motion.button>
          </div>
        </div>
      )}

      {phase === 'SLOT' && (
        <div className="flex-1 flex flex-col p-4 md:p-8 max-w-4xl mx-auto w-full relative overflow-y-auto">
          {/* Header Stats */}
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4 mb-6 relative">
            <div className="flex justify-between w-full md:w-auto">
              <div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Wallet</div>
                <motion.div 
                  animate={{ 
                    scale: isCountingUp ? 1.2 : 1,
                    color: isCountingUp ? '#FFD700' : '#FFB7B2',
                    textShadow: isCountingUp ? '0 0 20px rgba(255, 215, 0, 0.8)' : 'none'
                  }}
                  className="text-2xl md:text-3xl font-black tracking-tighter"
                >
                  {formatKoreanNumber(displayMoney)}원
                </motion.div>
              </div>
              
              <div className="text-right md:hidden">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Turns Left</div>
                <div className="text-2xl font-black text-[#B2E2F2] tracking-tighter">{turn} / {maxTurns}</div>
              </div>
            </div>
            
            <button
              onClick={() => setShowShopModal(true)}
              disabled={isSpinning}
              className={`md:absolute md:left-1/2 md:-translate-x-1/2 md:bottom-0 bg-white px-4 py-2 rounded-full border-2 border-[#E0D7C6] text-gray-600 font-bold text-sm transition-colors shadow-sm flex items-center gap-2 z-10 w-full md:w-auto justify-center ${
                isSpinning ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
              }`}
            >
              <span>🏪</span> 상점 보기
            </button>

            <div className="text-right hidden md:block">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Turns Left</div>
              <div className="text-3xl font-black text-[#B2E2F2] tracking-tighter">{turn} / {maxTurns}</div>
            </div>
          </div>

          {/* Slot Area */}
          <div className="relative mb-8">
            <div className="jp-slot-grid">
              {Array(COLS).fill(0).map((_, c) => (
                <div key={c} className="flex flex-col gap-3">
                  {Array(ROWS).fill(0).map((_, r) => renderSlotCell(grid[c]?.[r] || { symbol: SYMBOLS[0], hasBattery: false }, c, r))}
                </div>
              ))}

              {/* Winning Pattern Ribbons */}
              <AnimatePresence>
                {winningPatterns.map((p, idx) => {
                  const first = p.coords[0];
                  const last = p.coords[p.coords.length - 1];
                  return (
                    <motion.div
                      key={`pattern-${idx}`}
                      initial={{ scaleX: 0, opacity: 0 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="pattern-ribbon"
                      style={{
                        left: `${first.c * 20 + 10}%`,
                        top: `${first.r * 33 + 16}%`,
                        width: `${(last.c - first.c) * 20 + 2}%`,
                        transformOrigin: 'left center',
                        transform: p.type === 'diagonal-down' ? 'rotate(15deg)' : p.type === 'diagonal-up' ? 'rotate(-15deg)' : 'none'
                      }}
                    />
                  );
                })}
              </AnimatePresence>

              {/* Combo Popups */}
              <AnimatePresence>
                {comboPopups.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ scale: 0, y: 20, opacity: 0 }}
                    animate={{ 
                      scale: [0, 1.2, 1], 
                      y: [20, -10, 0], 
                      opacity: 1 
                    }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="combo-bubble"
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  >
                    <div className="combo-bubble-text">{p.text}</div>
                    <div className="combo-bubble-amount">+{formatKoreanNumber(p.amount)}원</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Floating Texts */}
            <AnimatePresence>
              {floatingTexts.map(ft => (
                <motion.div
                  key={ft.id}
                  initial={{ opacity: 0, y: 0, scale: 0.5 }}
                  animate={{ opacity: 1, y: -100, scale: ft.isJackpot ? 2 : 1.5 }}
                  exit={{ opacity: 0 }}
                  style={{ left: `${ft.x}%`, top: `${ft.y}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 font-black italic text-center whitespace-nowrap ${
                    ft.isJackpot 
                      ? 'text-[#FFD700] text-5xl drop-shadow-[0_0_20px_rgba(255,215,0,0.8)]' 
                      : 'text-[#FFB7B2] text-4xl drop-shadow-[0_0_10px_rgba(255,183,178,0.8)]'
                  }`}
                >
                  {ft.text}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Big Win Overlay */}
            <AnimatePresence>
              {showBigWin && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-[60] rounded-[32px] pointer-events-none backdrop-blur-sm"
                >
                  <motion.div
                    animate={{ rotate: [0, -5, 5, -5, 0], scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="text-6xl md:text-8xl font-black text-[#FFB7B2] italic tracking-tighter drop-shadow-[0_0_30px_rgba(255,183,178,0.8)]"
                  >
                    BIG WIN!
                  </motion.div>
                  <motion.div className="text-2xl font-bold text-gray-700 mt-4">
                    +{formatKoreanNumber(lastSpinTotal)}원
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Receipt Overlay - Fixed Position & Z-Index */}
            <AnimatePresence>
              {showReceipt && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-64 md:w-80 bg-white text-gray-800 p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[100] border-4 border-[#E0D7C6]"
                >
                  <div className="border-b-2 border-dashed border-gray-200 pb-3 mb-4 text-center">
                    <div className="text-[12px] font-black tracking-widest text-[#FFB7B2]">COSMIC JACKPOT</div>
                    <div className="text-[10px] opacity-50">OFFICIAL RECEIPT</div>
                  </div>
                  <div className="max-h-60 overflow-y-auto no-scrollbar">
                    {receipt.map((step, idx) => (
                      <motion.div 
                        key={idx} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="receipt-line"
                      >
                        <span className="truncate mr-2">{step.name}</span>
                        <span className="font-bold">{step.value}</span>
                      </motion.div>
                    ))}
                  </div>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: receipt.length * 0.1 + 0.5 }}
                    className="border-t-2 border-dashed border-gray-200 mt-4 pt-3 flex justify-between items-center"
                  >
                    <span className="text-sm font-black">TOTAL</span>
                    <span className="text-xl font-black text-[#FFB7B2]">{formatKoreanNumber(lastSpinTotal)}</span>
                  </motion.div>
                  <motion.button 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: receipt.length * 0.1 + 1.0 }}
                    onClick={() => setShowReceipt(false)}
                    className="w-full mt-4 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-200 transition-colors"
                  >
                    닫기
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Belt */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2 px-2">
              <Sparkles size={14} className="text-[#FFB7B2]" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Synergy Belt</span>
            </div>
            {renderBelt()}
          </div>

          {/* Controls */}
          <div className="mt-auto flex flex-col gap-4">
            <div className="flex gap-4">
              <button
                disabled={isSpinning || turn <= 0 || (money < spinCost && atm < (spinCost - money))}
                onClick={spin}
                className={`flex-1 py-6 rounded-[32px] font-black text-2xl flex items-center justify-center gap-3 transition-all ${
                  isSpinning || turn <= 0 || (money < spinCost && atm < (spinCost - money))
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-[#FFB7B2] text-white hover:scale-[1.02] active:scale-95 shadow-lg'
                }`}
              >
                {isSpinning ? <RefreshCw className="animate-spin" /> : 'SPIN'}
                <span className="text-sm opacity-70 font-mono">-{formatKoreanNumber(spinCost)}</span>
              </button>

              <div className="relative group">
                <button
                  disabled={isSpinning}
                  onClick={handleSubmit}
                  className={`px-8 h-full rounded-[32px] border-4 font-black text-sm transition-all shadow-sm ${
                    isSpinning 
                    ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed' 
                    : 'bg-white border-[#E0D7C6] text-gray-600 hover:bg-[#F9F6F0]'
                  }`}
                >
                  SUBMIT
                </button>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-48 bg-gray-800 text-white p-3 rounded-2xl text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] text-center shadow-xl">
                  할당량(-{formatKoreanNumber(quota)}원)을 납부하고 즉시 상점으로 이동합니다!
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-800" />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-[32px] border-4 border-[#E0D7C6] flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-3">
                <Shield className="text-[#FFB7B2]" size={24} />
                <div>
                  <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Required Quota</div>
                  <div className="text-xl font-black text-[#FFB7B2]">{formatKoreanNumber(quota)}원</div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="text-[8px] font-black text-gray-400 uppercase tracking-widest">ATM Balance</div>
                <div className="flex items-center gap-2">
                  <div className="text-xl font-black text-gray-700">{formatKoreanNumber(atm)}원</div>
                  <button 
                    onClick={depositSmartToAtm}
                    disabled={money <= BigInt(turn) * spinCost || isSpinning}
                    className="group relative bg-gray-100 hover:bg-gray-200 disabled:opacity-30 p-1.5 rounded-xl transition-all"
                  >
                    <ArrowUpRight size={18} className="text-gray-500" />
                    {/* Tooltip */}
                    <div className="absolute bottom-full right-0 mb-3 w-40 bg-gray-800 text-white p-2 rounded-xl text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] text-center shadow-xl">
                      남은 스핀 비용({formatKoreanNumber(BigInt(turn) * spinCost)}원)을 제외한 모든 금액을 ATM에 입금합니다.
                      <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-800" />
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showShopModal && (
        <div className="absolute inset-0 z-[100] flex flex-row p-4 md:p-8 overflow-hidden bg-[#FDFBF7]">
          <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar pr-0 md:pr-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-black text-[#FFB7B2] tracking-tighter italic">COSMIC SHOP</h2>
              <p className="text-gray-500 text-xs md:text-sm">최고의 시너지를 구성하여 잭팟을 노리세요.</p>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-4 w-full md:w-auto">
              <div className="bg-white px-4 md:px-6 py-2 md:py-3 rounded-[24px] flex flex-col items-end gap-1 border-2 border-[#E0D7C6] shadow-sm flex-1 md:flex-none">
                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-sm opacity-50 text-gray-400">ATM</span>
                  <span className="text-sm md:text-lg font-black text-gray-700">{formatKoreanNumber(atm)}원</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => depositToAtm(money)}
                    className="text-[10px] bg-[#B2E2F2]/20 text-[#4A4A4A] px-2 py-1 rounded-lg hover:bg-[#B2E2F2]/40 transition-colors"
                  >
                    전액 입금
                  </button>
                  <button 
                    onClick={() => withdrawFromAtm(atm)}
                    className="text-[10px] bg-[#B2E2F2]/20 text-[#4A4A4A] px-2 py-1 rounded-lg hover:bg-[#B2E2F2]/40 transition-colors"
                  >
                    전액 출금
                  </button>
                </div>
              </div>
              <div className="bg-white px-4 md:px-6 py-2 md:py-3 rounded-[24px] flex items-center gap-2 md:gap-3 border-2 border-[#E0D7C6] shadow-sm">
                <span className="text-lg md:text-xl">🎫</span>
                <span className="text-lg md:text-xl font-black text-[#FFB7B2]">{coupons}장</span>
              </div>
              <div className="bg-white px-4 md:px-6 py-2 md:py-3 rounded-[24px] flex items-center gap-2 md:gap-3 border-2 border-[#E0D7C6] shadow-sm">
                <Wallet className="text-[#FFB7B2]" size={20} />
                <span className="text-xl font-black text-gray-700">{formatKoreanNumber(displayMoney)}원</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {shopItems.map((item) => (
              <div key={item.id} className="bg-white border-4 border-[#E0D7C6] rounded-[32px] p-8 flex flex-col items-center text-center hover:border-[#FFB7B2] transition-all group shadow-sm">
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">{item.icon}</div>
                <h3 className="font-black text-xl mb-2 text-gray-700">{item.name}</h3>
                <p className="text-xs text-gray-500 mb-6 leading-relaxed">{item.description}</p>
                <button 
                  onClick={() => buyItem(item)}
                  disabled={coupons < item.cost}
                  className={`w-full py-4 rounded-2xl font-black text-sm flex justify-center items-center gap-2 transition-all ${
                    coupons >= item.cost ? 'bg-[#FFB7B2] text-white hover:opacity-90 shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  🎫 {item.cost}장 구매
                </button>
              </div>
            ))}
          </div>

          <div className="mb-12">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Your Synergy Belt</h3>
            {renderBelt()}
            {selectedBeltIndex !== null && belt[selectedBeltIndex] && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-5 bg-white rounded-[24px] border-4 border-[#E0D7C6] flex justify-between items-center shadow-sm"
              >
                <div>
                  <div className="font-black text-gray-700">{belt[selectedBeltIndex]?.name}</div>
                  <div className="text-xs text-gray-500">{belt[selectedBeltIndex]?.description}</div>
                </div>
                <button 
                  onClick={() => sellItem(selectedBeltIndex!)}
                  className="px-4 py-2 bg-red-50/50 text-red-400 rounded-xl text-xs font-bold hover:bg-red-50 transition-all border border-red-100"
                >
                  판매 (+1장)
                </button>
              </motion.div>
            )}
          </div>

          <div className="flex gap-4 mt-auto pb-8">
            <button 
              onClick={rerollShop}
              className="flex-1 py-5 rounded-[24px] font-black bg-white border-4 border-[#E0D7C6] hover:border-[#FFB7B2] text-gray-600 flex justify-center items-center gap-3 transition-all shadow-sm"
            >
              <RefreshCw size={20} />
              상점 리롤 ({formatKoreanNumber(rerollCost)}원)
            </button>
            <button 
              onClick={() => setShowShopModal(false)}
              className="flex-1 py-5 rounded-[24px] font-black bg-[#B2E2F2] text-gray-700 hover:opacity-90 flex justify-center items-center gap-3 shadow-lg"
            >
              돌아가기
              <ArrowRight size={20} />
            </button>
          </div>
          </div>
          <div className="w-80 flex flex-col gap-6 overflow-y-auto no-scrollbar pl-4 border-l-2 border-[#E0D7C6]/50 hidden lg:flex">
            {renderSymbolStats()}
          </div>
        </div>
      )}

      {phase === 'WHISPER' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#FDFBF7] relative overflow-y-auto">
          {/* Background Decorations */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-10 left-10 text-8xl">✨</div>
            <div className="absolute bottom-10 right-10 text-8xl">😈</div>
            <div className="absolute top-1/2 left-1/4 text-6xl">👼</div>
          </div>

          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center mb-12 z-10"
          >
            <h2 className="text-5xl md:text-7xl font-black text-[#FFB7B2] mb-4 tracking-tighter italic drop-shadow-sm">천사의 속삭임</h2>
            <p className="text-gray-400 font-bold">운명을 결정할 속삭임을 선택하세요.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl z-10">
              {whisperOptions.map((option, idx) => (
                <motion.button
                  key={option.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.2 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => selectWhisper(option)}
                  className={`p-10 rounded-[48px] border-8 flex flex-col items-center text-center transition-all shadow-2xl relative group ${
                  option.type === 'devil' ? 'bg-red-50/40 border-red-200 hover:border-red-400' : 
                  option.type === 'salvation' ? 'bg-yellow-50/40 border-yellow-200 hover:border-yellow-400' : 
                  'bg-blue-50/40 border-blue-200 hover:border-blue-400'
                }`}
              >
                <div className={`text-[12px] font-black mb-4 px-4 py-1 rounded-full uppercase tracking-widest ${
                  option.type === 'devil' ? 'bg-red-200 text-red-600' : 
                  option.type === 'salvation' ? 'bg-yellow-200 text-yellow-600' : 
                  'bg-blue-200 text-blue-600'
                }`}>
                  {option.rarity}
                </div>
                <div className="text-3xl font-black mb-6 text-gray-800 group-hover:scale-110 transition-transform">{option.title}</div>
                <div className="text-sm text-gray-600 leading-relaxed font-medium">{option.description}</div>
                
                {option.type === 'devil' && <div className="absolute -top-4 -right-4 text-4xl">🔥</div>}
                {option.type === 'salvation' && <div className="absolute -top-4 -right-4 text-4xl">🌟</div>}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {phase === 'GAMEOVER' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#FDFBF7] overflow-y-auto">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <Skull size={100} className="mx-auto mb-8 text-[#FFB7B2]" />
            <h2 className="text-6xl font-black text-[#FFB7B2] mb-4 tracking-tighter italic">BANKRUPT</h2>
            <p className="text-gray-500 mb-12">할당량을 채우지 못해 파산했습니다.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-12 max-w-md mx-auto">
              <div className="bg-white p-6 rounded-[32px] border-4 border-[#E0D7C6] shadow-sm">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Final Round</div>
                <div className="text-2xl font-black text-gray-700">{round}</div>
              </div>
              <div className="bg-white p-6 rounded-[32px] border-4 border-[#E0D7C6] shadow-sm">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Earnings</div>
                <div className="text-2xl font-black text-gray-700">{formatKoreanNumber(totalEarnings)}</div>
              </div>
            </div>

            <button 
              onClick={resetGame}
              className="px-12 py-6 rounded-[32px] bg-[#FFB7B2] text-white font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              RETRY
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
