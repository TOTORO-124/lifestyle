import { ArenaSkill, ArenaItem, ArenaCharacter } from '../types';

export const ARENA_SKILLS: ArenaSkill[] = [
  {
    id: 'basic_attack',
    name: '기본 공격',
    description: '가장 가까운 적에게 투사체를 발사합니다.',
    energyCost: 0,
    damage: 10,
    cooldown: 1000,
    speed: 10,
    range: 500,
    radius: 10,
    type: 'PROJECTILE'
  },
  {
    id: 'milk_splash',
    name: '우유 세례',
    description: '적에게 우유를 뿌려 피해를 입히고 공격 속도를 감소시킵니다.',
    energyCost: 100,
    damage: 40,
    cooldown: 0,
    radius: 100,
    type: 'INSTANT',
    effect: 'SLOW'
  },
  {
    id: 'soda_pop',
    name: '탄산 폭발',
    description: '주변 적에게 강력한 폭발 피해를 입힙니다.',
    energyCost: 100,
    damage: 60,
    cooldown: 0,
    radius: 150,
    type: 'INSTANT'
  },
  {
    id: 'caffeine_rush',
    name: '카페인 돌진',
    description: '적에게 빠르게 돌진하여 피해를 입힙니다.',
    energyCost: 100,
    damage: 50,
    cooldown: 0,
    range: 300,
    type: 'DASH'
  },
  {
    id: 'vitamin_beam',
    name: '비타민 빔',
    description: '직선상의 적들에게 피해를 입히고 무작위 디버프를 부여합니다.',
    energyCost: 100,
    damage: 45,
    cooldown: 0,
    range: 600,
    speed: 15,
    radius: 20,
    type: 'PROJECTILE'
  },
  {
    id: 'hydration_wave',
    name: '수분 파동',
    description: '자신을 치유하고 주변 적을 밀쳐냅니다.',
    energyCost: 100,
    heal: 30,
    damage: 20,
    cooldown: 0,
    radius: 120,
    type: 'INSTANT'
  }
];

export const ARENA_CHARACTERS: ArenaCharacter[] = [
  {
    id: 'milk_jin',
    name: '밀크진 (우유 팩)',
    description: '우유부단하지만 튼튼한 탱커입니다. 받는 피해를 나누어 받습니다.',
    baseHp: 200,
    baseEnergy: 100,
    baseDamage: 10,
    baseAttackSpeed: 1.0,
    skills: ['basic_attack', 'milk_splash'],
    passive: { name: '지연된 결정', description: '받는 피해를 5초에 걸쳐 나누어 받습니다.' }
  },
  {
    id: 'soda_chan',
    name: '소다찬 (탄산 캔)',
    description: '다혈질 광전사입니다. 체력이 낮을수록 공격이 매서워집니다.',
    baseHp: 150,
    baseEnergy: 100,
    baseDamage: 15,
    baseAttackSpeed: 1.2,
    skills: ['basic_attack', 'soda_pop'],
    passive: { name: '탄산 폭발', description: '체력이 낮을수록 공격 속도가 최대 50%까지 증가합니다.' }
  },
  {
    id: 'sports_drink',
    name: '스포츠 드링크',
    description: '끈질긴 지구력을 가졌습니다. 스킬 사용 시 체력을 회복합니다.',
    baseHp: 180,
    baseEnergy: 100,
    baseDamage: 12,
    baseAttackSpeed: 1.1,
    skills: ['basic_attack', 'hydration_wave'],
    passive: { name: '수분 보충', description: '스킬 사용 시 최대 체력의 2%를 회복합니다.' }
  },
  {
    id: 'coffee_bean',
    name: '커피 (각성자)',
    description: '카페인 과다 상태의 마법사입니다. 쿨타임이 짧지만 체력이 서서히 깎입니다.',
    baseHp: 120,
    baseEnergy: 150,
    baseDamage: 20,
    baseAttackSpeed: 1.5,
    skills: ['basic_attack', 'caffeine_rush'],
    passive: { name: '카페인 과부하', description: '쿨타임이 20% 감소하지만, 매초 체력이 2씩 감소합니다.' }
  },
  {
    id: 'vitamin_boost',
    name: '비타민 드링크',
    description: '변덕스러운 버퍼입니다. 라운드 시작 시 무작위 강력한 버프를 얻습니다.',
    baseHp: 140,
    baseEnergy: 120,
    baseDamage: 14,
    baseAttackSpeed: 1.3,
    skills: ['basic_attack', 'vitamin_beam'],
    passive: { name: '플라시보 효과', description: '라운드 시작 시 무작위 능력치가 20% 증가합니다.' }
  }
];

