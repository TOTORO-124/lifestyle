import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { COSMIC_ITEMS, CosmicItem } from '../data/cosmicJackpotItems';
import { Coins, ShoppingCart, ArrowRight, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import './CosmicJackpot.css';

interface CosmicJackpotProps {
  onGameOver?: () => void;
  onClear?: () => void;
}

const SYMBOLS = [
  { char: '🍒', value: 1n },
  { char: '🍋', value: 2n },
  { char: '💎', value: 5n },
  { char: '🔔', value: 10n },
  { char: '7️⃣', value: 50n }
];

export const CosmicJackpot: React.FC<CosmicJackpotProps> = ({ onGameOver, onClear }) => {
  const [phase, setPhase] = useState<'SLOT' | 'SHOP' | 'GAMEOVER'>('SLOT');
  const [round, setRound] = useState(1);
  const [turn, setTurn] = useState(3);
  const [quota, setQuota] = useState<bigint>(500n);
  const [money, setMoney] = useState<bigint>(0n);
  const [coupons, setCoupons] = useState(0);
  const [hotPotatoBuff, setHotPotatoBuff] = useState(0); // Turns remaining
  const [selectedBeltIndex, setSelectedBeltIndex] = useState<number | null>(null);
  
  const [belt, setBelt] = useState<(CosmicItem | null)[]>([null, null, null, null, null]);
  const [beltSize, setBeltSize] = useState(5);
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [shopItems, setShopItems] = useState<CosmicItem[]>([]);
  const [gridSymbols, setGridSymbols] = useState<string[]>(Array(15).fill('❓'));
  
  // Item specific states
  const [snowballStacks, setSnowballStacks] = useState<Record<number, bigint>>({});
  const [piggyBankSaved, setPiggyBankSaved] = useState(0n);

  const wrapperRef = useRef<HTMLDivElement>(null);

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

  const createPopParticles = (x: number, y: number) => {
    if (!wrapperRef.current) return;
    for (let i = 0; i < 8; i++) {
      const particle = document.createElement('div');
      particle.className = 'jp-slot-pop-particle';
      particle.style.left = `${x}px`;
      particle.style.top = `${y}px`;
      const angle = (Math.PI * 2 * i) / 8;
      const velocity = 30 + Math.random() * 20;
      particle.style.setProperty('--vx', `${Math.cos(angle) * velocity}px`);
      particle.style.setProperty('--vy', `${Math.sin(angle) * velocity}px`);
      wrapperRef.current.appendChild(particle);
      setTimeout(() => {
        if (particle.parentNode) particle.remove();
      }, 600);
    }
  };

  const sellItem = (index: number) => {
    if (isSpinning) return;
    const item = belt[index];
    if (!item || item.id === 'dummy_slot') return;

    const refund = BigInt(Math.floor(item.cost / 2));
    setMoney(prev => prev + refund);
    
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
      showPopup(`+${formatKoreanNumber(refund)}원`, x, y, false);
      createPopParticles(x, y);
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
    setIsSpinning(true);
    setSelectedBeltIndex(null);
    setTurn(prev => prev - 1);

    const spinDuration = 1000;
    const interval = 50;
    let currentTurn = turn - 1;
    
    // 1. Spinning Animation
    const spinInterval = setInterval(() => {
      setGridSymbols(Array(15).fill(0).map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)].char));
    }, interval);

    await sleep(spinDuration);
    clearInterval(spinInterval);
    
    // 2. Stop and Calculate Base Score
    let turnBaseScore = 0n;
    const finalSymbols = Array(15).fill(0).map(() => {
      const sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      turnBaseScore += sym.value;
      return sym;
    });
    
    setGridSymbols(finalSymbols.map(s => s.char));

    // Meteor Candy check
    const sevensCount = finalSymbols.filter(s => s.char === '7️⃣').length;

    const gridEl = document.getElementById('jp-grid');
    if (gridEl && wrapperRef.current) {
      const rect = gridEl.getBoundingClientRect();
      const wRect = wrapperRef.current.getBoundingClientRect();
      showPopup(`+${formatKoreanNumber(turnBaseScore)}`, rect.left - wRect.left + rect.width/2, rect.top - wRect.top + rect.height/2);
    }
    
    await sleep(600);

    // 3. Synergy Belt Calculation
    let turnFinalScore = turnBaseScore;
    let newPiggyBank = piggyBankSaved;
    let newSnowball = { ...snowballStacks };
    let coffeeBoostActive = false;
    let newBelt = [...belt];

    const triggerCounts = Array(beltSize).fill(1);
    for (let i = 0; i < beltSize - 1; i++) {
      if (newBelt[i]?.id === 'twin_mirror') {
        triggerCounts[i + 1] += 1;
        showItemPopup(i, '거울 복사!', true);
      }
    }

    // Priority 1: Base Additions
    for (let i = 0; i < beltSize; i++) {
      const item = newBelt[i];
      if (!item) continue;

      for (let t = 0; t < triggerCounts[i]; t++) {
        let added = 0n;
        if (item.id === 'coin_1') added = 10n;
        else if (item.id === 'cash_dog') added = 30n;
        else if (item.id === 'gold_cat') added = 50n;
        else if (item.id === 'hamster_worker') added = currentTurn === 0 ? 100n : 10n;
        else if (item.id === 'lucky_clover') added = BigInt(Math.floor(Math.random() * 91) + 10);
        else if (item.id === 'snowball_rice') {
          const currentMult = newSnowball[i] || 1n;
          added = 10n * currentMult;
          newSnowball[i] = currentMult * 2n;
        }
        else if (item.id === 'space_donut') {
          added = 20n;
          if ((i === 0 || !newBelt[i-1]) && (i === beltSize - 1 || !newBelt[i+1])) added += 80n;
        }
        else if (item.id === 'alien_jelly') {
          const alienCount = newBelt.filter(it => it?.id === 'alien_jelly').length;
          added = 10n * BigInt(Math.pow(2, alienCount - 1));
        }
        else if (item.id === 'sleepy_owl') {
          added = currentTurn === 0 ? 300n : 0n;
        }
        else if (item.id === 'black_cat') {
          added = Math.random() > 0.5 ? 100n : 0n;
        }
        else if (item.id === 'hungry_pig') {
          added = -10n;
          newPiggyBank += 10n;
        }
        else if (item.id === 'meteor_candy') {
          added = BigInt(sevensCount * 500);
        }

        if (hotPotatoBuff > 0) {
          added += 20n;
        }

        if (added !== 0n) {
          turnFinalScore += added;
          showItemPopup(i, added > 0n ? `+${formatKoreanNumber(added)}` : `${formatKoreanNumber(added)}`);
          await sleep(300);
        }
      }
    }

    // Priority 2: Multipliers (Coffee, Magnifier, Mirror, Popcorn)
    const coffeeIndex = newBelt.findIndex(i => i?.id === 'coffee_boost');
    if (coffeeIndex !== -1) {
      coffeeBoostActive = true;
      for (let t = 0; t < triggerCounts[coffeeIndex]; t++) {
        turnFinalScore *= 2n;
      }
      showItemPopup(coffeeIndex, 'x2 BOOST!', true);
      triggerShake();
      newBelt[coffeeIndex] = null; // Destroy
      await sleep(400);
    }

    for (let i = 0; i < beltSize; i++) {
      const item = newBelt[i];
      if (!item) continue;

      for (let t = 0; t < triggerCounts[i]; t++) {
        if (item.id === 'gold_magnifier' && i > 0 && newBelt[i-1]) {
          turnFinalScore *= 2n;
          showItemPopup(i, 'x2', true);
          triggerShake();
          await sleep(300);
        }
        else if (item.id === 'magic_popcorn') {
          if (i > 0 && newBelt[i-1]) turnFinalScore *= 3n;
          if (i < beltSize - 1 && newBelt[i+1]) turnFinalScore *= 3n;
          showItemPopup(i, 'x3 POP!', true);
          triggerShake();
          await sleep(300);
        }
        else if (item.id === 'blackhole_safe') {
          turnFinalScore *= 3n;
          showItemPopup(i, 'x3 BLACKHOLE', true);
          triggerShake();
          newBelt[i] = null; // Destroy
          if (i + 1 < beltSize && newBelt[i+1]?.id === 'dummy_slot') {
            newBelt[i+1] = null;
          }
          await sleep(300);
        }
      }
    }

    // Apply score
    let finalMoney = money + turnFinalScore;

    // Priority 3: End of turn global effects (Onion)
    for (let i = 0; i < beltSize; i++) {
      const item = newBelt[i];
      if (item?.id === 'gold_onion') {
        for (let t = 0; t < triggerCounts[i]; t++) {
          const interest = finalMoney * 5n / 100n;
          finalMoney += interest;
          showItemPopup(i, `+${formatKoreanNumber(interest)} 이자`);
          await sleep(300);
        }
      }
    }

    setMoney(finalMoney);
    setPiggyBankSaved(newPiggyBank);
    setSnowballStacks(newSnowball);
    setBelt(newBelt);
    
    setIsSpinning(false);

    // End of turn 3 check is handled in useEffect or Submit button
  };

  const showItemPopup = (index: number, text: string, isRainbow = false) => {
    const itemEls = document.querySelectorAll('.jp-slot-item');
    if (itemEls[index] && wrapperRef.current) {
      const rect = itemEls[index].getBoundingClientRect();
      const wRect = wrapperRef.current.getBoundingClientRect();
      showPopup(text, rect.left - wRect.left + rect.width/2, rect.top - wRect.top - 20, isRainbow);
    }
  };

  const handleSubmit = async () => {
    if (money < quota) {
      // Game Over
      setPhase('GAMEOVER');
      if (onGameOver) onGameOver();
      return;
    }

    // Clear Round
    createCoinWaterfall();
    triggerShake();
    
    let payout: bigint = BigInt(money) - BigInt(quota);
    
    const triggerCounts = Array(beltSize).fill(1);
    for (let i = 0; i < beltSize - 1; i++) {
      if (belt[i]?.id === 'twin_mirror') {
        triggerCounts[i + 1] += 1;
      }
    }

    // Piggy Bank payout
    let totalPigReward = 0n;
    for (let i = 0; i < beltSize; i++) {
      if (belt[i]?.id === 'hungry_pig' && piggyBankSaved > 0n) {
        totalPigReward += piggyBankSaved * 10n * BigInt(triggerCounts[i]);
      }
    }
    if (totalPigReward > 0n) {
      payout += totalPigReward;
      alert(`🐷 먹보 아기 돼지의 보은! +${formatKoreanNumber(totalPigReward)}원`);
      setPiggyBankSaved(0n);
    }

    // Golden Ticket
    let ticketCount = 0;
    for (let i = 0; i < beltSize; i++) {
      if (belt[i]?.id === 'golden_ticket') {
        ticketCount += triggerCounts[i];
      }
    }
    const earnedCoupons = 1 + ticketCount;

    setMoney(payout);
    setCoupons(prev => prev + earnedCoupons);
    setHotPotatoBuff(0); // Reset buff on round clear
    
    await sleep(1500);
    generateShop();
    setPhase('SHOP');
  };

  // --- Shop Logic ---
  const generateShop = () => {
    const shuffled = [...COSMIC_ITEMS].sort(() => 0.5 - Math.random());
    setShopItems(shuffled.slice(0, 3));
  };

  const buyItem = (item: CosmicItem) => {
    if (money < BigInt(item.cost)) {
      alert('돈이 부족합니다!');
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
      }
      setMoney(prev => prev - BigInt(item.cost));
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
      } else {
        emptyIndex = belt.findIndex(i => i === null);
        if (emptyIndex === -1) {
          alert('벨트에 빈 칸이 없습니다!');
          return;
        }
      }

      const newBelt = [...belt];
      newBelt[emptyIndex] = item;
      if (item.size === 2) {
        // Use a dummy item or the same item for the second slot to mark it occupied
        // We'll use a special dummy item to prevent double-triggering
        newBelt[emptyIndex + 1] = { ...item, id: 'dummy_slot', name: '차지됨', description: '', cost: 0, tier: 1, type: 'passive', size: 1, icon: '🔒' };
      }
      setBelt(newBelt);
      setMoney(prev => prev - BigInt(item.cost));
      setShopItems(prev => prev.filter(i => i.id !== item.id));
    }
  };

  const rerollShop = () => {
    if (money < 50n) return;
    setMoney(prev => prev - 50n);
    generateShop();
  };

  const nextRound = () => {
    setRound(prev => prev + 1);
    setQuota(prev => prev * 2n + 200n); // Increase quota
    setTurn(3);
    setPhase('SLOT');
    setSelectedBeltIndex(null);
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
            className={`jp-slot-item ${item ? 'active' : ''} relative cursor-pointer`} 
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
                  판매 ({formatKoreanNumber(BigInt(Math.floor(item.cost / 2)))}원)
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
      {phase === 'SLOT' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
          {/* Header */}
          <div className="jp-slot-header flex-col md:flex-row gap-4">
            <div className="jp-slot-info text-center md:text-left">
              <h2>ROUND {round}</h2>
              <div className="jp-slot-money">{formatKoreanNumber(money)}원</div>
            </div>
            <div className="jp-slot-info text-center md:text-right">
              <div className="jp-slot-quota">목표: {formatKoreanNumber(quota)}원</div>
              <div style={{ color: turn === 0 ? '#ff3366' : '#aaa', marginTop: '5px', fontWeight: 'bold' }}>
                남은 턴: {turn}/3
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="jp-slot-grid" id="jp-grid">
            {gridSymbols.map((sym, i) => (
              <div key={i} className="jp-slot-cell">{sym}</div>
            ))}
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
                canSubmit 
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-600 text-white shadow-[0_0_20px_rgba(251,191,36,0.6)] animate-pulse' 
                  : isForcedSubmit 
                    ? 'bg-red-500 text-white animate-bounce'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
              onClick={handleSubmit}
              disabled={!canSubmit && !isForcedSubmit}
            >
              {canSubmit ? '✨ 할당량 납부' : isForcedSubmit ? '💀 파산 확정' : '🔒 납부 불가'}
            </button>
          </div>
        </motion.div>
      )}

      {phase === 'SHOP' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-[#00ffcc] mb-2">야옹 상회</h2>
            <div className="text-xl text-[#ffb800] font-bold">보유 금액: {formatKoreanNumber(money)}원</div>
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
                    disabled={money < BigInt(item.cost)}
                    className="w-full py-2 rounded-lg font-bold bg-[#2a2a36] hover:bg-[#3a3a4c] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                  >
                    <Coins size={16} className="text-[#ffb800]" />
                    {item.cost}원
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
              disabled={money < 50n}
              className="flex-1 py-3 rounded-xl font-bold bg-[#2a2a36] border border-[#3a3a4c] hover:bg-[#3a3a4c] flex justify-center items-center gap-2"
            >
              <RefreshCw size={18} />
              리롤 (50원)
            </button>
            <button 
              onClick={nextRound}
              className="flex-1 py-3 rounded-xl font-bold bg-gradient-to-r from-[#00ffcc] to-[#00b3ff] text-black hover:opacity-90 flex justify-center items-center gap-2"
            >
              다음 라운드로
              <ArrowRight size={18} />
            </button>
          </div>
        </motion.div>
      )}

      {phase === 'GAMEOVER' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center">
          <h2 className="text-5xl font-black text-red-500 mb-4">GAME OVER</h2>
          <p className="text-xl text-gray-300 mb-8">할당량을 채우지 못해 파산했습니다...</p>
          <div className="text-2xl text-[#ffb800] mb-8">
            최종 도달: ROUND {round}
          </div>
          <button 
            onClick={() => {
              if (onClear) onClear(); // Or reset game
            }}
            className="px-8 py-4 bg-white text-black rounded-full font-bold text-xl hover:bg-gray-200"
          >
            메인으로 돌아가기
          </button>
        </motion.div>
      )}
    </div>
  );
};
