export type CellType = 'START' | 'PROJECT' | 'CHANCE' | 'TAX' | 'JAIL' | 'REST' | 'GO_TO_JAIL';

export interface BoardCell {
  id: number;
  name: string;
  type: CellType;
  price?: number;
  rent?: number[]; // [level 1, level 2, level 3]
  description?: string;
}

export const OFFICE_LIFE_BOARD: BoardCell[] = [
  { id: 0, name: '인사팀 (출근)', type: 'START', description: '통과 시 월급 200만원 지급' },
  { id: 1, name: '신규 프로젝트 A', type: 'PROJECT', price: 100, rent: [10, 30, 90] },
  { id: 2, name: '법인카드 찬스', type: 'CHANCE' },
  { id: 3, name: '신규 프로젝트 B', type: 'PROJECT', price: 120, rent: [12, 36, 108] },
  { id: 4, name: '소득세 납부', type: 'TAX', description: '자산의 10% 납부' },
  { id: 5, name: '신규 프로젝트 C', type: 'PROJECT', price: 140, rent: [14, 42, 126] },
  { id: 6, name: '신규 프로젝트 D', type: 'PROJECT', price: 160, rent: [16, 48, 144] },
  { id: 7, name: '법인카드 찬스', type: 'CHANCE' },
  { id: 8, name: '신규 프로젝트 E', type: 'PROJECT', price: 180, rent: [18, 54, 162] },
  { id: 9, name: '신규 프로젝트 F', type: 'PROJECT', price: 200, rent: [20, 60, 180] },
  { id: 10, name: '감사팀 (경위서)', type: 'JAIL', description: '3턴간 대기' },
  { id: 11, name: '중점 과제 G', type: 'PROJECT', price: 220, rent: [22, 66, 198] },
  { id: 12, name: '법인카드 찬스', type: 'CHANCE' },
  { id: 13, name: '중점 과제 H', type: 'PROJECT', price: 240, rent: [24, 72, 216] },
  { id: 14, name: '중점 과제 I', type: 'PROJECT', price: 260, rent: [26, 78, 234] },
  { id: 15, name: '중점 과제 J', type: 'PROJECT', price: 280, rent: [28, 84, 252] },
  { id: 16, name: '중점 과제 K', type: 'PROJECT', price: 300, rent: [30, 90, 270] },
  { id: 17, name: '법인카드 찬스', type: 'CHANCE' },
  { id: 18, name: '중점 과제 L', type: 'PROJECT', price: 320, rent: [32, 96, 288] },
  { id: 19, name: '중점 과제 M', type: 'PROJECT', price: 340, rent: [34, 102, 306] },
  { id: 20, name: '탕비실 (티타임)', type: 'REST', description: '안전지대' },
  { id: 21, name: '글로벌 전략 N', type: 'PROJECT', price: 360, rent: [36, 108, 324] },
  { id: 22, name: '법인카드 찬스', type: 'CHANCE' },
  { id: 23, name: '글로벌 전략 O', type: 'PROJECT', price: 380, rent: [38, 114, 342] },
  { id: 24, name: '글로벌 전략 P', type: 'PROJECT', price: 400, rent: [40, 120, 360] },
  { id: 25, name: '지방세 납부', type: 'TAX', description: '자산의 10% 납부' },
  { id: 26, name: '글로벌 전략 Q', type: 'PROJECT', price: 420, rent: [42, 126, 378] },
  { id: 27, name: '법인카드 찬스', type: 'CHANCE' },
  { id: 28, name: '글로벌 전략 R', type: 'PROJECT', price: 440, rent: [44, 132, 396] },
  { id: 29, name: '글로벌 전략 S', type: 'PROJECT', price: 460, rent: [46, 138, 414] },
  { id: 30, name: '긴급 호출 (감사팀행)', type: 'GO_TO_JAIL', description: '즉시 감사팀으로 이동' },
  { id: 31, name: '핵심 계열사 T', type: 'PROJECT', price: 480, rent: [48, 144, 432] },
  { id: 32, name: '법인카드 찬스', type: 'CHANCE' },
  { id: 33, name: '핵심 계열사 U', type: 'PROJECT', price: 500, rent: [50, 150, 450] },
  { id: 34, name: '핵심 계열사 V', type: 'PROJECT', price: 520, rent: [52, 156, 468] },
  { id: 35, name: '핵심 계열사 W', type: 'PROJECT', price: 540, rent: [54, 162, 486] },
  { id: 36, name: '핵심 계열사 X', type: 'PROJECT', price: 560, rent: [56, 168, 504] },
  { id: 37, name: '법인카드 찬스', type: 'CHANCE' },
  { id: 38, name: '핵심 계열사 Y', type: 'PROJECT', price: 580, rent: [58, 174, 522] },
  { id: 39, name: '핵심 계열사 Z', type: 'PROJECT', price: 600, rent: [60, 180, 540] },
];
