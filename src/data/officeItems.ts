export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
}

export const OFFICE_ITEMS: Item[] = [
  {
    id: 'CTRL_Z',
    name: 'Ctrl + Z (실행 취소)',
    description: '다른 플레이어에게 지불한 협업 비용을 즉시 돌려받습니다.',
    price: 300,
    icon: 'RotateCcw'
  },
  {
    id: 'VLOOKUP',
    name: 'VLOOKUP (데이터 조회)',
    description: '다음 주사위 결과를 미리 확인하거나 원하는 숫자로 고정합니다.',
    price: 500,
    icon: 'Search'
  },
  {
    id: 'COFFEE',
    name: '아이스 아메리카노',
    description: '감사팀(경위서) 대기 시간을 1턴 즉시 단축합니다.',
    price: 200,
    icon: 'Coffee'
  },
  {
    id: 'SHIELD',
    name: '법인카드 한도 증액',
    description: '다음 1회에 한해 세금이나 벌금을 면제받습니다.',
    price: 400,
    icon: 'ShieldCheck'
  }
];
