import { CosmicItem } from '../data/cosmicJackpotItems';

export interface ReceiptStep {
  name: string;
  type: 'base' | 'multiplier' | 'global' | 'interest';
  value: string;
  amount: bigint;
}

export interface SynergyState {
  grid: string[];
  overlays: string[][];
  belt: (CosmicItem | null)[];
  atm: bigint;
  luck: number;
  globalPatternBonus: number;
  piggyBankSaved: bigint;
  hotPotatoBuff: number;
  fairyMagnifierTurns: number;
  trapChanceMultiplier: number;
  turn: number;
  maxTurn: number;
  isBossChallenge: boolean;
  isBankrupt?: boolean;
  shieldGeneratorCharges: number;
  snowballStacks: { [index: number]: bigint };
  coupons: number;
  symbolMultiplier: number;
  patternMultiplierBonus: number;
  extraPatternTriggers: number;
  smallPatternMultiplier: number;
  largePatternMultiplier: number;
}

export interface SynergyResult {
  finalScore: bigint;
  receipt: ReceiptStep[];
  newBelt: (CosmicItem | null)[];
  newPiggyBank: bigint;
  addedLuck: number;
  addedCoupons: number;
  addedAtm: bigint;
  interestEarned: bigint;
  comboCount: number;
  patternMultiplier: number;
  isBankrupt: boolean;
  shieldChargesUsed: number;
  bibleUsed: boolean;
  newSnowball: { [index: number]: bigint };
}

