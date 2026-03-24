import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { COSMIC_ITEMS, CosmicItem } from '../data/cosmicJackpotItems';
import { calculateSynergy, ReceiptStep } from '../utils/synergy';
import { Coins, ShoppingCart, ArrowRight, RefreshCw, Sparkles, CheckCircle2, X, Shield, Wallet, Trophy } from 'lucide-react';
import { CosmicJackpotLeaderboard } from './CosmicJackpotLeaderboard';
import './CosmicJackpot.css';

interface CosmicJackpotProps {
  onGameOver?: () => void;
  onClear?: () => void;
}

const SYMBOLS = [
  { char: '🍒', value: 10n, weight: 1.3, tier: 1, tags: ['fruit'] },
  { char: '🍋', value: 10n, weight: 1.3, tier: 1, tags: ['fruit'] },
  { char: '☘️', value: 20n, weight: 1.0, tier: 2, tags: ['luck'] },
  { char: '🔔', value: 20n, weight: 1.0, tier: 2, tags: ['bell'] },
  { char: '💎', value: 40n, weight: 0.8, tier: 3, tags: ['gem'] },
  { char: '💰', value: 40n, weight: 0.8, tier: 3, tags: ['money'] },
  { char: '🌟', value: 100n, weight: 0.5, tier: 4, tags: ['star'] },
  { char: '💀', value: 0n, weight: 0.15, tier: 0, isTrap: true, tags: ['trap'] }
];

interface Whisper {
  id: string;
  title: string;
  description: string;
  type: 'angel' | 'devil' | 'salvation';
  effect: () => void;
}

