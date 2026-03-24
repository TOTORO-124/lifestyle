export interface CosmicItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  tier: number;
  type: 'passive' | 'active' | 'position' | 'growth';
  size: 1 | 2 | 3;
  effect?: any;
  gauge?: number;
  maxGauge?: number;
  currentMultiplier?: number;
  trait?: string;
  effectType?: 'base' | 'multiplier' | 'global' | 'interest' | 'growth' | 'luck' | 'active';
  activeGauge?: number;
  rarity?: string;
  symbolId?: string;
  boostAmount?: number;
  nerfAmount?: number;
}

export const COSMIC_ITEMS: CosmicItem[] = [
  // Tier 1 (Common)
  {
    id: 'cherry_eraser',
    name: '해골 지우개',
    description: '해골 심볼이 등장할 확률을 50% 감소시킵니다.',
    icon: '🧹',
    cost: 1,
    tier: 1,
    type: 'passive',
    size: 1
  },
  {
    id: 'milk_drop',
    name: '우유 방울',
    description: '매 라운드 첫 스핀은 비용이 무료입니다.',
    icon: '🥛',
    cost: 1,
    tier: 1,
    type: 'passive',
    size: 1
  },
  {
    id: 'lucky_clover',
    name: '행운의 클로버',
    description: '클로버 심볼의 가치를 +2 증가시킵니다.',
    icon: '🍀',
    cost: 1,
    tier: 1,
    type: 'passive',
    size: 1
  },
  {
    id: 'battery_pack',
    name: '보조 배터리',
    description: '액티브 아이템의 충전 속도가 1.2배 빨라집니다.',
    icon: '🔋',
    cost: 2,
    tier: 1,
    type: 'passive',
    size: 1
  },

  // Tier 2 (Uncommon)
  {
    id: 'magnet_paw',
    name: '패턴 자석',
    description: '가로 패턴이 완성될 확률이 소폭 증가합니다.',
    icon: '🧲',
    cost: 2,
    tier: 2,
    type: 'passive',
    size: 1
  },
  {
    id: 'golden_bell',
    name: '황금 종',
    description: '종 심볼이 포함된 패턴의 배수를 x2배로 만듭니다.',
    icon: '🔔',
    cost: 2,
    tier: 2,
    type: 'passive',
    size: 1
  },
  {
    id: 'piggy_bank',
    name: '저금통',
    description: '스핀마다 수익의 5%를 추가로 적립하여 라운드 종료 시 받습니다.',
    icon: '🐷',
    cost: 2,
    tier: 2,
    type: 'growth',
    size: 1
  },

  // Tier 3 (Rare)
  {
    id: 'diamond_polisher',
    name: '다이아 광택기',
    description: '다이아몬드 심볼의 기본 가치를 x3배로 만듭니다.',
    icon: '✨',
    cost: 3,
    tier: 3,
    type: 'passive',
    size: 1
  },
  {
    id: 'active_laser',
    name: '제거 레이저',
    description: '충전 시 클릭하여 화면의 모든 해골을 제거합니다.',
    icon: '🔫',
    cost: 3,
    tier: 3,
    type: 'active',
    size: 1,
    gauge: 0,
    maxGauge: 10
  },
  {
    id: 'snowball',
    name: '스노우볼',
    description: '연속으로 수익이 발생할 때마다 배수가 x0.5씩 영구 증가합니다.',
    icon: '❄️',
    cost: 3,
    tier: 3,
    type: 'growth',
    size: 1,
    currentMultiplier: 1
  },

  // Tier 4 (Epic)
  {
    id: 'seven_heaven',
    name: '세븐 헤븐',
    description: '숫자 7 심볼이 잭팟을 터뜨릴 시 배수를 x50배로 만듭니다.',
    icon: '🌈',
    cost: 4,
    tier: 4,
    type: 'passive',
    size: 2
  },
  {
    id: 'compound_interest',
    name: '복리 계산기',
    description: '금고(ATM)에 있는 돈에 대해 매 스핀마다 1%의 이자를 지급합니다.',
    icon: '🧮',
    cost: 4,
    tier: 4,
    type: 'passive',
    size: 1
  },

  // Tier 5 (Legendary)
  {
    id: 'cosmic_engine',
    name: '우주 엔진',
    description: '모든 곱연산 결과에 최종적으로 x2배를 추가 적용합니다.',
    icon: '🚀',
    cost: 5,
    tier: 5,
    type: 'passive',
    size: 3
  },
  {
    id: 'golden_ticket',
    name: '황금 티켓',
    description: 'ATM 잔액 10,000원당 전역 배수가 x0.1배 증가합니다.',
    icon: '🎫',
    cost: 4,
    tier: 4,
    type: 'passive',
    size: 1
  },
  {
    id: 'magnifying_glass',
    name: '돋보기',
    description: '모든 패턴 콤보 배수가 x0.5배 추가 증가합니다.',
    icon: '🔍',
    cost: 3,
    tier: 3,
    type: 'passive',
    size: 1
  },
  {
    id: 'cherry_eraser',
    name: '체리 지우개',
    icon: '🧹',
    description: '해골이 등장할 확률이 절반으로 감소합니다.',
    cost: 4,
    tier: 2,
    type: 'passive',
    size: 1,
    rarity: 'Rare',
    trait: 'symbol_nerf',
    symbolId: 'skull',
    nerfAmount: 0.5
  },
  {
    id: 'clover_magnet',
    name: '클로버 자석',
    icon: '🧲',
    description: '클로버가 등장할 확률이 2배 증가합니다.',
    cost: 5,
    tier: 2,
    type: 'passive',
    size: 1,
    rarity: 'Rare',
    trait: 'symbol_boost',
    symbolId: 'clover',
    boostAmount: 2.0
  },
  {
    id: 'star_telescope',
    name: '별 망원경',
    icon: '🔭',
    description: '별이 등장할 확률이 1.5배 증가합니다.',
    cost: 3,
    tier: 1,
    type: 'passive',
    size: 1,
    rarity: 'Uncommon',
    trait: 'symbol_boost',
    symbolId: 'star',
    boostAmount: 1.5
  },
  {
    id: 'diamond_drill',
    name: '다이아몬드 드릴',
    icon: '💎',
    description: '다이아몬드가 등장할 확률이 1.3배 증가합니다.',
    cost: 6,
    tier: 3,
    type: 'passive',
    size: 1,
    rarity: 'Epic',
    trait: 'symbol_boost',
    symbolId: 'diamond',
    boostAmount: 1.3
  },
];
