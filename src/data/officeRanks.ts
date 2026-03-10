export interface OfficeRank {
  name: string;
  salary: number;
  tollMultiplier: number;
  promotionCost: number;
}

export const OFFICE_RANKS: OfficeRank[] = [
  { name: '인턴', salary: 100, tollMultiplier: 1.0, promotionCost: 0 },
  { name: '사원', salary: 200, tollMultiplier: 1.2, promotionCost: 500 },
  { name: '대리', salary: 350, tollMultiplier: 1.5, promotionCost: 1000 },
  { name: '과장', salary: 500, tollMultiplier: 2.0, promotionCost: 2000 },
  { name: '차장', salary: 700, tollMultiplier: 2.5, promotionCost: 4000 },
  { name: '부장', salary: 1000, tollMultiplier: 3.0, promotionCost: 8000 },
  { name: '이사', salary: 1500, tollMultiplier: 4.0, promotionCost: 15000 },
  { name: '사장', salary: 2500, tollMultiplier: 6.0, promotionCost: 30000 }
];

export interface OfficeRole {
  id: string;
  name: string;
  description: string;
  skill: string;
  icon: string;
}

export const OFFICE_ROLES: OfficeRole[] = [
  {
    id: 'DEV',
    name: '개발자',
    description: '버그 수정의 달인',
    skill: '다른 플레이어의 프로젝트 비용 10% 할인',
    icon: 'Code'
  },
  {
    id: 'SALES',
    name: '영업직',
    description: '협상의 달인',
    skill: '프로젝트 승인(구매) 비용 10% 할인',
    icon: 'Handshake'
  },
  {
    id: 'DESIGN',
    name: '디자이너',
    description: '심미안의 소유자',
    skill: '자신의 프로젝트 비용 10% 추가 징수',
    icon: 'Palette'
  },
  {
    id: 'HR',
    name: '인사팀',
    description: '사내 인맥왕',
    skill: '법인카드 찬스에서 좋은 결과 확률 증가',
    icon: 'Users'
  },
  {
    id: 'PLANNER',
    name: '기획자',
    description: '데이터 분석가',
    skill: '월급 수령 시 20% 보너스',
    icon: 'LineChart'
  }
];