export const CosmicJackpot: React.FC<CosmicJackpotProps> = ({ onGameOver, onClear }) => {
  const [phase, setPhase] = useState<'SLOT' | 'SHOP' | 'GAMEOVER' | 'WHISPER' | 'TURN_SELECTION'>('SHOP');
  const [round, setRound] = useState(1);
  const [turn, setTurn] = useState(7);
  const [maxTurn, setMaxTurn] = useState(7);
  const [quota, setQuota] = useState<bigint>(500n);
  const [money, setMoney] = useState<bigint>(2000n); // Wallet
  const [displayMoney, setDisplayMoney] = useState<bigint>(2000n); // For counter animation
  const [atm, setAtm] = useState<bigint>(0n); // ATM
  const [displayAtm, setDisplayAtm] = useState<bigint>(0n); // For counter animation
  const [coupons, setCoupons] = useState(3);
  const [hotPotatoBuff, setHotPotatoBuff] = useState(0); // Turns remaining
  const [selectedBeltIndex, setSelectedBeltIndex] = useState<number | null>(null);
  const [rerollCost, setRerollCost] = useState<bigint>(1000n);
  const [isBossChallenge, setIsBossChallenge] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  
  const [lastSpinCombo, setLastSpinCombo] = useState(0);
  const [lastSpinTotal, setLastSpinTotal] = useState(0n);
  const [receipt, setReceipt] = useState<ReceiptStep[]>([]);
  const [showReceipt, setShowReceipt] = useState(false);

  const [belt, setBelt] = useState<(CosmicItem | null)[]>([null, null, null, null, null]);
  const [beltSize, setBeltSize] = useState(5);
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [reelStopping, setReelStopping] = useState<boolean[]>([false, false, false, false, false]);
  const [isTeasing, setIsTeasing] = useState(false);
  const [shopItems, setShopItems] = useState<CosmicItem[]>([]);
  const [gridSymbols, setGridSymbols] = useState<string[]>(Array(15).fill('❓'));
  
  // Luck & Wildcard states
  const [luck, setLuck] = useState(0);
  const [fairyMagnifierTurns, setFairyMagnifierTurns] = useState(0);
  const [wildcardIndex, setWildcardIndex] = useState<number | null>(null); // Index in grid that is wildcard
  const [highlightedIndices, setHighlightedIndices] = useState<number[]>([]);
  
  // CloverPit specific states
  const [activeWhisper, setActiveWhisper] = useState<Whisper | null>(null);
  const [whisperOptions, setWhisperOptions] = useState<Whisper[]>([]);
  const [trapProtection, setTrapProtection] = useState(0);
  const [globalPatternBonus, setGlobalPatternBonus] = useState(0);
  const [devilDealCount, setDevilDealCount] = useState(0);
  const [trapChanceMultiplier, setTrapChanceMultiplier] = useState(1.0);

  // Item specific states
  const [snowballStacks, setSnowballStacks] = useState<Record<number, bigint>>({});
  const [piggyBankSaved, setPiggyBankSaved] = useState(0n);
  const [magnetPawUsed, setMagnetPawUsed] = useState(false);
  const [shieldGeneratorCharges, setShieldGeneratorCharges] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // --- Reset Game ---
  const resetGame = useCallback(() => {
    setPhase('SHOP'); // Start with shop to allow buying items
    setRound(1);
    setTurn(7);
    setMaxTurn(7);
    setQuota(500n);
    setMoney(2000n);
    setHighlightedIndices([]);
    setDisplayMoney(2000n);
    setAtm(0n);
    setDisplayAtm(0n);
    setCoupons(3); // Start with 3 coupons as requested
    setHotPotatoBuff(0);
    setBelt([null, null, null, null, null]);
    setBeltSize(5);
    setLuck(0);
    setFairyMagnifierTurns(0);
    setGlobalPatternBonus(0);
    setDevilDealCount(0);
    setTrapChanceMultiplier(1.0);
    setSnowballStacks({});
    setPiggyBankSaved(0n);
    setMagnetPawUsed(false);
    setShieldGeneratorCharges(0);
    setReelStopping([false, false, false, false, false]);
    setGridSymbols(Array(15).fill('❓'));
    generateShop(); // Generate initial shop items
  }, []);

  useEffect(() => {
    generateShop();
  }, []);

  // Sync display money
  useEffect(() => {
    const interval = setInterval(() => {
      if (displayMoney < money) {
        const diff = BigInt(money) - BigInt(displayMoney);
        const step = diff > 100n ? diff / 10n : 1n;
        setDisplayMoney(prev => prev + step);
      } else if (displayMoney > money) {
        setDisplayMoney(money);
      }

      if (displayAtm < atm) {
        const diff = BigInt(atm) - BigInt(displayAtm);
        const step = diff > 100n ? diff / 10n : 1n;
        setDisplayAtm(prev => prev + step);
      } else if (displayAtm > atm) {
        setDisplayAtm(atm);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [money, atm, displayMoney, displayAtm]);

  // --- Utility Functions ---
  const formatKoreanNumber = (bigIntNum: bigint) => {
    if (bigIntNum === 0n) return '0';
    if (bigIntNum < 0n) return '-' + formatKoreanNumber(-bigIntNum);
    const units = ['', '만', '억', '조', '경', '해', '자', '양', '구', '간', '정', '재', '극', '항하사', '아승기'];
    let result = '';
    let num = bigIntNum;
    let unitIndex = 0;

    while (num > 0n) {
      const remainder = num % 10000n;
      if (remainder > 0n) {
        result = remainder.toString() + units[unitIndex] + (result ? ' ' + result : '');
      }
      num = num / 10000n;
      unitIndex++;
      if (unitIndex >= units.length) break;
    }
    return result.trim();
  };

  const triggerShake = () => {
    if (!wrapperRef.current) return;
    wrapperRef.current.classList.remove('jp-slot-shake');
    void wrapperRef.current.offsetWidth;
    wrapperRef.current.classList.add('jp-slot-shake');
  };

  const showPopup = (text: string, x: number, y: number, isRainbow = false) => {
    if (!wrapperRef.current) return;
    const popup = document.createElement('div');
    popup.className = 'jp-slot-popup';
    popup.textContent = text;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    popup.style.color = isRainbow ? 'transparent' : '#00ffcc';
    popup.style.fontSize = isRainbow ? '3rem' : '2rem';
    
    if (isRainbow) popup.classList.add('jp-slot-rainbow');

    wrapperRef.current.appendChild(popup);
    setTimeout(() => {
      if (popup.parentNode) popup.remove();
    }, 1200);
  };

  const createPopParticles = (x: number, y: number, count = 12, color = '#ffb800') => {
    if (!wrapperRef.current) return;
    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'jp-slot-pop-particle';
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      particle.style.backgroundColor = color;
      const angle = Math.random() * Math.PI * 2;
      const velocity = 40 + Math.random() * 80;
      particle.style.setProperty('--vx', `${Math.cos(angle) * velocity}px`);
      particle.style.setProperty('--vy', `${Math.sin(angle) * velocity}px`);
      wrapperRef.current.appendChild(particle);
      setTimeout(() => {
        if (particle.parentNode) particle.remove();
      }, 800);
    }
  };

  const getRefundCoupons = (tier: number) => {
    const refundMap: Record<number, number> = {
      1: 1,
      2: 1,
      3: 2,
      4: 2,
      5: 3,
      6: 5,
      7: 8
    };
    return refundMap[tier] || 1;
  };

  const sellItem = (index: number) => {
    if (isSpinning) return;
    const item = belt[index];
    if (!item || item.id === 'dummy_slot') return;

    const refund = getRefundCoupons(item.tier);
    setCoupons(prev => prev + refund);
    
    const newBelt = [...belt];
    newBelt[index] = null;
    if (item.size === 2 && newBelt[index + 1]?.id === 'dummy_slot') {
      newBelt[index + 1] = null;
    }
    setBelt(newBelt);
    setSelectedBeltIndex(null);

    // Clear item specific states
    setSnowballStacks(prev => {
      const next = { ...prev };
      delete next[index];
      return next;
    });

    // Show popup and particles
    const itemEls = document.querySelectorAll('.jp-slot-item');
    if (itemEls[index] && wrapperRef.current) {
      const rect = itemEls[index].getBoundingClientRect();
      const wRect = wrapperRef.current.getBoundingClientRect();
      const x = rect.left - wRect.left + rect.width / 2;
      const y = rect.top - wRect.top;
      showPopup(`+${refund}장`, x, y, false);
      createPopParticles(x, y, 10, '#ffb800');
    }
  };

  const handleBeltItemClick = (index: number) => {
    if (isSpinning) return;
    
    let targetIndex = index;
    if (belt[index]?.id === 'dummy_slot') {
      targetIndex = index - 1;
    }
    
    if (belt[targetIndex] && belt[targetIndex]?.id !== 'dummy_slot') {
      setSelectedBeltIndex(prev => prev === targetIndex ? null : targetIndex);
    }
  };

  const createCoinWaterfall = () => {
    if (!wrapperRef.current) return;
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        if (!wrapperRef.current) return;
        const coin = document.createElement('div');
        coin.className = 'jp-slot-particle';
        coin.style.left = `${Math.random() * 100}%`;
        coin.style.animationDuration = `${1 + Math.random()}s`;
        wrapperRef.current.appendChild(coin);
        setTimeout(() => {
          if (coin.parentNode) coin.remove();
        }, 2000);
      }, i * 30);
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // --- Core Game Logic ---
  const spin = async () => {
    if (isSpinning || turn <= 0) return;
    
    // Check Milk Drop (10% chance for free spin)
    const hasMilkDrop = belt.some(i => i?.id === 'milk_drop');
    const isFreeSpin = hasMilkDrop && Math.random() < 0.1;
    
    setIsSpinning(true);
    setReelStopping([false, false, false, false, false]);
    setHighlightedIndices([]);
    setIsTeasing(false);
    setSelectedBeltIndex(null);
    
    if (!isFreeSpin) {
      setTurn(prev => prev - 1);
    } else {
      showPopup('🥛 공짜 스핀!', window.innerWidth / 2, window.innerHeight / 2, true);
    }

    const interval = 50;
    
    // 1. Spinning Animation
    const spinInterval = setInterval(() => {
      setGridSymbols(Array(15).fill(0).map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char));
    }, interval);

    // Prepare results
    const results = Array(15).fill(0).map(() => getRandomSymbol());
    
    // Scrub Towel logic (50% chance to convert trap to cherry)
    const hasScrubTowel = belt.some(i => i?.id === 'scrub_towel');
    if (hasScrubTowel) {
      results.forEach((s, idx) => {
        if (s.isTrap && Math.random() < 0.5) {
          results[idx] = SYMBOLS.find(sym => sym.char === '🍒')!;
        }
      });
    }

    // Magnet Paw logic: if a row has 4 identical symbols and 1 different symbol, change the 5th to match
    if (belt.some(i => i?.id === 'magnet_paw') && !magnetPawUsed) {
      for (let row = 0; row < 3; row++) {
        const rowSymbols = [results[row * 5], results[row * 5 + 1], results[row * 5 + 2], results[row * 5 + 3], results[row * 5 + 4]];
        const counts: { [key: string]: number } = {};
        rowSymbols.forEach(s => counts[s.char] = (counts[s.char] || 0) + 1);
        const mostCommon = Object.keys(counts).find(char => counts[char] === 4);
        if (mostCommon && mostCommon !== '💀') {
          const targetSymbol = SYMBOLS.find(s => s.char === mostCommon)!;
          results.forEach((s, idx) => {
            if (Math.floor(idx / 5) === row && s.char !== mostCommon) {
              results[idx] = targetSymbol;
            }
          });
          setMagnetPawUsed(true);
          showPopup('🐾 자석 냥발!', window.innerWidth / 2, window.innerHeight / 2, true);
          break;
        }
      }
    }

    // Teasing check: if first 3 columns have same symbol
    const col1 = [results[0], results[5], results[10]];
    const col2 = [results[1], results[6], results[11]];
    const col3 = [results[2], results[7], results[12]];
    
    const isTease = col1.every(s => s.char === col1[0].char) && 
                    col2.every(s => s.char === col1[0].char) && 
                    col3.every(s => s.char === col1[0].char);

    // Sequential Stopping
    let totalBaseValue = 0n;
    for (let col = 0; col < 5; col++) {
      const delay = col === 4 && isTease ? 2000 : 400; // Longer delay for tease
      if (col === 3 && isTease) setIsTeasing(true);
      
      await sleep(delay);
      setReelStopping(prev => {
        const next = [...prev];
        next[col] = true;
        return next;
      });
      
      // Update grid partially
      setGridSymbols(prev => {
        const next = [...prev];
        for (let row = 0; row < 3; row++) {
          next[row * 5 + col] = results[row * 5 + col].char;
        }
        return next;
      });

      // --- Real-time Column Combo Check ---
      const colIndices = [0 * 5 + col, 1 * 5 + col, 2 * 5 + col];
      const colChars = colIndices.map(idx => results[idx].char);
      const firstChar = colChars[0];
      if (colChars.every(c => c === firstChar && firstChar !== '💀')) {
        setHighlightedIndices(prev => [...prev, ...colIndices]);
        const comboBaseValue = BigInt(colChars.length) * results[colIndices[0]].value;
        totalBaseValue += comboBaseValue;
        showPopup(`✨ ${col + 1}열 콤보! +${formatKoreanNumber(comboBaseValue)}`, window.innerWidth / 2, window.innerHeight / 2 - 80);
        createPopParticles(window.innerWidth / 2, window.innerHeight / 2, 15, '#00ffcc');
      }
      
      // clack sound effect (visual bounce)
      triggerShake();
    }

    // --- Real-time Row Combo Check ---
    const rows = [[0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14]];
    rows.forEach((rowIndices, idx) => {
      const rowChars = rowIndices.map(i => results[i].char);
      const first = rowChars[0];
      if (rowChars.every(c => c === first && first !== '💀')) {
        setHighlightedIndices(prev => [...prev, ...rowIndices]);
        const rowBaseValue = BigInt(rowChars.length) * results[rowIndices[0]].value;
        totalBaseValue += rowBaseValue;
        showPopup(`🔥 ${idx + 1}행 콤보! +${formatKoreanNumber(rowBaseValue)}`, window.innerWidth / 2, window.innerHeight / 2 + 80);
        createPopParticles(window.innerWidth / 2, window.innerHeight / 2, 20, '#ff3366');
      }
    });

    // --- Diagonal Combo Check ---
    const diags = [[0, 6, 12], [1, 7, 13], [2, 8, 14], [10, 6, 2], [11, 7, 3], [12, 8, 4]];
    diags.forEach((diagIndices, idx) => {
      const diagChars = diagIndices.map(i => results[i].char);
      const first = diagChars[0];
      if (diagChars.every(c => c === first && first !== '💀')) {
        setHighlightedIndices(prev => [...prev, ...diagIndices]);
        const diagBaseValue = BigInt(diagChars.length) * results[diagIndices[0]].value;
        totalBaseValue += diagBaseValue;
        showPopup(`📐 대각선 콤보! +${formatKoreanNumber(diagBaseValue)}`, window.innerWidth / 2, window.innerHeight / 2 - 120);
        createPopParticles(window.innerWidth / 2, window.innerHeight / 2, 15, '#ffcc00');
      }
    });

    // --- Triangle Pattern Check ---
    const triangles = [[0, 6, 12, 8, 4], [10, 6, 2, 8, 14]];
    triangles.forEach((triIndices, idx) => {
      const triChars = triIndices.map(i => results[i].char);
      const first = triChars[0];
      if (triChars.every(c => c === first && first !== '💀')) {
        setHighlightedIndices(prev => [...prev, ...triIndices]);
        const triBaseValue = BigInt(triChars.length) * results[triIndices[0]].value;
        totalBaseValue += triBaseValue;
        showPopup(`🔺 삼각형 패턴! +${formatKoreanNumber(triBaseValue)}`, window.innerWidth / 2, window.innerHeight / 2);
        createPopParticles(window.innerWidth / 2, window.innerHeight / 2, 25, '#ff00ff');
      }
    });

    // --- Square Pattern Check ---
    const squares = [
      [0, 1, 5, 6], [1, 2, 6, 7], [2, 3, 7, 8], [3, 4, 8, 9],
      [5, 6, 10, 11], [6, 7, 11, 12], [7, 8, 12, 13], [8, 9, 13, 14]
    ];
    squares.forEach((sqIndices, idx) => {
      const sqChars = sqIndices.map(i => results[i].char);
      const first = sqChars[0];
      if (sqChars.every(c => c === first && first !== '💀')) {
        setHighlightedIndices(prev => [...prev, ...sqIndices]);
        const sqBaseValue = BigInt(sqChars.length) * results[sqIndices[0]].value;
        totalBaseValue += sqBaseValue;
        showPopup(`⬜ 네모 패턴! +${formatKoreanNumber(sqBaseValue)}`, window.innerWidth / 2, window.innerHeight / 2 + 120);
        createPopParticles(window.innerWidth / 2, window.innerHeight / 2, 15, '#3399ff');
      }
    });

    // --- Jackpot Check ---
    const allChars = results.map(r => r.char);
    const firstSym = allChars[0];
    if (allChars.every(c => c === firstSym && firstSym !== '💀')) {
      showPopup('🎰 ALL-IN JACKPOT!!!', window.innerWidth / 2, window.innerHeight / 2, true);
      createCoinWaterfall();
    }

    clearInterval(spinInterval);
    setIsTeasing(false);
    
    // 2. Finalize Results
    const hasRainbowClay = belt.some(i => i?.id === 'rainbow_clay');
    let currentWildcardIndex: number | null = null;
    
    // Luck-based Wildcard Chance: Every 100 luck gives 10% chance, max 50%
    const luckWildcardChance = Math.min(0.5, luck / 1000);
    
    if (hasRainbowClay || Math.random() < luckWildcardChance) {
      currentWildcardIndex = Math.floor(Math.random() * 15);
      setWildcardIndex(currentWildcardIndex);
    } else {
      setWildcardIndex(null);
    }
    
    const finalSymbols = results.map((s, idx) => idx === currentWildcardIndex ? '🌈' : s.char);
    setGridSymbols(finalSymbols);

    // --- Synergy Chain Reaction ---
    const grid = results.map((r, idx) => idx === currentWildcardIndex ? 'WILD' : r.char);

    const synergyResult = calculateSynergy({
      grid,
      belt,
      atm,
      luck,
      globalPatternBonus,
      piggyBankSaved,
      hotPotatoBuff,
      fairyMagnifierTurns,
      trapChanceMultiplier,
      turn,
      maxTurn,
      isBossChallenge,
      shieldGeneratorCharges,
      snowballStacks,
      coupons
    });

    setLastSpinCombo(synergyResult.comboCount);
    setReceipt(synergyResult.receipt);
    
    if (synergyResult.finalScore > 0n) {
      await sleep(500);
      showPopup(`💎 +${formatKoreanNumber(synergyResult.finalScore)}!`, window.innerWidth / 2, window.innerHeight / 2, true);
      createCoinWaterfall();
    }
    
    // Debug/Verification log
    console.log('--- SYNERGY RECEIPT ---');
    synergyResult.receipt.forEach(step => {
      console.log(`[${step.type.toUpperCase()}] ${step.name}: ${step.value} -> Total: ${step.amount}`);
    });
    console.log(`FINAL SCORE: ${synergyResult.finalScore}`);
    console.log('-----------------------');

    if (synergyResult.comboCount === 8) {
      showPopup('🎰 JACKPOT! x10', window.innerWidth / 2, window.innerHeight / 2, true);
    }

    if (synergyResult.isBankrupt) {
      if (synergyResult.bibleUsed) {
        showPopup('📖 성경 보호!', window.innerWidth/2, window.innerHeight/2);
      } else if (synergyResult.shieldChargesUsed > 0) {
        setShieldGeneratorCharges(prev => prev - 1);
        showPopup(`🛡️ 보호막! (${shieldGeneratorCharges - 1} 남음)`, window.innerWidth/2, window.innerHeight/2);
      } else {
        setMoney(0n);
        showPopup('💀 파산!', window.innerWidth/2, window.innerHeight/2);
        triggerShake();
      }
    } else {
      if (synergyResult.bibleUsed) {
        showPopup('📖 성경 보호!', window.innerWidth/2, window.innerHeight/2);
      } else if (synergyResult.shieldChargesUsed > 0) {
        setShieldGeneratorCharges(prev => prev - 1);
        showPopup(`🛡️ 보호막! (${shieldGeneratorCharges - 1} 남음)`, window.innerWidth/2, window.innerHeight/2);
      }
    }

    setLastSpinTotal(synergyResult.finalScore);
    if (!synergyResult.isBankrupt) {
      setMoney(prev => prev + synergyResult.finalScore);
    }
    setSnowballStacks(synergyResult.newSnowball);
    setPiggyBankSaved(synergyResult.newPiggyBank);
    setBelt(synergyResult.newBelt);
    if (synergyResult.addedLuck > 0) {
      setLuck(prev => prev + synergyResult.addedLuck);
      showPopup(`🍀 행운 +${synergyResult.addedLuck}`, window.innerWidth/2, window.innerHeight/2 - 100, true);
    }
    if (synergyResult.addedCoupons > 0) {
      setCoupons(prev => prev + synergyResult.addedCoupons);
      showPopup(`🎫 쿠폰 +${synergyResult.addedCoupons}`, window.innerWidth/2, window.innerHeight/2 - 50);
    }
    if (synergyResult.interestEarned > 0n) {
      showPopup(`📈 이자 +${formatKoreanNumber(synergyResult.interestEarned)}`, window.innerWidth/2, window.innerHeight/2 + 100);
    }
    if (synergyResult.addedAtm > 0n) {
      setAtm(prev => prev + synergyResult.addedAtm);
      showPopup(`💰 금고 +${formatKoreanNumber(synergyResult.addedAtm)}`, window.innerWidth/2, window.innerHeight/2 + 50);
    }
    if (fairyMagnifierTurns > 0) setFairyMagnifierTurns(prev => prev - 1);

    if (synergyResult.finalScore >= 1000n && !synergyResult.isBankrupt) createCoinWaterfall();
    setIsSpinning(false);
  };

  const showItemPopup = (index: number, text: string, isRainbow = false) => {
    const itemEls = document.querySelectorAll('.jp-slot-item');
    if (itemEls[index] && wrapperRef.current) {
      const rect = itemEls[index].getBoundingClientRect();
      const wRect = wrapperRef.current.getBoundingClientRect();
      showPopup(text, rect.left - wRect.left + rect.width/2, rect.top - wRect.top - 20, isRainbow);
    }
  };

  const getRandomSymbol = () => {
    const hasCloverHairpin = belt.some(i => i?.id === 'clover_hairpin');
    const hasLuckyClover = belt.some(i => i?.id === 'lucky_clover');
    const hasCloverSeed = belt.some(i => i?.id === 'clover_seed');
    const hasBasketOfPlenty = belt.some(i => i?.id === 'basket_of_plenty');
    const hasGoldenBellTower = belt.some(i => i?.id === 'golden_bell_tower');
    const hasLuckyCharm = belt.some(i => i?.id === 'lucky_charm');
    const hasStarFragment = belt.some(i => i?.id === 'star_fragment');
    const hasFourLeafClover = belt.some(i => i?.id === 'four_leaf_clover');
    const hasGoldenPigStatue = belt.some(i => i?.id === 'golden_pig_statue');
    
    // Base luck from items
    let currentLuck = luck;
    if (hasCloverHairpin) currentLuck += 20;
    if (hasLuckyClover) currentLuck += 5;
    if (hasLuckyCharm) currentLuck += 3;
    if (hasFourLeafClover) currentLuck += 10;

    let pool = [...SYMBOLS];
    if (fairyMagnifierTurns > 0) pool = pool.filter(s => s.tier >= 2);
    if (belt.some(it => it?.id === 'ultra_angel_wing')) pool = pool.filter(s => s.tier !== 0);

    let totalWeight = 0;
    const weights = pool.map(s => {
      let w = s.weight;
      // Luck affects weights: tier 0 (trap) weight decreases, high tier increases
      if (s.tier === 0) {
        // No traps in first 3 rounds
        if (round <= 3) return 0;

        let currentTrapMultiplier = trapChanceMultiplier;
        if (belt.some(it => it?.id === 'atm_security_guard') && atm >= 100000n) {
          currentTrapMultiplier *= 0.5;
        }
        w = Math.max(0, (w * currentTrapMultiplier) - (currentLuck / 100));
        if (hasCloverHairpin) w *= 0.5;
        if (hasBasketOfPlenty) w *= 0.5;
        if (hasLuckyCharm) w *= 0.9;
      }
      
      // Luck buff: high tier symbols get much more weight
      if (s.tier >= 3) {
        w = w + (currentLuck / 50); // Buffed from /100 to /50
      }
      if (s.tier >= 4) {
        w = w + (currentLuck / 30); // Tier 4 gets even more weight
      }
      
      // Clover Seed: Cherry/Lemon -5%, Clover/Bell +5%
      if (hasCloverSeed) {
        if (s.char === '🍒' || s.char === '🍋') w = Math.max(0.1, w - 0.05);
        if (s.char === '☘️' || s.char === '🔔') w += 0.05;
      }

      // Basket of Plenty: Fruit +20%
      if (hasBasketOfPlenty && s.tags?.includes('fruit')) {
        w *= 1.2;
      }

      // Golden Bell Tower: Bell +30%
      if (hasGoldenBellTower && s.tags?.includes('bell')) {
        w *= 1.3;
      }

      // Four Leaf Clover: Clover +20%
      if (hasFourLeafClover && s.char === '☘️') {
        w *= 1.2;
      }

      // Golden Pig Statue: Money +15%
      if (hasGoldenPigStatue && s.char === '💰') {
        w *= 1.15;
      }

      // Star Fragment: Star +5%
      if (hasStarFragment && s.char === '🌟') {
        w *= 1.05;
      }

      totalWeight += w;
      return w;
    });

    let r = Math.random() * totalWeight;
    for (let i = 0; i < pool.length; i++) {
      if (r < weights[i]) return pool[i];
      r -= weights[i];
    }
    return pool[pool.length - 1];
  };

  const deposit = (amount: bigint) => {
    if (amount > money) return;
    setMoney(prev => prev - amount);
    setAtm(prev => prev + amount);
    triggerShake();
  };

  const generateWhispers = () => {
    const options: Whisper[] = [
      {
        id: 'angel_luck',
        title: '👼 천사의 축복',
        description: '행운(Luck) 스탯이 영구적으로 +10 증가합니다.',
        type: 'angel',
        effect: () => setLuck(prev => prev + 10)
      },
      {
        id: 'angel_pattern',
        title: '👼 조화로운 선율',
        description: '패턴(Payline) 보너스가 영구적으로 +0.5 증가합니다.',
        type: 'angel',
        effect: () => setGlobalPatternBonus(prev => prev + 0.5)
      },
      {
        id: 'devil_deal_1',
        title: '😈 악마의 계약: 탐욕',
        description: '현재 소지한 모든 쿠폰을 잃는 대신, 소지품(Wallet)의 돈이 3배가 됩니다.',
        type: 'devil',
        effect: () => {
          setCoupons(0);
          setMoney(prev => prev * 3n);
          setDevilDealCount(prev => prev + 1);
        }
      },
      {
        id: 'devil_deal_2',
        title: '😈 악마의 계약: 위험',
        description: '다음 라운드부터 함정(💀) 확률이 증가하지만, 글로벌 배수가 x2 추가됩니다.',
        type: 'devil',
        effect: () => {
          setGlobalPatternBonus(prev => prev + 2.0);
          setDevilDealCount(prev => prev + 1);
        }
      },
      {
        id: 'salvation_pure',
        title: '✨ 구원: 순수',
        description: '악마의 유혹을 뿌리친 보상입니다. 쿠폰 10장을 획득합니다.',
        type: 'salvation',
        effect: () => setCoupons(prev => prev + 10)
      }
    ];

    // Pick 3 random options (1 angel, 1 devil, 1 random/salvation)
    const angels = options.filter(o => o.type === 'angel');
    const devils = options.filter(o => o.type === 'devil');
    const salvations = options.filter(o => o.type === 'salvation');

    const selected = [
      angels[Math.floor(Math.random() * angels.length)],
      devils[Math.floor(Math.random() * devils.length)],
      devilDealCount === 0 ? angels[1] : salvations[0]
    ];

    setWhisperOptions(selected);
    setPhase('WHISPER');
  };

  const handleSubmit = async () => {
    let finalAtm = atm;
    let finalMoney = money;

    if (finalAtm < quota) {
      const needed = quota - finalAtm;
      if (finalMoney >= needed) {
        finalMoney -= needed;
        finalAtm += needed;
        setMoney(finalMoney);
      } else {
        setPhase('GAMEOVER');
        return;
      }
    }

    // Clear Round
    createCoinWaterfall();
    triggerShake();
    
    // Early payment bonus: 
    // 7 spins: 1 coupon + (remaining turns)
    // 3 spins: 2 coupons + (remaining turns * 2)
    const earnedCoupons = maxTurn === 7 ? (1 + turn) : (2 + turn * 2);

    setAtm(finalAtm - quota); // Pay from ATM
    setCoupons(prev => prev + earnedCoupons);
    
    // Golden Egg and Piggy Bank Payout
    let bonusMoney = piggyBankSaved * 5n;
    const newBelt = [...belt];
    let goldenEggMultiplier = 1n;
    for (let i = 0; i < beltSize; i++) {
      if (newBelt[i]?.id === 'golden_egg') {
        goldenEggMultiplier *= 2n;
        newBelt[i] = null;
      } else if (newBelt[i]?.id === 'space_cat') {
        newBelt[i] = {
          ...newBelt[i]!,
          currentMultiplier: (newBelt[i]!.currentMultiplier || 1.0) + 0.3
        };
      }
    }
    setBelt(newBelt);
    setMoney(prev => (prev + bonusMoney) * goldenEggMultiplier);
    setPiggyBankSaved(0n);
    setHotPotatoBuff(0); 
    setRerollCost(1000n); 
    setMagnetPawUsed(false);
    
    // Reset Shield Generator
    if (newBelt.some(it => it?.id === 'shield_generator')) {
      setShieldGeneratorCharges(3);
    } else {
      setShieldGeneratorCharges(0);
    }
    
    const wasBoss = isBossChallenge;
    setIsBossChallenge(false);
    
    setRound(prev => prev + 1);
    // Quota scales harder
    setQuota(prev => (prev * 28n / 10n) + 1000n);
    setTrapChanceMultiplier(1.0);
    
    await sleep(1000);
    generateWhispers(); // Trigger Whispers before Shop
  };

  // --- Shop Logic ---
  const generateShop = (isBossClear = false) => {
    const getWeightedItem = (pool: CosmicItem[]) => {
      const totalWeight = pool.reduce((acc, item) => acc + (item.weight || 1), 0);
      let r = Math.random() * totalWeight;
      for (const item of pool) {
        if (r < (item.weight || 1)) return item;
        r -= (item.weight || 1);
      }
      return pool[0];
    };

    const availableItems = COSMIC_ITEMS.filter(i => i.tier < 6);
    const items: CosmicItem[] = [];
    for (let i = 0; i < 3; i++) {
      items.push({ ...getWeightedItem(availableItems) });
    }
    
    if (isBossClear) {
      const legendaries = COSMIC_ITEMS.filter(i => i.tier >= 6);
      const randomLegendary = legendaries[Math.floor(Math.random() * legendaries.length)];
      items.push({ ...randomLegendary, cost: 0 });
    }
    
    setShopItems(items);
  };

  const buyItem = (item: CosmicItem) => {
    if (coupons < item.cost && item.cost > 0) {
      alert('쿠폰이 부족합니다!');
      return;
    }

    if (item.type === 'consumable') {
      if (item.id === 'magic_pouch') {
        if (beltSize >= 7) {
          alert('더 이상 칸을 늘릴 수 없습니다!');
          return;
        }
        setBeltSize(prev => prev + 1);
        setBelt(prev => [...prev, null]);
      } else if (item.id === 'reset_wand') {
        setTurn(prev => Math.min(3, prev + 1));
      } else if (item.id === 'hot_potato') {
        setHotPotatoBuff(prev => prev + 1);
      } else if (item.id === 'fairy_magnifier') {
        setFairyMagnifierTurns(1);
      }
      if (item.cost > 0) setCoupons(prev => prev - item.cost);
      setShopItems(prev => prev.filter(i => i.id !== item.id));
    } else {
      // Passive item
      let emptyIndex = -1;
      if (item.size === 2) {
        // Find 2 contiguous empty slots
        for (let i = 0; i < beltSize - 1; i++) {
          if (belt[i] === null && belt[i+1] === null) {
            emptyIndex = i;
            break;
          }
        }
        if (emptyIndex === -1) {
          alert('벨트에 연속된 2개의 빈 칸이 없습니다!');
          return;
        }
      } else if (item.size === 3) {
        // Find 3 contiguous empty slots
        for (let i = 0; i < beltSize - 2; i++) {
          if (belt[i] === null && belt[i+1] === null && belt[i+2] === null) {
            emptyIndex = i;
            break;
          }
        }
        if (emptyIndex === -1) {
          alert('벨트에 연속된 3개의 빈 칸이 없습니다!');
          return;
        }
      } else {
        emptyIndex = belt.findIndex(i => i === null);
        if (emptyIndex === -1) {
          alert('벨트에 빈 칸이 없습니다!');
          return;
        }
      }

      const newBelt = [...belt];
      newBelt[emptyIndex] = item;
      if (item.size >= 2) {
        newBelt[emptyIndex + 1] = { ...item, id: 'dummy_slot', name: '차지됨', description: '', cost: 0, tier: 1, type: 'passive', size: 1, icon: '🔒' };
      }
      if (item.size === 3) {
        newBelt[emptyIndex + 2] = { ...item, id: 'dummy_slot', name: '차지됨', description: '', cost: 0, tier: 1, type: 'passive', size: 1, icon: '🔒' };
      }
      if (item.id === 'shield_generator') {
        setShieldGeneratorCharges(3);
      }
      setBelt(newBelt);
      if (item.cost > 0) setCoupons(prev => prev - item.cost);
      setShopItems(prev => prev.filter(i => i.id !== item.id));
    }
  };

  const rerollShop = () => {
    const hasVVIP = belt.some(i => i?.id === 'legendary_vvip_card');
    const hasCarrotCoupon = belt.some(i => i?.id === 'carrot_coupon');
    const currentCost = hasVVIP ? 0n : rerollCost;
    if (money < currentCost) return;
    setMoney(prev => prev - currentCost);
    if (!hasVVIP) {
      const increase = hasCarrotCoupon ? 500n : 1000n;
      setRerollCost(prev => prev + increase);
    }
    generateShop();
  };

  const nextRound = () => {
    setRound(prev => prev + 1);
    setQuota(prev => prev * 2n + 200n); // Increase quota
    setPhase('TURN_SELECTION');
    setSelectedBeltIndex(null);
    setRerollCost(1000n);
  };

  const startBossChallenge = () => {
    setRound(prev => prev + 1);
    setQuota(prev => (prev * 2n + 200n) * 1000n); // 1000x quota
    setPhase('TURN_SELECTION');
    setSelectedBeltIndex(null);
    setRerollCost(1000n);
    setIsBossChallenge(true);
  };

  const canSubmit = money >= quota;
  const isForcedSubmit = turn === 0;

  const renderBelt = () => (
    <div className="jp-slot-belt-container">
      <div className="flex justify-between items-center mb-2">
        <div className="jp-slot-belt-title">시너지 벨트</div>
        <div className="text-xs text-gray-400">쿠폰: {coupons}장</div>
      </div>
      <div className="jp-slot-belt" id="jp-belt">
        {belt.slice(0, beltSize).map((item, i) => (
          <div 
            key={i} 
            className={`jp-slot-item ${item ? 'active' : ''} ${selectedBeltIndex === i ? 'jp-slot-item-highlight' : ''} relative cursor-pointer`} 
            title={item?.description}
            onClick={(e) => {
              e.stopPropagation();
              handleBeltItemClick(i);
            }}
          >
            {item ? (
              <div className="flex flex-col items-center justify-center">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-[10px] mt-1 text-center leading-tight hidden md:block">{item.name}</span>
              </div>
            ) : (
              <span className="opacity-20">+</span>
            )}
            
            {selectedBeltIndex === i && item && item.id !== 'dummy_slot' && (
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-50">
                <button 
                  className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-1 px-3 rounded shadow-lg flex items-center gap-1 whitespace-nowrap"
                  onClick={(e) => {
                    e.stopPropagation();
                    sellItem(i);
                  }}
                >
                  판매 ({getRefundCoupons(item.tier)}장)
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div 
      className="jp-slot-wrapper" 
      ref={wrapperRef}
      onClick={() => setSelectedBeltIndex(null)}
    >
      {phase === 'TURN_SELECTION' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center p-4">
          <h2 className="text-4xl font-black text-[#ffb800] mb-2 italic">ROUND {round} START</h2>
          <p className="text-gray-400 mb-12 text-center">당신의 리스크 관리 능력을 시험합니다.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="p-8 rounded-3xl border-4 border-[#ff3366] bg-[#ff3366]/5 cursor-pointer flex flex-col items-center text-center"
              onClick={() => {
                setTurn(7);
                setMaxTurn(7);
                setTrapChanceMultiplier(1.0);
                setPhase('SLOT');
              }}
            >
              <div className="text-5xl mb-6">🎰</div>
              <h3 className="text-2xl font-bold text-[#ff3366] mb-4">표준 7스핀</h3>
              <p className="text-gray-300 mb-6">총 7턴 제공.<br/>가장 안정적인 선택.<br/>쿠폰 1장 + 조기입금턴 쿠폰.</p>
              <div className="mt-auto bg-[#ff3366] text-white font-bold px-6 py-2 rounded-full">선택하기</div>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="p-8 rounded-3xl border-4 border-[#00ffcc] bg-[#00ffcc]/5 cursor-pointer flex flex-col items-center text-center"
              onClick={() => {
                setTurn(3);
                setMaxTurn(3);
                setTrapChanceMultiplier(1.0);
                setPhase('SLOT');
              }}
            >
              <div className="text-5xl mb-6">⚡</div>
              <h3 className="text-2xl font-bold text-[#00ffcc] mb-4">효율중시 3스핀</h3>
              <p className="text-gray-300 mb-6">총 3턴 제공.<br/>빠른 클리어로 더 많은 보상.<br/>쿠폰 2장 + 조기입금턴×2 쿠폰.</p>
              <div className="mt-auto bg-[#00ffcc] text-black font-bold px-6 py-2 rounded-full">선택하기</div>
            </motion.div>
          </div>
        </motion.div>
      )}

      {phase === 'SLOT' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full relative">
          {/* Shop Overlay */}
          <AnimatePresence>
            {isShopOpen && (
              <motion.div 
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                className="absolute inset-0 z-[100] bg-[#0a0a0f]/95 p-6 overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-[#ffb800]">야옹 상회</h2>
                  <button onClick={() => setIsShopOpen(false)} className="p-2 hover:bg-white/10 rounded-full">
                    <X size={24} />
                  </button>
                </div>

                <div className="flex justify-center gap-6 mb-8 text-lg font-bold">
                  <div className="text-[#ffb800] flex items-center gap-2">
                    <Wallet size={20} />
                    {formatKoreanNumber(money)}원
                  </div>
                  <div className="text-[#ff4444] flex items-center gap-2">
                    🎫 {coupons}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-8">
                  {shopItems.map((item) => (
                    <div key={item.id} className="bg-[#1a1a24] border border-[#3a3a4c] rounded-xl p-4 flex items-center gap-4 hover:border-[#ffb800] transition-colors">
                      <div className="text-4xl">{item.icon}</div>
                      <div className="flex-1 text-left">
                        <h3 className="font-bold text-sm">{item.name}</h3>
                        <p className="text-[10px] text-gray-400">{item.description}</p>
                      </div>
                      <button 
                        onClick={() => buyItem(item)}
                        disabled={coupons < item.cost}
                        className="px-3 py-2 rounded-lg font-bold text-xs bg-[#2a2a36] hover:bg-[#3a3a4c] disabled:opacity-50"
                      >
                        🎫 {item.cost}
                      </button>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={rerollShop}
                  disabled={money < rerollCost && !belt.some(i => i?.id === 'legendary_vvip_card')}
                  className="w-full py-3 rounded-xl font-bold bg-[#2a2a36] border border-[#3a3a4c] hover:bg-[#3a3a4c] flex justify-center items-center gap-2 mb-4"
                >
                  <RefreshCw size={18} />
                  리롤 ({belt.some(i => i?.id === 'legendary_vvip_card') ? '무료' : `${formatKoreanNumber(rerollCost)}원`})
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="jp-slot-header flex-col md:flex-row gap-4">
            <div className="jp-slot-info text-center md:text-left">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black">ROUND {round}</h2>
                <div className="bg-[#1a1a24] px-2 py-1 rounded text-xs text-[#00ffcc] font-bold flex items-center gap-1">
                  <Sparkles size={12} />
                  LUCK {luck + belt.reduce((acc, item) => {
                    if (item?.id === 'clover_hairpin') return acc + 20;
                    if (item?.id === 'lucky_clover') return acc + 5;
                    return acc;
                  }, 0)}
                </div>
              </div>
              <div className="flex flex-col gap-1 mt-2">
                <div className="flex items-center gap-2 text-[#ffb800] font-bold">
                  <Wallet size={16} />
                  소지품: {formatKoreanNumber(displayMoney)}원
                </div>
                <div className="flex items-center gap-2 text-[#00ffcc] font-bold">
                  <Shield size={16} />
                  금고(ATM): {formatKoreanNumber(displayAtm)}원
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end gap-2">
              <div className="jp-slot-quota">할당량: {formatKoreanNumber(quota)}원</div>
              <div className="flex items-center gap-3">
                <div style={{ color: turn === 0 ? '#ff3366' : '#aaa', fontWeight: 'bold' }}>
                  남은 턴: {turn}/{maxTurn}
                </div>
                <button 
                  className="bg-[#1a1a24] border border-[#3a3a4c] p-2 rounded-lg hover:border-[#00ffcc] transition-colors"
                  onClick={() => setIsShopOpen(!isShopOpen)}
                >
                  <ShoppingCart size={20} className="text-[#00ffcc]" />
                </button>
              </div>
              <button 
                className="bg-[#00ffcc] text-black text-xs font-bold px-4 py-1.5 rounded-full hover:bg-white transition-colors"
                onClick={() => deposit(money)}
                disabled={money <= 0n}
              >
                전액 입금 (이자 {7 + belt.reduce((acc, it) => it?.id === 'compound_interest_calculator' ? acc + (it.currentMultiplier || 0) : acc, 0)}%)
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="relative">
            <div className={`jp-slot-grid ${isTeasing ? 'jp-slot-teasing' : ''}`} id="jp-grid">
              {gridSymbols.map((sym, i) => {
                const col = i % 5;
                const isStopped = reelStopping[col];
                return (
                  <div 
                    key={i} 
                    className={`jp-slot-cell ${i === wildcardIndex ? 'border-2 border-[#ff00ff] shadow-[0_0_10px_#ff00ff]' : ''} ${highlightedIndices.includes(i) ? 'jp-slot-cell-highlight' : ''} ${!isStopped ? 'jp-slot-spinning' : 'jp-slot-stopped'}`}
                  >
                    {sym}
                  </div>
                );
              })}
            </div>
            
            {/* Spin Result Overlay */}
            <AnimatePresence>
              {!isSpinning && lastSpinTotal > 0n && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center"
                >
                  <div className="pointer-events-none flex flex-col items-center">
                    {lastSpinCombo > 0 && (
                      <div className="bg-black/80 border-2 border-[#00ffcc] text-[#00ffcc] px-6 py-2 rounded-full font-black text-2xl mb-2 shadow-[0_0_20px_rgba(0,255,204,0.5)]">
                        {lastSpinCombo} COMBO!
                      </div>
                    )}
                    <div className="bg-black/80 border-2 border-[#ffb800] text-[#ffb800] px-8 py-3 rounded-2xl font-black text-4xl shadow-[0_0_30px_rgba(255,184,0,0.5)]">
                      +{formatKoreanNumber(lastSpinTotal)}원
                    </div>
                  </div>
                  
                  <button 
                    className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full text-sm font-bold border border-gray-600 transition-colors"
                    onClick={() => setShowReceipt(!showReceipt)}
                  >
                    {showReceipt ? '영수증 닫기' : '영수증 보기'}
                  </button>

                  <AnimatePresence>
                    {showReceipt && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 bg-black/90 border border-gray-700 rounded-xl p-4 w-72 max-h-64 overflow-y-auto text-sm shadow-2xl"
                      >
                        <h3 className="text-[#ffb800] font-bold mb-3 text-center border-b border-gray-700 pb-2">🧾 정산 영수증</h3>
                        <div className="flex flex-col gap-2">
                          {receipt.map((step, idx) => (
                            <div key={idx} className="flex justify-between items-center border-b border-gray-800 pb-1">
                              <span className="text-gray-300 truncate max-w-[140px]">{step.name}</span>
                              <div className="flex flex-col items-end">
                                <span className={step.type === 'multiplier' || step.type === 'global' ? 'text-[#00ffcc]' : 'text-[#ffb800]'}>
                                  {step.value}
                                </span>
                                <span className="text-xs text-gray-500">{formatKoreanNumber(step.amount)}</span>
                              </div>
                            </div>
                          ))}
                          <div className="mt-2 pt-2 border-t-2 border-dashed border-gray-600 flex justify-between items-center font-bold">
                            <span className="text-white">최종 금액</span>
                            <span className="text-[#ffb800] text-lg">{formatKoreanNumber(lastSpinTotal)}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Belt */}
          {renderBelt()}

          {/* Controls */}
          <div className="jp-slot-controls flex flex-col md:flex-row gap-4 justify-center mt-6">
            <button 
              className="jp-slot-btn flex-1 py-4 text-xl md:text-2xl"
              onClick={spin}
              disabled={isSpinning || turn <= 0}
            >
              🎰 SPIN
            </button>
            
            <button 
              className={`jp-slot-submit-btn flex-1 py-4 text-xl font-bold rounded-full transition-all duration-300 ${
                (atm + money) >= quota 
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-600 text-white shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-pulse' 
                  : isForcedSubmit 
                    ? 'bg-red-500 text-white animate-bounce'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
              onClick={handleSubmit}
              disabled={(atm + money) < quota && !isForcedSubmit}
            >
              {(atm + money) >= quota ? '✨ 할당량 납부' : isForcedSubmit ? '💀 파산 확정' : '🔒 금액 부족'}
            </button>
          </div>
        </motion.div>
      )}

      {phase === 'WHISPER' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-full flex flex-col items-center justify-center p-4">
          <h2 className="text-4xl font-black text-[#00ffcc] mb-2 italic">Angel's Whisper</h2>
          <p className="text-gray-400 mb-12 text-center">라운드 시작 전, 당신의 운명을 선택하세요.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
            {whisperOptions.map((option) => (
              <motion.div 
                key={option.id}
                whileHover={{ scale: 1.05 }}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
                  option.type === 'angel' ? 'border-[#00ffcc] bg-[#00ffcc]/5' :
                  option.type === 'devil' ? 'border-[#ff3366] bg-[#ff3366]/5' :
                  'border-[#ffb800] bg-[#ffb800]/5'
                }`}
                onClick={() => {
                  option.effect();
                  generateShop();
                  setPhase('SHOP');
                }}
              >
                <div className="text-3xl mb-4">{option.type === 'angel' ? '👼' : option.type === 'devil' ? '😈' : '✨'}</div>
                <h3 className={`text-xl font-bold mb-2 ${
                  option.type === 'angel' ? 'text-[#00ffcc]' :
                  option.type === 'devil' ? 'text-[#ff3366]' :
                  'text-[#ffb800]'
                }`}>{option.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed">{option.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {phase === 'SHOP' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col relative">
          <button
            onClick={() => setShowLeaderboard(true)}
            className="absolute top-0 right-0 p-2 bg-yellow-400 text-black rounded-full hover:bg-yellow-300 transition-colors shadow-lg flex items-center gap-2"
          >
            <Trophy size={20} />
            <span className="font-bold text-sm hidden sm:inline">명예의 전당</span>
          </button>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-[#00ffcc] mb-2">야옹 상회</h2>
            <div className="flex justify-center gap-6 text-xl font-bold">
              <div className="text-[#ffb800] flex items-center gap-2">
                <Wallet size={24} />
                {formatKoreanNumber(money)}원
              </div>
              <div className="text-[#00ffcc] flex items-center gap-2">
                <Shield size={24} />
                {formatKoreanNumber(atm)}원
              </div>
              <div className="text-[#ff4444] flex items-center gap-2">
                🎫 쿠폰 {coupons}장
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {shopItems.map((item) => (
              <div key={item.id} className="bg-[#1a1a24] border border-[#3a3a4c] rounded-xl p-4 flex flex-col items-center text-center hover:border-[#ffb800] transition-colors">
                <div className="text-4xl mb-2">{item.icon}</div>
                <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                <p className="text-xs text-gray-400 mb-4 h-10">{item.description}</p>
                <div className="mt-auto w-full">
                  <button 
                    onClick={() => buyItem(item)}
                    disabled={coupons < item.cost}
                    className="w-full py-2 rounded-lg font-bold bg-[#2a2a36] hover:bg-[#3a3a4c] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    🎫 쿠폰 {item.cost}장
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-8">
            {renderBelt()}
          </div>

          <div className="flex flex-col md:flex-row gap-4 mt-auto">
            <button 
              onClick={rerollShop}
              disabled={money < rerollCost && !belt.some(i => i?.id === 'legendary_vvip_card')}
              className="flex-1 py-3 rounded-xl font-bold bg-[#2a2a36] border border-[#3a3a4c] hover:bg-[#3a3a4c] flex justify-center items-center gap-2"
            >
              <RefreshCw size={18} />
              리롤 ({belt.some(i => i?.id === 'legendary_vvip_card') ? '무료' : `${formatKoreanNumber(rerollCost)}원`})
            </button>
            {money >= quota || atm >= quota ? (
              <>
                <button 
                  onClick={startBossChallenge}
                  className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-red-600 to-red-800 text-white hover:opacity-90 flex justify-center items-center gap-2"
                >
                  💀 보스 도전 (할당량 x1000)
                </button>
                <button 
                  onClick={() => setPhase('TURN_SELECTION')}
                  className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-[#00ffcc] to-[#00b3ff] text-black hover:opacity-90 flex justify-center items-center gap-2"
                >
                  {round === 1 ? '게임 시작' : '슬롯으로 돌아가기'}
                  <ArrowRight size={18} />
                </button>
              </>
            ) : (
              <button 
                onClick={() => setPhase('TURN_SELECTION')}
                className="flex-1 py-3 rounded-xl font-bold bg-[#2a2a36] border border-[#3a3a4c] hover:bg-[#3a3a4c] flex justify-center items-center gap-2"
              >
                {round === 1 ? '게임 시작' : '슬롯으로 돌아가기'}
              </button>
            )}
          </div>
        </motion.div>
      )}

      {phase === 'GAMEOVER' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center p-6">
          <div className="text-8xl mb-8">ㅠㅠ</div>
          <h2 className="text-5xl font-black text-red-500 mb-4">파산했습니다 ㅠㅠ</h2>
          <p className="text-xl text-gray-300 mb-8">무자비한 할당량 앞에 무릎을 꿇었습니다...</p>
          <div className="text-2xl text-[#ffb800] mb-8">
            최종 도달: ROUND {round}
          </div>
          <div className="flex gap-4">
            <button 
              onClick={resetGame}
              className="px-8 py-4 bg-[#00ffcc] text-black rounded-full font-bold text-xl hover:bg-white transition-all shadow-[0_0_20px_rgba(0,255,204,0.4)]"
            >
              다시 도전하기
            </button>
            <button 
              onClick={() => setShowLeaderboard(true)}
              className="px-8 py-4 bg-yellow-400 text-black rounded-full font-bold text-xl hover:bg-yellow-300 transition-all shadow-[0_0_20px_rgba(250,204,21,0.4)] flex items-center gap-2"
            >
              <Trophy size={24} />
              명예의 전당
            </button>
          </div>
        </motion.div>
      )}

      {showLeaderboard && (
        <CosmicJackpotLeaderboard 
          onClose={() => setShowLeaderboard(false)} 
          currentScore={money + atm} 
          currentRound={round} 
          isGameOver={phase === 'GAMEOVER'}
        />
      )}
    </div>
  );
};