export const calculateSynergy = (state: SynergyState): SynergyResult => {
  const { 
    grid, overlays, belt, atm, luck, globalPatternBonus, piggyBankSaved, 
    hotPotatoBuff, turn, maxTurn, shieldGeneratorCharges, 
    snowballStacks, coupons, symbolMultiplier, patternMultiplierBonus,
    extraPatternTriggers, smallPatternMultiplier, largePatternMultiplier
  } = state;
  const newBelt = belt.map(item => item ? { ...item } : null);
  const newSnowball = { ...snowballStacks };
  const receipt: ReceiptStep[] = [];
  
  let isBankrupt = false;
  let shieldChargesUsed = 0;
  let bibleUsed = false;
  let addedCoupons = 0;
  let addedAtm = 0n;

  const getDeceptionMult = (item: CosmicItem | null) => {
    if (item?.trait === 'deception') {
      return Math.random() < 0.2 ? 0 : 2;
    }
    return 1;
  };

  // --- Pattern Detection ---
  const checkCombo = (indices: number[], type?: string) => {
    const chars = indices.map(idx => grid[idx]);
    const cellOverlays = indices.map(idx => overlays[idx] || []);
    
    if (type) {
      // Check for overlay combo
      return cellOverlays.every(ovs => ovs.includes(type));
    }

    const first = chars.find(c => c !== 'WILD');
    if (first === '6') return false; // Trap symbols don't form combos
    if (!first) return true; // All WILD is a combo
    return chars.every(c => c === first || c === 'WILD');
  };

  let patternMultiplier = 1.0;
  let comboCount = 0;
  const triggeredPatterns: Set<string> = new Set();
  
  const applyPattern = (indices: number[], mult: number, name: string, priority: number, excludes: string[] = []) => {
    // Check if any excluded patterns already triggered
    if (excludes.some(ex => triggeredPatterns.has(ex))) return;

    const triggers = 1 + extraPatternTriggers;
    let triggered = false;

    // Check base symbols
    if (checkCombo(indices)) {
      triggered = true;
    } else {
      // Check overlays
      const allOverlays = Array.from(new Set(overlays.flat()));
      for (const ov of allOverlays) {
        if (checkCombo(indices, ov)) {
          triggered = true;
          break;
        }
      }
    }

    if (triggered) {
      for(let i=0; i<triggers; i++) {
        let finalMult = mult;
        if (indices.length <= 3) finalMult *= smallPatternMultiplier;
        else finalMult *= largePatternMultiplier;
        
        patternMultiplier *= finalMult;
        comboCount++;
      }
      triggeredPatterns.add(name);
    }
  };

  // Pattern Definitions (Priority based, higher first)
  // 1. Jackpot (15 symbols)
  const allIndices = Array.from({length: 15}, (_, i) => i);
  applyPattern(allIndices, 10.0, 'Jackpot', 100);

  // 2. Eye (눈)
  applyPattern([1,2,3, 5,6,8,9, 11,12,13], 8.0, 'Eye', 90, []);

  // 3. Heaven/Earth (천상/지상)
  applyPattern([0,1,2,3,4, 6,8, 12], 7.0, 'Heaven', 80, []);
  applyPattern([2,6,8, 10,11,12,13,14], 7.0, 'Earth', 80, []);

  // 4. Zig/Zag (지그/재그)
  applyPattern([2,6,8,10,14], 4.0, 'Zig', 70, ['Heaven', 'Earth']);
  applyPattern([0,4,6,8,12], 4.0, 'Zag', 70, ['Heaven', 'Earth']);

  // 5. Horizontal XL (5 symbols)
  [ [0,1,2,3,4], [5,6,7,8,9], [10,11,12,13,14] ].forEach((row, i) => {
    const excludes = i === 0 ? ['Heaven'] : (i === 2 ? ['Earth'] : []);
    applyPattern(row, 3.0, `RowXL_${i}`, 60, excludes);
  });

  // 6. Horizontal L (4 symbols)
  [ [0,1,2,3], [1,2,3,4], [5,6,7,8], [6,7,8,9], [10,11,12,13], [11,12,13,14] ].forEach((row, i) => {
    const rowIdx = Math.floor(i/2);
    const excludes = [`RowXL_${rowIdx}`];
    applyPattern(row, 2.0, `RowL_${i}`, 50, excludes);
  });

  // 7. Horizontal (3 symbols)
  [ [0,1,2], [1,2,3], [2,3,4], [5,6,7], [6,7,8], [7,8,9], [10,11,12], [11,12,13], [12,13,14] ].forEach((row, i) => {
    const rowIdx = Math.floor(i/3);
    const excludes = [`RowXL_${rowIdx}`, `RowL_${rowIdx*2}`, `RowL_${rowIdx*2+1}`];
    applyPattern(row, 1.0, `Row_${i}`, 40, excludes);
  });

  // 8. Vertical (3 symbols)
  [ [0,5,10], [1,6,11], [2,7,12], [3,8,13], [4,9,14] ].forEach((col, i) => {
    const excludes = i === 1 || i === 3 ? ['Eye'] : [];
    applyPattern(col, 1.0, `Col_${i}`, 30, excludes);
  });

  // 9. Diagonal (3 symbols)
  [ [0,6,12], [1,7,13], [2,8,14], [10,6,2], [11,7,3], [12,8,4] ].forEach((diag, i) => {
    applyPattern(diag, 1.0, `Diag_${i}`, 20, ['Zig', 'Zag']);
  });

  // 10. Hidden S Patterns (2 symbols)
  // Horizontal S
  [ [0,1], [1,2], [2,3], [3,4], [5,6], [6,7], [7,8], [8,9], [10,11], [11,12], [12,13], [13,14] ].forEach((row, i) => {
    const rowIdx = Math.floor(i/4);
    const excludes = [`RowXL_${rowIdx}`, `RowL_${rowIdx*2}`, `RowL_${rowIdx*2+1}`, `Row_${rowIdx*3}`, `Row_${rowIdx*3+1}`, `Row_${rowIdx*3+2}`];
    applyPattern(row, 0.5, `RowS_${i}`, 10, excludes);
  });
  // Vertical S
  [ [0,5], [5,10], [1,6], [6,11], [2,7], [7,12], [3,8], [8,13], [4,9], [9,14] ].forEach((col, i) => {
    const colIdx = Math.floor(i/2);
    const excludes = [`Col_${colIdx}`];
    applyPattern(col, 0.5, `ColS_${i}`, 10, excludes);
  });

  // Trap Check
  const trapCount = grid.filter(r => r === '6').length;
  if (trapCount >= 3) {
    let protected_ = false;
    const bibleIdx = newBelt.findIndex(it => it?.id === 'bible_shield');
    if (bibleIdx !== -1) {
      newBelt[bibleIdx] = null;
      protected_ = true;
      bibleUsed = true;
    } else if (newBelt.some(it => it?.id === 'rosary_beads')) {
      protected_ = true;
    } else if (shieldGeneratorCharges > 0) {
      shieldChargesUsed = 1;
      protected_ = true;
    }

    if (!protected_) {
      isBankrupt = true;
      return {
        finalScore: 0n,
        receipt: [],
        newBelt,
        newPiggyBank: piggyBankSaved,
        addedLuck: 0,
        addedCoupons: 0,
        addedAtm: 0n,
        interestEarned: 0n,
        comboCount,
        patternMultiplier,
        isBankrupt,
        shieldChargesUsed,
        bibleUsed,
        newSnowball
      };
    }
  }

  // --- Step 1: Base Value ---
  let step1Base = 0n;
  
  // Base from symbols
  const SYMBOLS = [
    { char: '🍒', value: 2n },
    { char: '🍋', value: 2n },
    { char: '☘️', value: 3n },
    { char: '🔔', value: 3n },
    { char: '💎', value: 5n },
    { char: '💰', value: 5n },
    { char: '7', value: 7n },
  ];

  let symbolBase = 0n;
  grid.forEach(char => {
    if (char === 'WILD') {
      symbolBase += 5n * BigInt(Math.floor((1 + symbolMultiplier) * 100)) / 100n;
    } else {
      const sym = SYMBOLS.find(s => s.char === char);
      if (sym) symbolBase += sym.value * BigInt(Math.floor((1 + symbolMultiplier) * 100)) / 100n;
    }
  });
  
  step1Base += symbolBase;
  receipt.push({ name: '심볼 기본값', type: 'base', value: `+${symbolBase}`, amount: step1Base });

  // Base from items
  let newPiggyBank = piggyBankSaved;
  let addedLuck = 0;
  
  // Calculate trigger counts
  const triggerCounts = new Array(newBelt.length).fill(1);
  for (let i = 0; i < newBelt.length; i++) {
    if (newBelt[i]?.id === 'twin_mirror' && i < newBelt.length - 1 && newBelt[i+1]) {
      triggerCounts[i+1] += 1;
    }
  }

  for (let i = 0; i < newBelt.length; i++) {
    const item = newBelt[i];
    if (!item) continue;

    if (item.effectType === 'base' || item.effectType === 'growth' || item.effectType === 'luck') {
      const deceptionMult = getDeceptionMult(item);
      for (let t = 0; t < triggerCounts[i]; t++) {
        let added = 0n;
        if (item.id === 'acorn_squirrel') {
          // Now a multiplier
        }
        else if (item.id === 'snowball_rice') {
          // Now a multiplier
        }
        else if (item.id === 'membership_stamp_card') {
          if (Math.random() < 0.1) addedCoupons += 1;
        }
        else if (item.id === 'hungry_pig') {
          // Handled in global
        }
        else if (item.id === 'golden_egg') {
          // Handled in global
        }

        if (added !== 0n) {
          const finalAdded = added * BigInt(deceptionMult);
          step1Base += finalAdded;
          receipt.push({ name: item.name + (deceptionMult === 2 ? ' (기만)' : ''), type: 'base', value: finalAdded > 0n ? `+${finalAdded}` : `${finalAdded}`, amount: step1Base });
        }
      }
    }
  }

  // --- Step 1.5: Symbol Effects (e.g. Safe Cracker Cat) ---
  for (let i = 0; i < newBelt.length; i++) {
    const item = newBelt[i];
    if (item?.id === 'safe_cracker_cat') {
      const moneySymbols = grid.filter(c => c === '💰').length;
      if (moneySymbols > 0) {
        addedAtm += BigInt(moneySymbols * 1000);
      }
    }
  }

  // --- Step 2: Local Multipliers ---
  for (let i = 0; i < newBelt.length; i++) {
    const item = newBelt[i];
    if (!item) continue;

    if (item.effectType === 'multiplier' || item.effectType === 'luck' || item.effectType === 'growth') {
      const deceptionMult = getDeceptionMult(item);
      for (let t = 0; t < triggerCounts[i]; t++) {
        let floatMult = 1.0;
        
        if (item.id === 'coin_1') floatMult *= 1.2;
        else if (item.id === 'cash_dog') floatMult *= 1.5;
        else if (item.id === 'gold_cat') floatMult *= 2.0;
        else if (item.id === 'hamster_worker') floatMult *= (turn === 3 ? 5.0 : 1.5);
        else if (item.id === 'lucky_clover') floatMult *= (1.5 + Math.random() * 1.5);
        else if (item.id === 'magnet_paw') floatMult *= 1.0; // Handled elsewhere
        else if (item.id === 'space_donut') {
          floatMult *= 1.2;
          if ((i === 0 || !newBelt[i-1]) && (i === newBelt.length - 1 || !newBelt[i+1])) floatMult *= 2.0;
        }
        else if (item.id === 'golden_feather' && comboCount > 0) floatMult *= 2.5;
        else if (item.id === 'gold_magnifier' && i > 0 && newBelt[i-1]) floatMult *= 3.0;
        else if (item.id === 'twin_mirror') floatMult *= 1.0; // Handled via triggerCounts
        else if (item.id === 'magic_popcorn') {
          if (i > 0 && newBelt[i-1]) floatMult *= 5.0;
          if (i < newBelt.length - 1 && newBelt[i+1]) floatMult *= 5.0;
        }
        else if (item.id === 'alien_jelly') {
          const alienCount = newBelt.filter(it => it?.id === 'alien_jelly').length;
          floatMult *= 1.5 * Math.pow(2, alienCount - 1);
        }
        else if (item.id === 'meteor_candy') {
          const actualStars = grid.filter(c => c === '🌟').length;
          if (actualStars > 0) floatMult *= Math.pow(3, actualStars);
        }
        // Luck items with multiplier
        else if (item.id === 'lucky_coin') floatMult *= 1.3;
        else if (item.id === 'clover_tea') floatMult *= 1.5;
        else if (item.id === 'star_fragment') floatMult *= 1.3;
        else if (item.id === 'golden_pig_statue') floatMult *= 2.0;
        else if (item.id === 'piggy_bank_pro') {
          const atmBonus = Number(atm / 10000n) * 0.2;
          floatMult *= (1.0 + Math.min(atmBonus, 9.0)); // Max x10.0
        }
        else if (item.id === 'coupon_collector_album') {
          floatMult *= (1.0 + (coupons * 0.2));
        }
        else if (item.id === 'luck_overflow_valve') {
          if (luck > 100) {
            floatMult *= (1.0 + (Math.floor((luck - 100) / 10) * 0.5));
          }
        }
        // Growth items with multiplier
        else if (item.id === 'acorn_squirrel') {
          floatMult *= (item.currentMultiplier || 1.1);
          item.currentMultiplier = (item.currentMultiplier || 1.1) + 0.1;
        }
        else if (item.id === 'snowball_rice') {
          floatMult *= (item.currentMultiplier || 1.1);
          item.currentMultiplier = (item.currentMultiplier || 1.1) + 0.1;
        }
        else if (item.id === 'sponge_slime') {
          const cherryLemonCount = grid.filter(c => c === '🍒' || c === '🍋').length;
          if (cherryLemonCount > 0) {
            item.currentMultiplier = (item.currentMultiplier || 1.0) + (0.1 * cherryLemonCount);
          }
        }

        // Multiplier Prism
        if ((i > 0 && newBelt[i-1]?.id === 'multiplier_prism') || 
            (i < newBelt.length - 1 && newBelt[i+1]?.id === 'multiplier_prism')) {
          floatMult *= 2.0;
        }

        if (floatMult > 1.0) {
          const finalFloatMult = 1.0 + (floatMult - 1.0) * deceptionMult;
          if (finalFloatMult !== 1.0) {
            step1Base = (step1Base * BigInt(Math.floor(finalFloatMult * 100))) / 100n;
            receipt.push({ name: item.name + (deceptionMult === 2 ? ' (기만)' : ''), type: 'multiplier', value: `x${finalFloatMult.toFixed(2)}`, amount: step1Base });
          }
        }
      }
    }
    
    if (item.effectType === 'luck') {
      for (let t = 0; t < triggerCounts[i]; t++) {
        if (item.id === 'lucky_dice') {
          addedLuck += Math.floor(Math.random() * 50) + 1;
        }
        else if (item.id === 'rabbit_foot') {
          addedLuck += 15;
        }
        else if (item.id === 'lucky_coin') {
          addedLuck += 2;
        }
        else if (item.id === 'clover_tea') {
          addedLuck += 5;
        }
        else if (item.id === 'lucky_charm') {
          addedLuck += 3;
        }
        else if (item.id === 'four_leaf_clover') {
          addedLuck += 10;
        }
        else if (item.id === 'coupon_magnifier') {
          addedLuck += coupons;
        }
      }
    }
  }

  // --- Step 3: Global Multipliers ---
  let step3Global = step1Base;
  
  // Pattern Multiplier
  let currentGlobalPatternBonus = globalPatternBonus + patternMultiplierBonus;
  if (newBelt.some(it => it?.id === 'ultra_clover_pit')) {
    currentGlobalPatternBonus += 2.0;
  }
  
  const totalPatternMult = comboCount > 0 ? (patternMultiplier + currentGlobalPatternBonus) : 1.0;
  if (totalPatternMult > 1.0) {
    step3Global = BigInt(Math.floor(Number(step3Global) * totalPatternMult));
    receipt.push({ name: '패턴 콤보', type: 'global', value: `x${totalPatternMult.toFixed(1)}`, amount: step3Global });
  }

  for (let i = 0; i < newBelt.length; i++) {
    const item = newBelt[i];
    if (!item || (item.effectType !== 'global' && item.effectType !== 'growth' && item.effectType !== 'active')) continue;

    for (let t = 0; t < triggerCounts[i]; t++) {
      let mult = 1n;
      let floatMult = 1.0;
      const deceptionMult = getDeceptionMult(item);

      if (item.id === 'blackhole_safe') {
        mult = 5n;
        newBelt[i] = null;
        if (i + 1 < newBelt.length && newBelt[i+1]?.id === 'dummy_slot') newBelt[i+1] = null;
      }
      else if (item.id === 'legendary_distortion_mirror') {
        mult = 10n;
      }
      else if (item.id === 'coffee_boost') {
        mult = 4n;
        newBelt[i] = null;
      }
      else if (item.id === 'ultra_angel_wing') {
        mult = 20n;
      }
      else if (item.id === 'space_cat') {
        floatMult = item.currentMultiplier || 1.0;
      }
      else if (item.id === 'sponge_slime') {
        floatMult = item.currentMultiplier || 1.0;
      }
      else if (item.id === 'hungry_pig') {
        floatMult = 0.5;
      }
      else if (item.id === 'golden_egg') {
        floatMult = 1.5;
      }
      else if (item.id === 'hot_potato') {
        floatMult = 3.0;
      }
      else if (item.id === 'combo_king_crown') {
        if (comboCount >= 3) mult = 10n;
      }
      else if (item.id === 'plasma_gun' && item.activeGauge && item.maxGauge && item.activeGauge >= item.maxGauge) {
        mult = 10n;
        // Gauge reset is handled outside or we can do it here
        item.activeGauge = 0;
      }

      if (mult > 1n) {
        const finalMult = BigInt(deceptionMult === 0 ? 0 : (deceptionMult === 2 ? Number(mult) * 2 : Number(mult)));
        if (finalMult > 1n || finalMult === 0n) {
          step3Global *= finalMult;
          receipt.push({ name: item.name + (deceptionMult === 2 ? ' (기만)' : ''), type: 'global', value: `x${finalMult}`, amount: step3Global });
        }
      }
      if (floatMult !== 1.0) {
        const finalFloatMult = 1.0 + (floatMult - 1.0) * deceptionMult;
        if (finalFloatMult !== 1.0) {
          const oldStep3 = step3Global;
          step3Global = (step3Global * BigInt(Math.floor(finalFloatMult * 100))) / 100n;
          
          if (item.id === 'hungry_pig') {
            newPiggyBank += (oldStep3 - step3Global);
          }
          
          receipt.push({ name: item.name + (deceptionMult === 2 ? ' (기만)' : ''), type: 'global', value: `x${finalFloatMult.toFixed(2)}`, amount: step3Global });
        }
      }
    }
  }

  // --- Step 4: Interest ---
  let interestEarned = 0n;
  
  let interestRate = 7n;
  for (const item of newBelt) {
    if (item?.id === 'compound_interest_calculator') {
      item.currentMultiplier = (item.currentMultiplier || 0) + 1;
    }
  }
  
  const bonusRate = newBelt.reduce((acc, it) => it?.id === 'compound_interest_calculator' ? acc + BigInt(it.currentMultiplier || 0) : acc, 0n);
  interestRate += bonusRate;

  const baseInterest = atm * interestRate / 100n;
  if (baseInterest > 0n) {
    interestEarned += baseInterest;
    receipt.push({ name: `기본 이자 (${interestRate}%)`, type: 'interest', value: `+${baseInterest}`, amount: step3Global + interestEarned });
  }

  for (let i = 0; i < newBelt.length; i++) {
    const item = newBelt[i];
    if (!item || item.effectType !== 'interest') continue;
    for (let t = 0; t < triggerCounts[i]; t++) {
      let interest = 0n;
      if (item.id === 'gold_onion') interest = atm * 5n / 100n;
      else if (item.id === 'legendary_bank_key') interest = atm * 50n / 100n;
      
      if (interest > 0n) {
        interestEarned += interest;
        receipt.push({ name: item.name, type: 'interest', value: `+${interest}`, amount: step3Global + interestEarned });
      }
    }
  }

  const finalScore = step3Global + interestEarned;

  return {
    finalScore,
    receipt,
    newBelt,
    newPiggyBank,
    addedLuck,
    addedCoupons,
    addedAtm,
    interestEarned,
    comboCount,
    patternMultiplier,
    isBankrupt,
    shieldChargesUsed,
    bibleUsed,
    newSnowball
  };
};
