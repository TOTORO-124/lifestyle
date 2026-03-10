export interface ChanceCard {
  id: string;
  title: string;
  description: string;
  effect: (assets: number) => number;
  message: string;
  type: 'GOOD' | 'BAD' | 'NEUTRAL';
}

export const CHANCE_CARDS: ChanceCard[] = [
  {
    id: 'BONUS_1',
    title: '연말 성과급 지급',
    description: '회사의 실적이 좋아 성과급이 지급됩니다.',
    effect: (a) => a + 500,
    message: '성과급 500만원을 수령했습니다!',
    type: 'GOOD'
  },
  {
    id: 'DINNER_1',
    title: '갑작스러운 회식',
    description: '팀장님의 번개 회식 제안으로 비용을 지출합니다.',
    effect: (a) => Math.max(0, a - 100),
    message: '회식비로 100만원을 지출했습니다.',
    type: 'BAD'
  },
  {
    id: 'STOCK_1',
    title: '우리사주 대박',
    description: '보유하고 있던 우리사주 가치가 급등했습니다.',
    effect: (a) => Math.floor(a * 1.2),
    message: '자산이 20% 증가했습니다!',
    type: 'GOOD'
  },
  {
    id: 'FINE_1',
    title: '법인카드 개인 사용 적발',
    description: '감사팀에 적발되어 징계금을 납부합니다.',
    effect: (a) => Math.max(0, a - 300),
    message: '징계금 300만원을 납부했습니다.',
    type: 'BAD'
  },
  {
    id: 'PROMOTION_1',
    title: '특별 승진 기회',
    description: '탁월한 업무 성과로 보너스를 받습니다.',
    effect: (a) => a + 1000,
    message: '특별 보너스 1000만원을 수령했습니다!',
    type: 'GOOD'
  },
  {
    id: 'EQUIPMENT_1',
    title: '최신형 노트북 지급',
    description: '업무 효율을 위해 최신 장비가 지급되지만, 자부담금이 발생합니다.',
    effect: (a) => Math.max(0, a - 50),
    message: '장비 자부담금 50만원을 지출했습니다.',
    type: 'NEUTRAL'
  },
  {
    id: 'DONATION_1',
    title: '사내 기부 캠페인',
    description: '어려운 이웃을 돕기 위해 기부에 동참합니다.',
    effect: (a) => Math.max(0, a - 20),
    message: '기부금 20만원을 전달했습니다.',
    type: 'NEUTRAL'
  },
  {
    id: 'INVEST_1',
    title: '부서 운영비 절감 포상',
    description: '운영비를 아껴 쓴 공로로 포상금을 받습니다.',
    effect: (a) => a + 200,
    message: '포상금 200만원을 수령했습니다.',
    type: 'GOOD'
  }
];
