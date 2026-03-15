export interface Puzzle {
  id: string;
  question: string;
  answer: string;
  hint: string;
  rewardItem?: string;
  requiredItem?: string;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  puzzles: Puzzle[];
  nextRoomId?: string;
}

export const ESCAPE_ROOM_DATA: Record<string, Room> = {
  'room_1': {
    id: 'room_1',
    name: '신비한 서재',
    description: '먼지가 쌓인 책들이 가득한 서재입니다. 책상 위에 낡은 일기장이 놓여 있습니다.',
    puzzles: [
      {
        id: 'p1',
        question: '일기장 첫 페이지에 적힌 숫자는 무엇일까요? (힌트: 1, 1, 2, 3, 5, 8, ?)',
        answer: '13',
        hint: '피보나치 수열입니다.',
        rewardItem: '열쇠'
      }
    ],
    nextRoomId: 'room_2'
  },
  'room_2': {
    id: 'room_2',
    name: '비밀 통로',
    description: '벽장 뒤에 숨겨진 좁은 통로입니다. 끝에 철문이 가로막고 있습니다. 벽에는 고대 문자가 새겨져 있습니다.',
    puzzles: [
      {
        id: 'p2_1',
        question: '벽에 새겨진 문자: "나는 눈이 없어도 울 수 있고, 날개가 없어도 날 수 있다. 나는 무엇인가?"',
        answer: '구름',
        hint: '하늘에 떠 있습니다.'
      },
      {
        id: 'p2_2',
        question: '철문의 자물쇠에 새겨진 문구: "거꾸로 해도 똑같은 단어, 3글자, 기러기 말고 다른 것"',
        answer: '토마토',
        hint: '채소입니다.',
        requiredItem: '열쇠'
      }
    ],
    nextRoomId: 'room_3'
  },
  'room_3': {
    id: 'room_3',
    name: '연구실',
    description: '각종 플라스크와 실험 도구가 가득한 연구실입니다. 공기 중에 이상한 냄새가 납니다.',
    puzzles: [
      {
        id: 'p3_1',
        question: '칠판에 적힌 화학식: "H2O는 물, CO2는 이산화탄소. 그렇다면 O3는?"',
        answer: '오존',
        hint: '지구 대기권에 있는 층의 이름입니다.'
      },
      {
        id: 'p3_2',
        question: '금고의 비밀번호: "빨주노초파남보, 4번째와 7번째 색깔의 글자 수 합은?"',
        answer: '2',
        hint: '초, 보'
      }
    ],
    nextRoomId: 'room_4'
  },
  'room_4': {
    id: 'room_4',
    name: '공포의 지하실',
    description: '어둡고 습한 지하실입니다. 멀리서 기괴한 웃음소리가 들려옵니다.',
    puzzles: [
      {
        id: 'p4_1',
        question: '벽에 피로 적힌 숫자: "1, 4, 9, 16, 25, ?" (다음 숫자는?)',
        answer: '36',
        hint: '제곱수 수열입니다.'
      },
      {
        id: 'p4_2',
        question: '바닥에 놓인 인형이 말합니다: "나는 아침에는 네 발, 점심에는 두 발, 저녁에는 세 발로 걷는다. 나는 누구인가?"',
        answer: '사람',
        hint: '스핑크스의 수수께끼입니다.'
      }
    ],
    nextRoomId: 'room_5'
  },
  'room_5': {
    id: 'room_5',
    name: '고대 이집트 피라미드',
    description: '거대한 석조 구조물 내부입니다. 벽화가 살아 움직이는 것 같습니다.',
    puzzles: [
      {
        id: 'p5_1',
        question: '상형문자 해독: "해는 동쪽에서 뜨고 ?쪽으로 진다. (한글 한 글자)"',
        answer: '서',
        hint: '방위 중 하나입니다.'
      },
      {
        id: 'p5_2',
        question: '석판의 암호: "A=1, B=2, C=3... 그렇다면 CAB의 합은?"',
        answer: '6',
        hint: '알파벳 순서대로 숫자를 더하세요.'
      }
    ],
    nextRoomId: 'room_6'
  },
  'room_6': {
    id: 'room_6',
    name: '우주 정거장',
    description: '무중력 상태의 최첨단 시설입니다. 창밖으로 지구가 보입니다.',
    puzzles: [
      {
        id: 'p6_1',
        question: '컴퓨터 터미널: "태양계에서 가장 큰 행성의 이름은?"',
        answer: '목성',
        hint: '영문 이름은 Jupiter입니다.'
      },
      {
        id: 'p6_2',
        question: '비상 탈출구 코드: "지구의 위성 이름은?"',
        answer: '달',
        hint: '밤하늘에 떠 있는 그것입니다.'
      }
    ],
    nextRoomId: 'room_7'
  },
  'room_7': {
    id: 'room_7',
    name: '최후의 방',
    description: '눈부신 빛이 새어 나오는 방입니다. 중앙에 커다란 컴퓨터가 놓여 있습니다.',
    puzzles: [
      {
        id: 'p7',
        question: '컴퓨터 화면에 뜬 마지막 질문: "이 모든 것을 만든 AI의 이름은?"',
        answer: '제미나이',
        hint: 'G로 시작하는 구글의 AI입니다.',
      }
    ]
  }
};
