export type ItemTier = 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1: Common, 2: Uncommon, 3: Mildly Rare, 4: Rare, 5: Very Rare, 6: Legendary, 7: Ultra Legendary
export type ItemType = 'passive' | 'consumable' | 'luck' | 'wildcard' | 'defense' | 'active' | 'growth' | 'booster';
export type EffectType = 'base' | 'multiplier' | 'global' | 'interest' | 'luck' | 'wildcard' | 'defense' | 'active' | 'growth' | 'booster';

export interface CosmicItem {
  id: string;
  name: string;
  description: string;
  size: number; // 1 or 2
  cost: number; // Coupons
  tier: ItemTier;
  type: ItemType;
  effectType: EffectType;
  icon: string;
  weight?: number; // For shop generation
  currentBase?: bigint; // For growth items
  currentMultiplier?: number; // For growth items
  activeGauge?: number; // For active items
  maxGauge?: number; // For active items
}

export const COSMIC_ITEMS: CosmicItem[] = [
  // Tier 1: COMMON (100% weight)
  { id: 'coin_1', name: '짤랑이 꼬마 동전', description: '매 턴 수익 x1.2배', size: 1, cost: 1, tier: 1, type: 'passive', effectType: 'multiplier', icon: '🪙' },
  { id: 'cash_dog', name: '지폐 뭉치 댕댕이', description: '매 턴 수익 x1.5배', size: 1, cost: 1, tier: 1, type: 'passive', effectType: 'multiplier', icon: '🐶' },
  { id: 'gold_cat', name: '반짝반짝 금괴 냥이', description: '매 턴 수익 x2.0배', size: 1, cost: 1, tier: 1, type: 'passive', effectType: 'multiplier', icon: '🐱' },
  { id: 'scrub_towel', name: '뽀득뽀득 때밀이 수건', description: '슬롯 정지 시 함정(💀)을 50% 확률로 체리로 변환', size: 1, cost: 1, tier: 1, type: 'passive', effectType: 'defense', icon: '🧼' },
  { id: 'clover_seed', name: '네잎클로버 씨앗', description: '체리/레몬 확률 -5%, 클로버/종 확률 +5%', size: 1, cost: 1, tier: 1, type: 'luck', effectType: 'luck', icon: '🌱' },
  { id: 'lucky_coin', name: '행운의 짤랑이 동전', description: '매 턴 행운 +2, 수익 x1.3배', size: 1, cost: 1, tier: 1, type: 'luck', effectType: 'luck', icon: '🪙✨' },
  { id: 'clover_tea', name: '따뜻한 클로버 차', description: '매 턴 행운 +5, 수익 x1.5배', size: 1, cost: 1, tier: 1, type: 'luck', effectType: 'luck', icon: '🍵' },
  { id: 'lucky_charm', name: '행운의 부적', description: '해골(💀) 확률 -10%, 행운 +3', size: 1, cost: 1, tier: 1, type: 'luck', effectType: 'luck', icon: '🧧' },
  { id: 'star_fragment', name: '반짝이는 별조각', description: '별(🌟) 등장 확률 +5%, 수익 x1.3배', size: 1, cost: 1, tier: 1, type: 'luck', effectType: 'luck', icon: '✨' },

  // Tier 2: UNCOMMON (90% weight)
  { id: 'basket_of_plenty', name: '풍요의 바구니', description: '과일(체리/레몬) 등장 가중치 +20%, 해골 가중치 절반', size: 1, cost: 2, tier: 2, type: 'luck', effectType: 'luck', icon: '🧺' },
  { id: 'golden_bell_tower', name: '황금 종탑', description: '종 확률 +30%, 종 패턴 완성 시 기본 가치 2배', size: 1, cost: 2, tier: 2, type: 'luck', effectType: 'luck', icon: '🛕' },
  { id: 'four_leaf_clover', name: '진짜 네잎클로버', description: '행운 +10, 클로버(☘️) 등장 확률 +20%', size: 1, cost: 2, tier: 2, type: 'luck', effectType: 'luck', icon: '🍀' },
  { id: 'golden_pig_statue', name: '황금 돼지 동상', description: '돈(💰) 등장 확률 +15%, 수익 x2.0배', size: 1, cost: 2, tier: 2, type: 'luck', effectType: 'luck', icon: '🐖' },
  { id: 'acorn_squirrel', name: '무럭무럭 도토리 다람쥐', description: '턴 소모마다 배수가 영구적으로 +0.1배 성장', size: 1, cost: 2, tier: 2, type: 'growth', effectType: 'growth', icon: '🐿️', currentMultiplier: 1.1 },
  { id: 'sponge_slime', name: '스펀지 슬라임', description: '체리나 레몬 등장 시 흡수하여 배수 +0.1배 영구 상승', size: 1, cost: 2, tier: 2, type: 'growth', effectType: 'growth', icon: '🦠', currentMultiplier: 1.0 },
  { id: 'time_watch', name: '낡은 시간 여행 시계', description: '게이지 3: 사용 시 턴 무효화 후 재스핀', size: 1, cost: 2, tier: 2, type: 'active', effectType: 'active', icon: '⌚', activeGauge: 0, maxGauge: 3 },
  { id: 'safe_cracker_cat', name: '금고 털이범 고양이', description: '슬롯에서 💰가 나올 때마다 금고에 1,000원 즉시 입금', size: 1, cost: 2, tier: 2, type: 'passive', effectType: 'interest', icon: '🐱💰' },
  { id: 'membership_stamp_card', name: '야옹 상회 스탬프 카드', description: '매 턴 10% 확률로 쿠폰 1장 획득', size: 1, cost: 2, tier: 2, type: 'passive', effectType: 'base', icon: '🎫' },
  { id: 'hamster_worker', name: '성실한 알바생 햄스터', description: '1, 2턴엔 x1.5배, 마지막 3턴째엔 x5배', size: 1, cost: 2, tier: 2, type: 'passive', effectType: 'multiplier', icon: '🐹' },
  { id: 'lucky_clover', name: '행운의 네잎클로버', description: '매 턴 x1.5배 ~ x3.0배 랜덤 적용', size: 1, cost: 2, tier: 2, type: 'passive', effectType: 'multiplier', icon: '🍀' },
  { id: 'milk_drop', name: '찰랑이는 우유 방울', description: '스핀 시 10% 확률로 턴을 소모하지 않음', size: 1, cost: 2, tier: 2, type: 'luck', effectType: 'luck', icon: '🥛' },
  { id: 'magnet_paw', name: '끈끈이 자석 냥발', description: '패턴이 1칸 차이로 실패 시, 라운드당 1번 강제 완성', size: 1, cost: 2, tier: 2, type: 'passive', effectType: 'multiplier', icon: '🐾' },
  { id: 'carrot_coupon', name: '당근 마켓 단골 쿠폰', description: '상점 리롤 비용 증가폭 50% 감소', size: 1, cost: 2, tier: 2, type: 'passive', effectType: 'base', icon: '🥕' },
  { id: 'snowball_rice', name: '눈덩이 주먹밥', description: '기본 x1.1배, 턴마다 배수 +0.1배 영구 증가', size: 1, cost: 2, tier: 2, type: 'growth', effectType: 'growth', icon: '🍙', currentMultiplier: 1.1 },
  { id: 'space_donut', name: '우주 도넛', description: '매 턴 x1.2배, 양옆이 비어있으면 x2배 추가', size: 1, cost: 2, tier: 2, type: 'passive', effectType: 'multiplier', icon: '🍩' },
  { id: 'rabbit_foot', name: '보들보들 토끼 발', description: '행운(Luck) +15 증가', size: 1, cost: 2, tier: 2, type: 'luck', effectType: 'luck', icon: '🦶' },
  { id: 'golden_feather', name: '반짝이는 황금 깃털', description: '콤보(패턴) 발생 시마다 수익 x2.5배', size: 1, cost: 2, tier: 2, type: 'passive', effectType: 'multiplier', icon: '🪶' },

  // Tier 3: MILDLY RARE (80% weight)
  { id: 'space_cat', name: '별빛 삼키는 우주 고양이', description: '라운드 클리어 시 전체 수익 배수 +0.3배 영구 성장', size: 1, cost: 3, tier: 3, type: 'growth', effectType: 'growth', icon: '🐈‍⬛', currentMultiplier: 1.0 },
  { id: 'plasma_gun', name: '과부하 플라즈마 건', description: '게이지 5: 사용 시 이번 턴 최종 곱연산 강제 x10배', size: 1, cost: 3, tier: 3, type: 'active', effectType: 'active', icon: '🔫', activeGauge: 0, maxGauge: 5 },
  { id: '4d_pocket', name: '4차원 주머니', description: '구매 즉시 시너지 벨트 최대 칸 수 1칸 영구 확장', size: 1, cost: 3, tier: 3, type: 'consumable', effectType: 'base', icon: '🎒' },
  { id: 'gold_magnifier', name: '황금 돋보기', description: '바로 왼쪽 칸 아이템의 최종 생산량 x3배', size: 1, cost: 3, tier: 3, type: 'passive', effectType: 'multiplier', icon: '🔍' },
  { id: 'twin_mirror', name: '쌍둥이 거울', description: '바로 오른쪽 칸 아이템의 능력을 한 번 더 발동', size: 1, cost: 3, tier: 3, type: 'passive', effectType: 'multiplier', icon: '🪞' },
  { id: 'magic_popcorn', name: '마법의 뻥튀기 기계', description: '양옆(좌우) 칸 아이템의 생산량 x5배', size: 1, cost: 3, tier: 3, type: 'passive', effectType: 'multiplier', icon: '🍿' },
  { id: 'clover_hairpin', name: '네잎클로버 머리핀', description: '꽝 확률 절반 감소, 벨트 아이템과 콤보 확률 20% 증가', size: 1, cost: 3, tier: 3, type: 'luck', effectType: 'luck', icon: '🎀' },
  { id: 'piggy_bank_pro', name: '금고 전문가 돼지', description: '금고 잔고 10,000원당 매 턴 수익 x1.2배 (최대 x10배)', size: 1, cost: 3, tier: 3, type: 'passive', effectType: 'multiplier', icon: '🐷🏦' },
  { id: 'coupon_collector_album', name: '쿠폰 수집가 앨범', description: '보유한 쿠폰 1장당 매 턴 수익 x1.2배', size: 1, cost: 3, tier: 3, type: 'passive', effectType: 'multiplier', icon: '📖🎫' },
  { id: 'alien_jelly', name: '외계인 젤리', description: '매 턴 x1.5배, 다른 외계인 젤리 1개당 배수 x2배', size: 1, cost: 3, tier: 3, type: 'passive', effectType: 'multiplier', icon: '👾' },

  // Tier 4: RARE (65% weight)
  { id: 'compound_interest_calculator', name: '복리 계산기', description: '매 턴 종료 시 이자율이 1%p 영구 증가', size: 1, cost: 4, tier: 4, type: 'growth', effectType: 'interest', icon: '🧮', currentMultiplier: 0 },
  { id: 'luck_overflow_valve', name: '행운 과부하 밸브', description: '행운 수치가 100을 넘으면 넘은 수치 10당 배수 +0.5배 추가', size: 1, cost: 4, tier: 4, type: 'passive', effectType: 'multiplier', icon: '🎡' },
  { id: 'coupon_magnifier', name: '쿠폰 돋보기', description: '보유한 쿠폰 1장당 행운이 1 증가합니다.', size: 1, cost: 3, tier: 3, type: 'passive', effectType: 'luck', icon: '🔍🎫' },
  { id: 'atm_security_guard', name: '금고 경비원', description: '금고 잔고가 10만 원 이상일 경우, 함정(💀) 확률이 50% 감소합니다.', size: 1, cost: 4, tier: 4, type: 'passive', effectType: 'defense', icon: '👮' },
  { id: 'multiplier_prism', name: '배수 증폭 프리즘', description: '양옆의 배수(x) 아이템의 배수 수치를 2배로 증폭', size: 1, cost: 4, tier: 4, type: 'booster', effectType: 'booster', icon: '💎' },
  { id: 'gold_onion', name: '든든한 황금 양파', description: '턴 종료 시 금고(ATM) 잔고의 5% 이자 획득', size: 1, cost: 4, tier: 4, type: 'passive', effectType: 'interest', icon: '🧅' },

  { id: 'hungry_pig', name: '먹보 아기 돼지', description: '매 턴 수익 x0.5배, 라운드 클리어 시 누적된 페널티의 5배 지급', size: 1, cost: 4, tier: 4, type: 'passive', effectType: 'global', icon: '🐷' },
  { id: 'golden_horseshoe', name: '황금 편자', description: '모든 확률 발동 아이템의 성공 확률 +25%p', size: 1, cost: 4, tier: 4, type: 'luck', effectType: 'luck', icon: '🧲' },
  { id: 'bible_shield', name: '성스러운 성경', description: '함정 심볼(해골)의 효과를 1회 무효화하고 파괴됨', size: 1, cost: 4, tier: 4, type: 'defense', effectType: 'defense', icon: '📖' },
  { id: 'meteor_candy', name: '유성 캔디', description: '슬롯머신에서 🌟이 나올 때마다 수익 x3배', size: 1, cost: 4, tier: 4, type: 'passive', effectType: 'multiplier', icon: '🍬' },
  { id: 'golden_egg', name: '황금 알', description: '매 턴 x1.5배, 라운드 클리어 시 소지품(Wallet) x3배 후 파괴됨', size: 1, cost: 3, tier: 3, type: 'passive', effectType: 'global', icon: '🥚' },
  { id: 'lucky_dice', name: '행운의 주사위', description: '매 턴 행운(Luck) +1~50 랜덤 증가', size: 1, cost: 3, tier: 3, type: 'luck', effectType: 'luck', icon: '🎲' },

  // Tier 5: VERY RARE (50% weight)
  { id: 'combo_king_crown', name: '콤보 킹의 왕관', description: '콤보 3회 이상 발생 시 최종 수익 x10배', size: 1, cost: 5, tier: 5, type: 'passive', effectType: 'global', icon: '👑' },
  { id: 'blackhole_safe', name: '블랙홀 금고', description: '해당 턴 모든 아이템 총 수익 x5배 (2칸 차지)', size: 2, cost: 5, tier: 5, type: 'passive', effectType: 'global', icon: '🗄️' },
  { id: 'rainbow_clay', name: '무지개 찰흙', description: '슬롯 기호 중 하나를 조커로 변경 (최고 효율 기호 취급)', size: 1, cost: 5, tier: 5, type: 'wildcard', effectType: 'wildcard', icon: '🌈' },
  { id: 'rosary_beads', name: '축복받은 묵주', description: '함정 심볼의 효과를 영구적으로 무효화 (2칸 차지)', size: 2, cost: 6, tier: 5, type: 'defense', effectType: 'defense', icon: '📿' },
  { id: 'shield_generator', name: '보호막 생성기', description: '함정(💀)을 3개까지 막아줌 (매 라운드 충전)', size: 2, cost: 6, tier: 5, type: 'defense', effectType: 'defense', icon: '🛡️' },
  { id: 'coffee_boost', name: '로켓 에스프레소', description: '이번 턴 모든 아이템 생산량 x4배 후 파괴됨', size: 1, cost: 3, tier: 5, type: 'passive', effectType: 'global', icon: '☕' },

  // Tier 6: LEGENDARY (35% weight)
  { id: 'legendary_bank_key', name: '우주 은행의 마스터키', description: '매 턴 종료 시, 금고 잔고의 50%를 이자로 즉시 지급', size: 2, cost: 10, tier: 6, type: 'passive', effectType: 'interest', icon: '🗝️' },
  { id: 'legendary_distortion_mirror', name: '차원 왜곡 거울', description: '벨트에 있는 모든 아이템의 최종 수익을 x10배 함', size: 2, cost: 10, tier: 6, type: 'passive', effectType: 'global', icon: '🪞✨' },
  { id: 'legendary_vvip_card', name: '야옹 상회 VVIP 골드카드', description: '상점 리롤 비용 영구 0원, 매 라운드 시작 시 쿠폰 2장 무료 획득', size: 2, cost: 10, tier: 6, type: 'passive', effectType: 'base', icon: '💳' },

  // Tier 7: ULTRA LEGENDARY (20% weight)
  { id: 'ultra_clover_pit', name: '클로버 핏의 심장', description: '모든 패턴 배수가 영구적으로 +2 증가 (3칸 차지)', size: 3, cost: 15, tier: 7, type: 'passive', effectType: 'global', icon: '🍀❤️' },
  { id: 'ultra_angel_wing', name: '천사의 날개', description: '함정 심볼이 등장하지 않으며, 모든 수익 x20배', size: 2, cost: 20, tier: 7, type: 'passive', effectType: 'global', icon: '🪽' },

  // Consumables
  { id: 'magic_pouch', name: '마법의 주머니', description: '시너지 벨트 최대 칸 수 1칸 영구 증가', size: 1, cost: 5, tier: 4, type: 'consumable', effectType: 'base', icon: '🎒' },
  { id: 'hot_potato', name: '따끈한 군고구마', description: '이번 라운드 동안 최종 수익 x3배', size: 1, cost: 2, tier: 2, type: 'consumable', effectType: 'global', icon: '🍠' },
  { id: 'reset_wand', name: '초기화 마술봉', description: '턴 소모 없이 슬롯 1번 다시 돌리기', size: 1, cost: 2, tier: 2, type: 'consumable', effectType: 'base', icon: '🪄' },
  { id: 'fairy_magnifier', name: '요정의 돋보기', description: '다음 1턴 동안 슬롯머신에서 최소 2티어 이상 기호만 등장', size: 1, cost: 3, tier: 3, type: 'consumable', effectType: 'luck', icon: '🧚' },
];