export const ARENA_ITEMS: ArenaItem[] = [
  // Ice Tags
  {
    id: 'ice_cube',
    name: '얼음 조각',
    description: '[얼음] 적의 공격 속도를 늦춥니다.',
    cost: 100,
    tags: ['ICE'],
    stars: 1,
    rarity: 1,
    stats: { damage: 5 }
  },
  {
    id: 'frozen_berry',
    name: '냉동 베리',
    description: '[얼음] 체력과 공격력을 약간 올립니다.',
    cost: 150,
    tags: ['ICE'],
    stars: 1,
    rarity: 1,
    stats: { hp: 20, damage: 8 }
  },
  // Sugar Tags
  {
    id: 'sugar_cube',
    name: '설탕 덩어리',
    description: '[당분] 스킬 피해량을 높입니다.',
    cost: 100,
    tags: ['SUGAR'],
    stars: 1,
    rarity: 1,
    stats: { maxEnergy: 20 }
  },
  {
    id: 'honey_drop',
    name: '꿀 한 방울',
    description: '[당분] 공격 속도를 높입니다.',
    cost: 150,
    tags: ['SUGAR'],
    stars: 1,
    rarity: 1,
    stats: { attackSpeed: 0.1 }
  },
  // Straw Tags
  {
    id: 'paper_straw',
    name: '종이 빨대',
    description: '[빨대] 흡혈 능력을 부여합니다.',
    cost: 120,
    tags: ['STRAW'],
    stars: 1,
    rarity: 1,
    stats: { lifesteal: 0.05 }
  },
  {
    id: 'bamboo_straw',
    name: '대나무 빨대',
    description: '[빨대] 체력과 흡혈을 높입니다.',
    cost: 180,
    tags: ['STRAW'],
    stars: 1,
    rarity: 1,
    stats: { hp: 30, lifesteal: 0.08 }
  },
  // General Items
  {
    id: 'rusty_can',
    name: '녹슨 캔',
    description: '기본적인 방어력을 제공합니다.',
    cost: 80,
    tags: [],
    stars: 1,
    rarity: 1,
    stats: { shield: 10 }
  },
  {
    id: 'caffeine_pill',
    name: '카페인 알약',
    description: '공격 속도를 크게 높입니다.',
    cost: 200,
    tags: [],
    stars: 1,
    rarity: 2,
    stats: { attackSpeed: 0.2 }
  }
];

export const SYNERGIES = {
  ICE: [
    { count: 2, description: '적 공격 속도 15% 감소', effect: { type: 'ENEMY_AS_REDUCTION', value: 0.15 } },
    { count: 4, description: '공격 시 10% 확률로 적 1.5초 빙결', effect: { type: 'FREEZE_ON_HIT', value: 0.1 } }
  ],
  SUGAR: [
    { count: 2, description: '스킬 피해량 20% 증가', effect: { type: 'SKILL_DMG_BOOST', value: 0.2 } },
    { count: 4, description: '스킬 사용 시 최대 체력 10% 보호막 생성', effect: { type: 'SHIELD_ON_SKILL', value: 0.1 } }
  ],
  STRAW: [
    { count: 2, description: '흡혈 10% 추가', effect: { type: 'LIFESTEAL_BOOST', value: 0.1 } },
    { count: 4, description: '피해 입힐 시 적 에너지 5 감소', effect: { type: 'ENERGY_DRAIN', value: 5 } }
  ]
};
