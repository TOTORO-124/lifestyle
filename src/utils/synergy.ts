import { CosmicItem } from '../data/cosmicJackpotItems';

export interface ReceiptStep {
  name: string;
  type: 'base' | 'multiplier' | 'global' | 'interest';
  value: string;
  amount: bigint;
}

export interface SynergyState {
  grid: string[];
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
  shieldGeneratorCharges: number;
  snowballStacks: { [index: number]: bigint };
}

export interface SynergyResult {
  finalScore: bigint;
  receipt: ReceiptStep[];
  newBelt: (CosmicItem | null)[];
  newPiggyBank: bigint;
  addedLuck: number;
  interestEarned: bigint;
  comboCount: number;
  patternMultiplier: number;
  isBankrupt: boolean;
  shieldChargesUsed: number;
  bibleUsed: boolean;
  newSnowball: { [index: number]: bigint };
}

export const calculateSynergy = (state: SynergyState): SynergyResult => {
  const { grid, belt, atm, luck, globalPatternBonus, piggyBankSaved, hotPotatoBuff, turn, maxTurn, shieldGeneratorCharges, snowballStacks } = state;
  const newBelt = [...belt];
  const newSnowball = { ...snowballStacks };
  const receipt: ReceiptStep[] = [];
  
  let isBankrupt = false;
  let shieldChargesUsed = 0;
  let bibleUsed = false;

  // --- Pattern Detection ---
  const checkCombo = (indices: number[]) => {
    const chars = indices.map(idx => grid[idx]);
    const first = chars.find(c => c !== 'WILD');
    if (!first) return true;
    return chars.every(c => c === first || c === 'WILD');
  };

  let patternMultiplier = 1.0;
  let comboCount = 0;
  
  const firstNonWild = grid.find(c => c !== 'WILD') || 'WILD';
  if (grid.every(c => c === firstNonWild || c === 'WILD')) {
    patternMultiplier = 10.0;
    comboCount = 8;
  } else {
    // Rows
    [ [0,1,2,3,4], [5,6,7,8,9], [10,11,12,13,14] ].forEach(row => {
      if (checkCombo(row)) {
        patternMultiplier *= 2.0; // Changed from += 1.0 to *= 2.0
        comboCount++;
      }
    });
    // Cols
    [ [0,5,10], [1,6,11], [2,7,12], [3,8,13], [4,9,14] ].forEach(col => {
      if (checkCombo(col)) {
        patternMultiplier *= 2.0; // Changed from += 1.0 to *= 2.0
        comboCount++;
      }
    });
  }

  // Trap Check
  const trapCount = grid.filter(r => r === '💀').length;
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
        interestEarned: 0n,
        comboCount,
        patternMultiplier,
        isBankrupt,
        shieldChargesUsed,
        bibleUsed
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
    { char: '7️⃣', value: 10n },
    { char: '🌟', value: 20n },
    { char: '🔋', value: 0n },
  ];

  let symbolBase = 0n;
  grid.forEach(char => {
    if (char === 'WILD') {
      symbolBase += 5n;
    } else {
      const sym = SYMBOLS.find(s => s.char === char);
      if (sym) symbolBase += sym.value;
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
      for (let t = 0; t < triggerCounts[i]; t++) {
        let added = 0n;
        if (item.id === 'lucky_coin') added = 5n;
        else if (item.id === 'clover_tea') added = 10n;
        else if (item.id === 'star_fragment') added = 5n;
        else if (item.id === 'golden_pig_statue') added = 15n;
        else if (item.id === 'golden_feather' && comboCount > 0) added = BigInt(comboCount * 100);
        else if (item.id === 'acorn_squirrel') added = BigInt(item.currentBase || 0);
        else if (item.id === 'snowball_rice') {
          const currentMult = newSnowball[i] || 1n;
          added = 10n * currentMult;
          newSnowball[i] = currentMult * 2n;
        }
        else if (item.id === 'space_donut') {
          added = 20n;
          if ((i === 0 || !newBelt[i-1]) && (i === newBelt.length - 1 || !newBelt[i+1])) {
            added += 80n;
          }
        }
        else if (item.id === 'hamster_worker') {
          if (turn === 3) added = 100n;
          else added = 10n;
        }
        else if (item.id === 'lucky_clover') {
          added = BigInt(Math.floor(Math.random() * 91) + 10);
        }
        else if (item.id === 'hungry_pig') {
          added = -10n;
          newPiggyBank += 10n;
        }
        else if (item.id === 'golden_egg') {
          added = 10n;
        }
        else if (item.id === 'meteor_candy') {
          const sevens = grid.filter(c => c === '🌟').length;
          added = BigInt(sevens * 500);
        }
        else if (item.id === 'legendary_vvip_card') added = 200n;

        if (hotPotatoBuff > 0) added += 20n;

        if (added !== 0n) {
          step1Base += added;
          receipt.push({ name: item.name, type: 'base', value: added > 0n ? `+${added}` : `${added}`, amount: step1Base });
        }
      }
    }
  }

  // --- Step 2: Local Multipliers ---
  for (let i = 0; i < newBelt.length; i++) {
    const item = newBelt[i];
    if (!item) continue;

    if (item.effectType === 'multiplier') {
      for (let t = 0; t < triggerCounts[i]; t++) {
        let mult = 1n;
        if (item.id === 'gold_magnifier' && i > 0 && newBelt[i-1]) {
          mult = 2n;
        }
        else if (item.id === 'magic_popcorn') {
          if (i > 0 && newBelt[i-1]) mult *= 3n;
          if (i < newBelt.length - 1 && newBelt[i+1]) mult *= 3n;
        }
        else if (item.id === 'alien_jelly') {
          const alienCount = newBelt.filter(it => it?.id === 'alien_jelly').length;
          mult = BigInt(Math.pow(2, alienCount - 1));
        }

        // Multiplier Prism
        if (item.effectType === 'multiplier') {
          if ((i > 0 && newBelt[i-1]?.id === 'multiplier_prism') || 
              (i < newBelt.length - 1 && newBelt[i+1]?.id === 'multiplier_prism')) {
            mult *= 2n;
          }
        }

        if (mult > 1n) {
          step1Base *= mult;
          receipt.push({ name: item.name, type: 'multiplier', value: `x${mult}`, amount: step1Base });
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
      }
    }
  }

  // --- Step 3: Global Multipliers ---
  let step3Global = step1Base;
  
  // Pattern Multiplier
  let currentGlobalPatternBonus = globalPatternBonus;
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

      if (item.id === 'blackhole_safe') {
        mult = 3n;
        newBelt[i] = null;
        if (i + 1 < newBelt.length && newBelt[i+1]?.id === 'dummy_slot') newBelt[i+1] = null;
      }
      else if (item.id === 'legendary_distortion_mirror') {
        mult = 5n;
      }
      else if (item.id === 'coffee_boost') {
        mult = 2n;
        newBelt[i] = null;
      }
      else if (item.id === 'ultra_angel_wing') {
        mult = 10n;
      }
      else if (item.id === 'space_cat') {
        floatMult = item.currentMultiplier || 1.0;
      }
      else if (item.id === 'sponge_slime') {
        floatMult = item.currentMultiplier || 1.0;
      }
      else if (item.id === 'plasma_gun' && item.activeGauge && item.maxGauge && item.activeGauge >= item.maxGauge) {
        mult = 10n;
        // Gauge reset is handled outside or we can do it here
        item.activeGauge = 0;
      }

      if (mult > 1n) {
        step3Global *= mult;
        receipt.push({ name: item.name, type: 'global', value: `x${mult}`, amount: step3Global });
      }
      if (floatMult > 1.0) {
        step3Global = BigInt(Math.floor(Number(step3Global) * floatMult));
        receipt.push({ name: item.name, type: 'global', value: `x${floatMult.toFixed(1)}`, amount: step3Global });
      }
    }
  }

  // --- Step 4: Interest ---
  let interestEarned = 0n;
  const baseInterest = atm * 7n / 100n;
  if (baseInterest > 0n) {
    interestEarned += baseInterest;
    receipt.push({ name: '기본 이자 (7%)', type: 'interest', value: `+${baseInterest}`, amount: step3Global + interestEarned });
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
    interestEarned,
    comboCount,
    patternMultiplier,
    isBankrupt,
    shieldChargesUsed,
    bibleUsed,
    newSnowball
  };
};
