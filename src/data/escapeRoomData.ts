export type PuzzleType = 'TEXT' | 'DIRECTION_SEQUENCE' | 'COLOR' | 'PATTERN' | 'CHOICE' | 'HIDDEN_OBJECT' | 'DRAG_DROP' | 'PASSWORD_DIAL' | 'ITEM_INTERACTION' | 'UV_REVEAL' | 'TERMINAL' | 'FLASHLIGHT_FIND' | 'CLICK_SPAM';

export interface Puzzle {
  id: string;
  type: PuzzleType;
  question: string;
  answer: string;
  hint: string;
  superHint?: string;
  explanation?: string;
  options?: string[];
  rewardItem?: string;
  rewardItemExamine?: string; // 아이템 조사 시 나타나는 텍스트
  requiredItem?: string;
  // New fields for advanced puzzles
  imageUrl?: string;
  hiddenObjects?: { id: string; x: number; y: number; width: number; height: number; name: string }[];
  gridSize?: number;
  initialGrid?: number[];
  targetPattern?: string[][];
  // For DIRECTION_SEQUENCE
  sequence?: string[]; // e.g., ['UP', 'UP', 'DOWN', 'LEFT']
  // For DRAG_DROP
  dragItems?: { id: string; label: string; color?: string; size?: string }[];
  dropZones?: { id: string; label: string; accepts: string; size?: string }[];
  // For PASSWORD_DIAL
  dialCount?: number; // e.g., 4
  // For ITEM_INTERACTION
  targetObjectId?: string;
  // For UV_REVEAL
  hiddenMessage?: string;
  triggerTimer?: number; // in seconds
  // For TERMINAL
  expectedCommand?: string;
  isRandomPassword?: boolean;
  // For CLICK_SPAM
  clickTargets?: { id: string; label: string; requiredClicks: number }[];
}

export interface Room {
  id: string;
  name: string;
  description: string;
  puzzles: Puzzle[];
  nextRoomId?: string;
}

export interface EscapeRoomTheme {
  id: string;
  name: string;
  genre: string;
  description: string;
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
  rooms: Record<string, Room>;
  startRoomId: string;
  styles: {
    primaryColor: string;
    secondaryColor: string;
    bgColor: string;
    accentColor: string;
    fontFamily?: string;
  };
}

