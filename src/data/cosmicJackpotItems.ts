export type ItemTier = 1 | 2 | 3 | 4 | 5 | 6;
export type ItemType = 'passive' | 'consumable';

export interface CosmicItem {
  id: string;
  name: string;
  description: string;
  size: number; // 1 or 2
  cost: number; // Now represents coupons
  tier: ItemTier;
  type: ItemType;
  icon: string;
}

export const COSMIC_ITEMS: CosmicItem[] = [
  // Tier 1: Base Production
  { id: 'coin_1', name: '짤랑이 꼬마 동전', description: '매 턴 수익 +10원', size: 1, cost: 1, tier: 1, type: 'passive', icon: '🪙' },
  { id: 'cash_dog', name: '지폐 뭉치 댕댕이', description: '매 턴 수익 +30원', size: 1, cost: 1, tier: 1, type: 'passive', icon: '🐶' },
  { id: 'gold_cat', name: '반짝반짝 금괴 냥이', description: '매 턴 수익 +50원', size: 1, cost: 1, tier: 1, type: 'passive', icon: '🐱' },

  // Tier 2: Conditional & Growth
  { id: 'hamster_worker', name: '성실한 알바생 햄스터', description: '1, 2턴엔 +10원, 마지막 3턴째엔 +100원', size: 1, cost: 2, tier: 2, type: 'passive', icon: '🐹' },
  { id: 'lucky_clover', name: '행운의 네잎클로버', description: '매 턴 10원~100원 랜덤 생산', size: 1, cost: 2, tier: 2, type: 'passive', icon: '🍀' },
  { id: 'snowball_rice', name: '눈덩이 주먹밥', description: '기본 +10원, 턴마다 생산량 2배 영구 증가', size: 1, cost: 2, tier: 2, type: 'passive', icon: '🍙' },

  // Tier 3: Positional Synergy
  { id: 'gold_magnifier', name: '황금 돋보기', description: '바로 왼쪽 칸 아이템의 최종 생산량 x2배', size: 1, cost: 3, tier: 3, type: 'passive', icon: '🔍' },
  { id: 'twin_mirror', name: '쌍둥이 거울', description: '바로 오른쪽 칸 아이템의 능력을 한 번 더 발동', size: 1, cost: 3, tier: 3, type: 'passive', icon: '🪞' },
  { id: 'magic_popcorn', name: '마법의 뻥튀기 기계', description: '양옆(좌우) 칸 아이템의 생산량 x3배', size: 1, cost: 3, tier: 3, type: 'passive', icon: '🍿' },

  // Tier 4: Compound & Broken
  { id: 'gold_onion', name: '든든한 황금 양파', description: '턴 종료 시 보유 총 잔고의 5% 이자 획득', size: 1, cost: 4, tier: 4, type: 'passive', icon: '🧅' },
  { id: 'hungry_pig', name: '먹보 아기 돼지', description: '매 턴 10원 차감, 라운드 클리어 시 차감 총액의 10배 지급', size: 1, cost: 4, tier: 4, type: 'passive', icon: '🐷' },
  { id: 'blackhole_safe', name: '블랙홀 금고', description: '해당 턴 모든 아이템 총 수익 x3배 (2칸 차지)', size: 2, cost: 4, tier: 4, type: 'passive', icon: '🗄️' },

  // Tier 5: Consumables
  { id: 'magic_pouch', name: '마법의 주머니', description: '시너지 벨트 최대 칸 수 1칸 영구 증가', size: 1, cost: 3, tier: 5, type: 'consumable', icon: '🎒' },
  { id: 'hot_potato', name: '따끈한 군고구마', description: '이번 라운드 동안 모든 아이템 기본 생산량 +20원', size: 1, cost: 2, tier: 5, type: 'consumable', icon: '🍠' },
  { id: 'reset_wand', name: '초기화 마술봉', description: '턴 소모 없이 슬롯 1번 다시 돌리기', size: 1, cost: 2, tier: 5, type: 'consumable', icon: '🪄' },

  // AI Creative Items
  { id: 'space_donut', name: '우주 도넛', description: '매 턴 +20원, 양옆이 비어있으면 +80원 추가', size: 1, cost: 2, tier: 2, type: 'passive', icon: '🍩' },
  { id: 'alien_jelly', name: '외계인 젤리', description: '매 턴 +10원, 다른 외계인 젤리 1개당 생산량 x2배', size: 1, cost: 3, tier: 3, type: 'passive', icon: '👾' },
  { id: 'sleepy_owl', name: '졸린 부엉이', description: '1, 2턴엔 0원, 3턴째에 모아둔 힘으로 +300원', size: 1, cost: 2, tier: 2, type: 'passive', icon: '🦉' },
  { id: 'coffee_boost', name: '로켓 에스프레소', description: '이번 턴 모든 아이템 생산량 x2배 후 파괴됨', size: 1, cost: 3, tier: 3, type: 'passive', icon: '☕' },
  { id: 'black_cat', name: '우주 검은 고양이', description: '매 턴 50% 확률로 +100원, 50% 확률로 0원', size: 1, cost: 2, tier: 2, type: 'passive', icon: '🐈‍⬛' },
  { id: 'meteor_candy', name: '유성 캔디', description: '슬롯머신에서 7️⃣이 나올 때마다 +500원', size: 1, cost: 4, tier: 4, type: 'passive', icon: '🍬' },
  { id: 'golden_ticket', name: '황금 티켓', description: '라운드 클리어 시 쿠폰 1장 추가 획득', size: 1, cost: 4, tier: 4, type: 'passive', icon: '🎫' },

  // Tier 6: Legendary (Boss Rewards)
  { id: 'legendary_bank_key', name: '우주 은행의 마스터키', description: '매 턴 종료 시, 현재 잔고의 50%를 이자로 즉시 지급', size: 2, cost: 999, tier: 6, type: 'passive', icon: '🗝️' },
  { id: 'legendary_distortion_mirror', name: '차원 왜곡 거울', description: '벨트에 있는 모든 아이템의 최종 수익을 x5배 함', size: 2, cost: 999, tier: 6, type: 'passive', icon: '🪞✨' },
  { id: 'legendary_vvip_card', name: '야옹 상회 VVIP 골드카드', description: '상점 리롤 비용 영구 0원, 매 라운드 시작 시 쿠폰 2장 무료 획득', size: 2, cost: 999, tier: 6, type: 'passive', icon: '💳' },
  { id: 'legendary_slime_king', name: '황금 슬라임 킹', description: '벨트에 있는 1티어 아이템 1개당 전체 수익 x10배 증폭', size: 2, cost: 999, tier: 6, type: 'passive', icon: '👑' },
];
