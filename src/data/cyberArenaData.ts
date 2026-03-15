import { ArenaSkill, ArenaItem, ArenaCharacter } from '../types';

export const ARENA_SKILLS: ArenaSkill[] = [
  {
    id: 'basic_attack',
    name: '기본 공격',
    description: '전방으로 투사체를 발사합니다.',
    energyCost: 0,
    damage: 10,
    cooldown: 500,
    speed: 8,
    range: 600,
    radius: 8,
    type: 'PROJECTILE'
  },
  {
    id: 'power_slash',
    name: '파워 샷',
    description: '강력하고 빠른 투사체를 발사합니다.',
    energyCost: 20,
    damage: 30,
    cooldown: 2000,
    speed: 12,
    range: 800,
    radius: 12,
    type: 'PROJECTILE'
  },
  {
    id: 'energy_shield',
    name: '에너지 실드',
    description: '즉시 보호막을 생성합니다.',
    energyCost: 30,
    shield: 40,
    cooldown: 10000,
    type: 'INSTANT'
  },
  {
    id: 'nano_repair',
    name: '나노 수리',
    description: '체력을 서서히 회복합니다.',
    energyCost: 40,
    heal: 50,
    cooldown: 15000,
    type: 'INSTANT'
  },
  {
    id: 'dash',
    name: '대시',
    description: '바라보는 방향으로 빠르게 돌진합니다.',
    energyCost: 15,
    cooldown: 3000,
    range: 150,
    type: 'DASH'
  }
];

export const ARENA_CHARACTERS: ArenaCharacter[] = [
  {
    id: 'warrior',
    name: '워리어',
    description: '균형 잡힌 능력치의 전사입니다.',
    baseHp: 150,
    baseEnergy: 100,
    skills: ['basic_attack', 'power_slash', 'dash'],
    passiveEffect: 'SPEED_BOOST'
  },
  {
    id: 'mage',
    name: '메이지',
    description: '강력한 화력을 가진 저격수입니다.',
    baseHp: 100,
    baseEnergy: 150,
    skills: ['basic_attack', 'power_slash', 'energy_shield'],
    passiveEffect: 'ENERGY_REGEN'
  }
];

export const ARENA_ITEMS: ArenaItem[] = [
  {
    id: 'hp_potion',
    name: '체력 포션',
    description: '체력을 50 회복합니다.',
    cost: 100,
    effect: (stats) => ({ ...stats, hp: Math.min(stats.maxHp, stats.hp + 50) })
  },
  {
    id: 'energy_drink',
    name: '에너지 드링크',
    description: '에너지를 50 회복합니다.',
    cost: 80,
    effect: (stats) => ({ ...stats, energy: Math.min(stats.maxEnergy, stats.energy + 50) })
  },
  {
    id: 'shield_generator',
    name: '보호막 생성기',
    description: '즉시 40의 보호막을 생성합니다.',
    cost: 120,
    effect: (stats) => ({ ...stats, shield: stats.shield + 40 })
  },
  {
    id: 'adrenaline_shot',
    name: '아드레날린 주사',
    description: '체력을 20 깎고 에너지를 80 회복합니다.',
    cost: 150,
    effect: (stats) => ({ 
      ...stats, 
      hp: Math.max(1, stats.hp - 20),
      energy: Math.min(stats.maxEnergy, stats.energy + 80)
    })
  },
  {
    id: 'nano_core',
    name: '나노 코어',
    description: '최대 체력과 최대 에너지를 각각 20씩 영구적으로 증가시킵니다.',
    cost: 300,
    effect: (stats) => ({ 
      ...stats, 
      maxHp: stats.maxHp + 20,
      maxEnergy: stats.maxEnergy + 20,
      hp: stats.hp + 20,
      energy: stats.energy + 20
    })
  }
];