export const ESCAPE_ROOM_THEMES: Record<string, EscapeRoomTheme> = {
  'interactive_escape': {
    id: 'interactive_escape',
    name: '시즌 1: 시공간 탈출',
    genre: '미스터리',
    description: '알 수 없는 힘에 의해 시공간이 뒤틀린 방들에 갇혔습니다. 각 방의 퍼즐을 풀고 무사히 현실로 돌아가세요.',
    difficulty: 'NORMAL',
    startRoomId: 'room_1',
    styles: {
      primaryColor: '#4f46e5',
      secondaryColor: '#312e81',
      bgColor: '#0f172a',
      accentColor: '#818cf8',
      fontFamily: 'sans-serif'
    },
    rooms: {
      'room_1': {
        id: 'room_1',
        name: '어두운 지하실',
        description: '눈을 떠보니 습기 찬 지하실이다. 기초적인 조작법과 아이템 사용법을 익히는 방.',
        puzzles: [
          {
            id: 'r1_p1',
            type: 'HIDDEN_OBJECT',
            question: '방이 너무 어두워서 아무것도 보이지 않는다.',
            answer: 'found_all',
            hint: '화면 구석의 수상한 모양을 클릭해보자.',
            imageUrl: 'https://images.unsplash.com/photo-1519068737630-e5db30e12e42?q=80&w=1000&auto=format&fit=crop',
            hiddenObjects: [
              { id: 'fusebox', x: 80, y: 20, width: 15, height: 15, name: '두꺼비집(배전반)' }
            ],
            explanation: '덜컥 소리와 함께 불이 켜지며 방의 모습이 드러났다!'
          },
          {
            id: 'r1_p2_find',
            type: 'HIDDEN_OBJECT',
            question: '바닥에 먼지 쌓인 코트가 있다.',
            answer: 'found_all',
            hint: '코트를 클릭해보자.',
            imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop',
            hiddenObjects: [
              { id: 'coat', x: 50, y: 50, width: 30, height: 40, name: '먼지 쌓인 코트' }
            ],
            rewardItem: '녹슨 열쇠',
            explanation: '코트 주머니에서 녹슨 열쇠를 획득했다!'
          },
          {
            id: 'r1_p2_use',
            type: 'ITEM_INTERACTION',
            question: '철문이 굵은 자물쇠로 잠겨 있다.',
            answer: 'OPEN',
            hint: '인벤토리에서 열쇠를 선택한 뒤 자물쇠를 클릭하자.',
            targetObjectId: 'iron_door',
            requiredItem: '녹슨 열쇠',
            explanation: '녹슨 열쇠로 철문을 열었다!'
          },
          {
            id: 'r1_p3',
            type: 'DIRECTION_SEQUENCE',
            question: '다음 방으로 가는 엘리베이터 전원이 꺼져 있다. 벽에 핏자국으로 [상 - 상 - 하 - 좌 - 우] 라고 적혀 있다.',
            answer: 'UP,UP,DOWN,LEFT,RIGHT',
            hint: '벽에 적힌 방향대로 패널에 입력하자.',
            sequence: ['UP', 'UP', 'DOWN', 'LEFT', 'RIGHT'],
            explanation: '엘리베이터 전원이 켜지며 다음 방으로 이동한다!'
          }
        ],
        nextRoomId: 'room_2'
      },
      'room_2': {
        id: 'room_2',
        name: '버려진 비밀 연구소',
        description: '사이버틱한 조명과 복잡한 기계들이 있는 연구소다. 텍스트 단서와 다이얼 기믹을 활용해야 한다.',
        puzzles: [
          {
            id: 'r2_p1',
            type: 'PASSWORD_DIAL',
            question: '연구소 컴퓨터가 잠겨 있다. 모니터 옆 포스트잇에 "내 생일은 광복절(8월 15일) 다음 날이야"라고 적혀 있다.',
            answer: '0816',
            hint: '8월 15일의 다음 날짜를 4자리로 입력하자.',
            dialCount: 4,
            explanation: '컴퓨터 잠금이 해제되었다!'
          },
          {
            id: 'r2_p2',
            type: 'DRAG_DROP',
            question: '컴퓨터는 켰지만 메인 서버로 가는 문이 고장 나 있다. 끊어진 전선 3가닥(빨, 파, 초)을 알맞은 색상의 단자에 연결하자.',
            answer: 'CONNECTED',
            hint: '같은 색상의 단자에 전선을 드래그 앤 드롭으로 연결하자.',
            dragItems: [
              { id: 'wire_red', label: '빨간 선', color: '#ef4444' },
              { id: 'wire_blue', label: '파란 선', color: '#3b82f6' },
              { id: 'wire_green', label: '초록 선', color: '#22c55e' }
            ],
            dropZones: [
              { id: 'port_red', label: '빨간 단자', accepts: 'wire_red' },
              { id: 'port_blue', label: '파란 단자', accepts: 'wire_blue' },
              { id: 'port_green', label: '초록 단자', accepts: 'wire_green' }
            ],
            explanation: '전선이 연결되며 문이 열렸다!'
          },
          {
            id: 'r2_p3_quiz',
            type: 'PATTERN',
            question: '문 앞을 레이저가 막고 있다. 금고를 열어야 레이저를 끌 수 있다. 힌트: "첫 번째 숫자는 2, 두 번째는 4, 세 번째는 8... 그렇다면 네 번째는?"',
            answer: '16',
            hint: '이전 숫자에 2를 곱해보자.',
            rewardItem: '거울',
            explanation: '정답 16을 입력해 금고를 열고 거울을 획득했다!'
          },
          {
            id: 'r2_p3_use',
            type: 'ITEM_INTERACTION',
            question: '레이저가 길을 막고 있다. 빛을 반사시킬 물건이 필요하다.',
            answer: 'OPEN',
            hint: '인벤토리에서 거울을 선택한 뒤 레이저를 클릭하자.',
            targetObjectId: 'laser',
            requiredItem: '거울',
            explanation: '거울로 레이저 빛을 반사시켜 길을 열었다!'
          }
        ],
        nextRoomId: 'room_3'
      },
      'room_3': {
        id: 'room_3',
        name: '고대 유적의 심장',
        description: '웅장한 신전이다. 앞서 배운 모든 기믹을 종합해야 탈출할 수 있다.',
        puzzles: [
          {
            id: 'r3_p1_find',
            type: 'HIDDEN_OBJECT',
            question: '방 한가운데 제단이 있고, 주변에 빈 물통과 성스러운 샘물이 있다.',
            answer: 'found_all',
            hint: '빈 물통을 찾아 클릭하자.',
            imageUrl: 'https://images.unsplash.com/photo-1599930113854-d6d7fd521f10?q=80&w=1000&auto=format&fit=crop',
            hiddenObjects: [
              { id: 'empty_bottle', x: 30, y: 70, width: 15, height: 20, name: '빈 물통' }
            ],
            rewardItem: '빈 물통',
            explanation: '빈 물통을 획득했다!'
          },
          {
            id: 'r3_p1_use',
            type: 'ITEM_INTERACTION',
            question: '성스러운 샘물이 흐르고 있다. 물을 담을 그릇이 필요하다.',
            answer: 'OPEN',
            hint: '인벤토리에서 빈 물통을 선택한 뒤 샘물을 클릭하자.',
            targetObjectId: 'spring',
            requiredItem: '빈 물통',
            rewardItem: '물이 가득 찬 물통',
            explanation: '빈 물통에 성스러운 샘물을 가득 채웠다!'
          },
          {
            id: 'r3_p2',
            type: 'DIRECTION_SEQUENCE',
            question: '거대한 돌문이 길을 막고 있다. 벽화에 [태양(위) -> 대지(아래) -> 바다(우) -> 숲(좌)] 순서로 제사를 지냈다고 적혀 있다.',
            answer: 'UP,DOWN,RIGHT,LEFT',
            hint: '벽화의 순서대로 방향키를 입력하자.',
            sequence: ['UP', 'DOWN', 'RIGHT', 'LEFT'],
            explanation: '돌문이 흔들리며 열렸다!'
          },
          {
            id: 'r3_p3',
            type: 'PASSWORD_DIAL',
            question: '출구 앞 마지막 자물쇠. 벽에 4마리 동물의 석상이 있다. (독수리 날개 2개, 거미 다리 8개, 개구리 다리 4개, 뱀 다리 0개)',
            answer: '2840',
            hint: '동물의 다리(날개) 개수를 순서대로 4자리 숫자로 입력하자.',
            dialCount: 4,
            explanation: '화려한 이펙트와 함께 최종 탈출 성공!'
          }
        ]
      }
    }
  },
  'universe_escape': {
    id: 'universe_escape',
    name: '시즌 3: 방탈출 유니버스',
    genre: '종합 어드벤처',
    description: '10가지 각기 다른 테마의 방을 차례대로 탈출하는 거대한 여정입니다.',
    difficulty: 'NORMAL',
    startRoomId: 'STAGE_SELECT',
    styles: {
      primaryColor: '#059669',
      secondaryColor: '#064e3b',
      bgColor: '#022c22',
      accentColor: '#34d399',
      fontFamily: 'sans-serif'
    },
    rooms: {
      'stage_1': {
        id: 'stage_1',
        name: '버려진 지하철역',
        description: '깜빡이는 형광등 아래, 막차를 놓치고 갇힌 지하철역.',
        puzzles: [
          {
            id: 'u_s1_p1',
            type: 'FLASHLIGHT_FIND',
            question: '지하철역이 너무 어둡다. 손전등을 켜고 바닥을 살펴보자.',
            answer: 'found_all',
            hint: '마우스를 움직여 어두운 선로를 비춰보자.',
            imageUrl: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?q=80&w=1000&auto=format&fit=crop',
            hiddenObjects: [
              { id: 'card_key', x: 70, y: 80, width: 15, height: 15, name: '직원용 카드키' }
            ],
            rewardItem: '직원용 카드키',
            explanation: '선로 구석에서 직원용 카드키를 발견했다!'
          },
          {
            id: 'u_s1_p2',
            type: 'ITEM_INTERACTION',
            question: '개찰구가 굳게 닫혀 있다. 카드키를 찍어야 나갈 수 있을 것 같다.',
            answer: 'OPEN',
            hint: '인벤토리에서 직원용 카드키를 선택한 뒤 개찰구를 클릭하자.',
            targetObjectId: 'turnstile',
            requiredItem: '직원용 카드키',
            explanation: '삐빅! 개찰구가 열렸다.'
          },
          {
            id: 'u_s1_p3',
            type: 'PASSWORD_DIAL',
            question: '개찰구를 통과했지만 셔터가 내려가 있다. 노선도를 보니 [강남 -> 역삼 -> 선릉 -> 삼성] 순서로 환승 기호가 그려져 있다. (강남: 2, 역삼: 0, 선릉: 4, 삼성: 8)',
            answer: '2048',
            hint: '노선도에 적힌 숫자를 순서대로 입력하자.',
            dialCount: 4,
            explanation: '셔터가 올라가며 다음 스테이지로 가는 길이 열렸다!'
          }
        ],
        nextRoomId: 'stage_2'
      },
      'stage_2': {
        id: 'stage_2',
        name: '장난감 장인의 공방',
        description: '기괴한 태엽 장난감들이 가득한 나무 공방.',
        puzzles: [
          {
            id: 'u_s2_p1',
            type: 'DRAG_DROP',
            question: '거대한 오르골이 멈춰 있다. 크기가 다른 톱니바퀴 3개를 알맞은 슬롯에 끼워 넣자.',
            answer: 'CONNECTED',
            hint: '톱니바퀴의 크기에 맞는 슬롯에 드래그 앤 드롭하자.',
            dragItems: [
              { id: 'gear_small', label: '작은 톱니', size: 'small', color: '#b45309' },
              { id: 'gear_medium', label: '중간 톱니', size: 'medium', color: '#d97706' },
              { id: 'gear_large', label: '큰 톱니', size: 'large', color: '#f59e0b' }
            ],
            dropZones: [
              { id: 'slot_large', label: '큰 슬롯', accepts: 'gear_large', size: 'large' },
              { id: 'slot_small', label: '작은 슬롯', accepts: 'gear_small', size: 'small' },
              { id: 'slot_medium', label: '중간 슬롯', accepts: 'gear_medium', size: 'medium' }
            ],
            explanation: '톱니바퀴가 맞물려 돌아가며 오르골에서 멜로디가 흘러나온다!'
          },
          {
            id: 'u_s2_p2',
            type: 'PATTERN',
            question: '오르골에서 "도-미-솔-도" 멜로디가 나온다. 금고의 다이얼을 이 멜로디에 맞게 돌려야 한다. (도=1, 레=2, 미=3, 파=4, 솔=5, 라=6, 시=7)',
            answer: '1351',
            hint: '계이름을 숫자로 변환하여 입력하자.',
            explanation: '금고가 열리며 다음 스테이지로 가는 열쇠를 얻었다!'
          }
        ],
        nextRoomId: 'stage_3'
      },
      'stage_3': {
        id: 'stage_3',
        name: '심해 6,000m 잠수함',
        description: '물이 새어 들어오고 산소가 떨어져 가는 심해 탐사선.',
        puzzles: [
          {
            id: 'u_s3_p1',
            type: 'CLICK_SPAM',
            question: '파이프 3곳에서 물이 새고 있다! 빠르게 클릭해서 용접 게이지를 채워야 한다.',
            answer: 'REPAIRED',
            hint: '파이프를 미친 듯이 클릭하자!',
            triggerTimer: 180, // 3 minutes
            clickTargets: [
              { id: 'pipe_1', label: '메인 파이프', requiredClicks: 30 },
              { id: 'pipe_2', label: '보조 파이프', requiredClicks: 20 },
              { id: 'pipe_3', label: '냉각 파이프', requiredClicks: 25 }
            ],
            explanation: '모든 파이프를 수리했다! 하지만 아직 잠수함 해치가 잠겨 있다.'
          },
          {
            id: 'u_s3_p2',
            type: 'PASSWORD_DIAL',
            question: '소나(Sonar) 레이더에 심해어 무리가 찍혔다. [상어 2마리, 오징어 5마리, 해파리 7마리]. 해치 비밀번호는 무엇일까?',
            answer: '257',
            hint: '심해어의 마리 수를 순서대로 입력하자.',
            dialCount: 3,
            explanation: '잠수함 해치가 열리며 무사히 탈출했다!'
          }
        ]
      }
    }
  },
  'mystery_room': {
    id: 'mystery_room',
    name: '시즌 2: 미스터리 룸',
    genre: '공포/사이버펑크/판타지',
    description: '저주받은 폐병원, 해커의 은신처, 연금술사의 공방을 넘나들며 탈출하세요.',
    difficulty: 'HARD',
    startRoomId: 'room_1',
    styles: {
      primaryColor: '#991b1b', // Red for horror
      secondaryColor: '#450a0a',
      bgColor: '#171717',
      accentColor: '#f87171',
      fontFamily: 'sans-serif'
    },
    rooms: {
      'room_1': {
        id: 'room_1',
        name: '저주받은 폐병원',
        description: '제한 시간 내에 탈출하지 못하면 화면이 붉어지며 게임 오버되는 긴장감 넘치는 방.',
        puzzles: [
          {
            id: 's2_r1_p1',
            type: 'HIDDEN_OBJECT',
            question: '바닥에 손전등 같은 것이 떨어져 있다.',
            answer: 'found_all',
            hint: '바닥을 잘 살펴보자.',
            imageUrl: 'https://images.unsplash.com/photo-1505686994434-e3cc5abf1330?q=80&w=1000&auto=format&fit=crop',
            hiddenObjects: [
              { id: 'uv_lantern', x: 20, y: 80, width: 20, height: 20, name: 'UV 랜턴' }
            ],
            rewardItem: 'UV 랜턴',
            explanation: 'UV 랜턴을 획득했다! 눈에 보이지 않는 것을 볼 수 있을지도 모른다.'
          },
          {
            id: 's2_r1_p2',
            type: 'UV_REVEAL',
            question: '방은 피투성이 벽돌로 가득하다. 평범하게 보면 아무것도 없지만...',
            answer: 'HELP',
            hint: '인벤토리에서 UV 랜턴을 활성화하고 벽을 살펴보자.',
            requiredItem: 'UV 랜턴',
            hiddenMessage: 'HELP',
            triggerTimer: 60, // 60 seconds timer triggers when this puzzle is solved
            explanation: '벽에 숨겨진 글씨 HELP를 발견했다! 갑자기 삐- 삐- 소리가 들린다!'
          },
          {
            id: 's2_r1_p3',
            type: 'PASSWORD_DIAL',
            question: '시한폭탄 자물쇠가 작동하기 시작했다! 시간 내에 암호를 입력해야 한다.',
            answer: 'HELP',
            hint: '방금 벽에서 발견한 글씨를 입력하자.',
            dialCount: 4,
            explanation: '폭발을 막았다! 다음 방으로 가는 문이 열렸다.'
          }
        ],
        nextRoomId: 'room_2'
      },
      'room_2': {
        id: 'room_2',
        name: '해커의 은신처',
        description: '마우스 클릭이 아닌, 직접 키보드로 명령어를 쳐서 해킹하는 해커 컨셉의 방.',
        puzzles: [
          {
            id: 's2_r2_p1',
            type: 'TERMINAL',
            question: '낡은 컴퓨터 모니터가 켜져 있다. 금고 열기 프로그램을 실행해야 한다.',
            answer: 'open vault.exe',
            hint: '파일을 열려면 open [파일명] 을 입력하자.',
            expectedCommand: 'open vault.exe',
            explanation: '금고 프로그램이 실행되었다!'
          },
          {
            id: 's2_r2_p2',
            type: 'TERMINAL',
            question: '암호화된 파일이 있다. 해독해서 정답을 콘솔에 입력하자.',
            answer: 'RANDOM', // This will be handled dynamically
            hint: '수식을 계산해서 입력하자.',
            isRandomPassword: true,
            explanation: '비밀번호가 일치한다! 다음 방으로 이동한다.'
          }
        ],
        nextRoomId: 'room_3'
      },
      'room_3': {
        id: 'room_3',
        name: '연금술사의 공방',
        description: '인벤토리 창 안에서 아이템 두 개를 섞어 새로운 아이템을 창조하는 방.',
        puzzles: [
          {
            id: 's2_r3_p1',
            type: 'HIDDEN_OBJECT',
            question: '방 곳곳에 포션들이 흩어져 있다.',
            answer: 'found_all',
            hint: '빨간 포션과 파란 포션을 찾아보자.',
            imageUrl: 'https://images.unsplash.com/photo-1629196914225-eb8d35041065?q=80&w=1000&auto=format&fit=crop',
            hiddenObjects: [
              { id: 'red_potion', x: 30, y: 50, width: 10, height: 20, name: '빨간 포션' },
              { id: 'blue_potion', x: 70, y: 50, width: 10, height: 20, name: '파란 포션' }
            ],
            rewardItem: '빨간 포션,파란 포션', // Special handling needed for multiple items
            explanation: '빨간 포션과 파란 포션을 획득했다!'
          },
          {
            id: 's2_r3_p2',
            type: 'ITEM_INTERACTION',
            question: '문을 거대한 덩굴이 막고 있다. 이 상태로는 덩굴을 녹일 수 없다.',
            answer: 'OPEN',
            hint: '인벤토리 안에서 빨간 포션과 파란 포션을 조합해 보라색 맹독 포션을 만들자.',
            targetObjectId: 'vines',
            requiredItem: '보라색 맹독 포션',
            explanation: '맹독 포션으로 덩굴을 녹이고 탈출에 성공했다!'
          }
        ]
      }
    }
  }
};
