export type PuzzleType = 'TEXT' | 'DIRECTION' | 'COLOR' | 'PATTERN' | 'CHOICE';

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
  requiredItem?: string;
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
}

export const ESCAPE_ROOM_THEMES: Record<string, EscapeRoomTheme> = {
  'horror': {
    id: 'horror',
    name: '버려진 정신병원',
    genre: '공포',
    description: '안개가 자욱한 밤, 당신은 소문만 무성하던 버려진 정신병원에 갇혔습니다. 복도 끝에서 들려오는 기괴한 소리를 피해 탈출해야 합니다.',
    difficulty: 'HARD',
    startRoomId: 'h_room_1',
    rooms: {
      'h_room_1': {
        id: 'h_room_1',
        name: '폐쇄 병동 복도',
        description: '깜빡이는 전등 사이로 낡은 휠체어가 놓여 있습니다. 벽에는 알 수 없는 낙서들이 가득합니다.',
        puzzles: [
          {
            id: 'h_p1_1',
            type: 'TEXT',
            question: '벽에 적힌 낙서: "12월 25일은 크리스마스, 1월 1일은 신정. 그렇다면 10월 31일은?"',
            answer: '할로윈',
            hint: '서양의 유령 축제입니다.',
            superHint: 'ㅎㄹㅇ',
            explanation: '정답은 할로윈입니다. 병원 벽에 피로 적힌 듯한 낙서는 과거 환자들이 이 날을 얼마나 두려워했는지 보여줍니다.'
          },
          {
            id: 'h_p1_2',
            type: 'PATTERN',
            question: '바닥에 떨어진 환자 기록지: "4, 8, 12, 16, ? (다음 번호는?)"',
            answer: '20',
            hint: '4의 배수입니다.',
            superHint: '16 + 4 = ?',
            explanation: '규칙은 4씩 증가하는 수열입니다. 20번 환자의 기록지 뒤에서 진료실 열쇠를 발견했습니다.',
            rewardItem: '진료실 열쇠'
          }
        ],
        nextRoomId: 'h_room_2'
      },
      'h_room_2': {
        id: 'h_room_2',
        name: '원장실',
        description: '고급스러운 가구들이 부서진 채 방치되어 있습니다. 책상 위 금고가 굳게 닫혀 있습니다.',
        puzzles: [
          {
            id: 'h_p2_1',
            type: 'DIRECTION',
            question: '금고 다이얼 방향: "해는 동쪽에서 뜨고 서쪽으로 진다. 북쪽을 향해 서서 오른쪽으로 90도 돌면?"',
            answer: '동',
            hint: '방위 문제입니다.',
            superHint: '동서남북 중 하나입니다.',
            explanation: '북쪽을 기준으로 오른쪽 90도는 동쪽입니다. 다이얼이 "딸깍" 소리를 내며 돌아갑니다.'
          },
          {
            id: 'h_p2_2',
            type: 'TEXT',
            question: '금고 비밀번호: "병원 설립일은 1985년 03월 12일이다. 모든 숫자를 더하면?"',
            answer: '29',
            hint: '1+9+8+5+0+3+1+2',
            superHint: '이십구',
            explanation: '1+9+8+5+0+3+1+2 = 29입니다. 금고가 열리며 지하실로 통하는 카드키가 나옵니다.',
            requiredItem: '진료실 열쇠',
            rewardItem: '지하실 카드키'
          }
        ],
        nextRoomId: 'h_room_3'
      },
      'h_room_3': {
        id: 'h_room_3',
        name: '지하 수술실',
        description: '녹슨 수술대와 깨진 약병들이 흩어져 있습니다. 차가운 기운이 엄습합니다.',
        puzzles: [
          {
            id: 'h_p3_1',
            type: 'CHOICE',
            question: '수술대 옆 모니터: "인간의 뼈는 총 몇 개인가?"',
            answer: '206',
            options: ['106', '206', '306', '406'],
            hint: '성인 기준입니다.',
            superHint: '200개가 조금 넘습니다.',
            explanation: '인간의 뼈는 206개입니다. 모니터에 기괴한 엑스레이 사진이 지나가며 문이 열립니다.'
          },
          {
            id: 'h_p3_2',
            type: 'PATTERN',
            question: '탈출구 암호: "S, M, T, W, T, F, ? (다음 알파벳은?)"',
            answer: 'S',
            hint: '요일의 영어 첫 글자입니다.',
            superHint: 'Sunday의 첫 글자.',
            explanation: 'Sunday의 S입니다. 마침내 병원의 무거운 철문이 열리고 차가운 새벽 공기가 느껴집니다.',
            requiredItem: '지하실 카드키'
          }
        ]
      }
    }
  },
  'scifi': {
    id: 'scifi',
    name: '화성 기지 탈출',
    genre: 'SF',
    description: '화성 탐사 기지에 산소 공급 장치가 고장 났습니다. 구조선이 도착하기 전까지 시스템을 복구하고 탈출해야 합니다.',
    difficulty: 'NORMAL',
    startRoomId: 's_room_1',
    rooms: {
      's_room_1': {
        id: 's_room_1',
        name: '중앙 통제실',
        description: '경고음이 울려 퍼지고 있습니다. 메인 컴퓨터가 잠겨 있습니다.',
        puzzles: [
          {
            id: 's_p1_1',
            type: 'TEXT',
            question: '시스템 복구 코드: "태양계의 4번째 행성은?"',
            answer: '화성',
            hint: '우리가 지금 있는 곳입니다.',
            superHint: 'Mars',
            explanation: '정답은 화성입니다. 메인 컴퓨터가 부팅되며 기지의 산소 농도가 표시됩니다. 아직은 위험한 수준입니다.'
          },
          {
            id: 's_p1_2',
            type: 'COLOR',
            question: '비상 전원 연결: "정지 신호는 빨강, 진행 신호는 초록. 그렇다면 주의 신호는?"',
            answer: '노랑',
            hint: '신호등 색깔입니다.',
            superHint: 'Yellow',
            explanation: '노란색 전선을 연결하자 기지에 희미한 비상등이 켜집니다. 이제 생명 유지 장치실로 갈 수 있습니다.'
          }
        ],
        nextRoomId: 's_room_2'
      },
      's_room_2': {
        id: 's_room_2',
        name: '생명 유지 장치실',
        description: '산소 탱크들이 줄지어 있습니다. 밸브 조절이 필요합니다.',
        puzzles: [
          {
            id: 's_p2_1',
            type: 'CHOICE',
            question: '공기 성분 퀴즈: "지구 대기 중 가장 많은 비율을 차지하는 기체는?"',
            answer: '질소',
            options: ['산소', '이산화탄소', '질소', '아르곤'],
            hint: '과자 봉지에도 들어있습니다.',
            superHint: '78%를 차지합니다.',
            explanation: '질소는 대기의 약 78%를 차지합니다. 밸브가 열리며 신선한 공기가 기지 내부로 유입되기 시작합니다.'
          },
          {
            id: 's_p2_2',
            type: 'PATTERN',
            question: '압력 조절 암호: "1, 2, 4, 8, 16, ? (다음 숫자는?)"',
            answer: '32',
            hint: '2의 거듭제곱입니다.',
            superHint: '16 * 2 = ?',
            explanation: '2의 거듭제곱 수열입니다. 압력이 정상 수치로 돌아오며 격납고의 잠금 장치가 해제되었습니다.'
          }
        ],
        nextRoomId: 's_room_3'
      },
      's_room_3': {
        id: 's_room_3',
        name: '격납고',
        description: '탈출용 포드가 준비되어 있습니다. 연료 주입이 필요합니다.',
        puzzles: [
          {
            id: 's_p3_1',
            type: 'TEXT',
            question: '연료 배합비: "수소 원자 2개와 산소 원자 1개가 결합하면 무엇이 되는가?"',
            answer: '물',
            hint: 'H2O',
            superHint: '생명의 근원',
            explanation: 'H2O, 즉 물입니다. 특수 처리된 물이 연료 전지에 주입되며 탈출용 포드의 엔진이 가동됩니다.'
          },
          {
            id: 's_p3_2',
            type: 'DIRECTION',
            question: '발사 궤도 설정: "위, 위, 아래, 아래, 왼쪽, 오른쪽, 왼쪽, ? (다음 방향은?)"',
            answer: '오른쪽',
            hint: '유명한 커맨드 패턴입니다.',
            superHint: '코나미 커맨드',
            explanation: '마지막 방향은 오른쪽입니다. 궤도가 정확히 설정되었습니다. 3, 2, 1... 발사! 화성을 뒤로하고 지구로 향합니다.'
          }
        ]
      }
    }
  },
  'fantasy': {
    id: 'fantasy',
    name: '마법사의 탑',
    genre: '판타지',
    description: '전설적인 대마법사의 탑에 초대받았습니다. 하지만 마법사가 외출한 사이 탑의 방어 시스템이 작동해버렸습니다.',
    difficulty: 'NORMAL',
    startRoomId: 'f_room_1',
    rooms: {
      'f_room_1': {
        id: 'f_room_1',
        name: '연금술 실험실',
        description: '보라색 연기가 피어오르는 솥과 신비로운 약초들이 가득합니다.',
        puzzles: [
          {
            id: 'f_p1_1',
            type: 'COLOR',
            question: '마법 시약 조합: "파란색과 노란색을 섞으면 나오는 색은?"',
            answer: '초록',
            hint: '숲의 색깔입니다.',
            superHint: 'Green',
            explanation: '초록색 시약이 완성되었습니다! 솥에서 맑은 빛이 뿜어져 나오며 도서관으로 향하는 계단이 나타납니다.'
          },
          {
            id: 'f_p1_2',
            type: 'TEXT',
            question: '수정구슬의 예언: "머리는 하나인데 발은 네 개, 낮에는 일하고 밤에는 쉬는 것은?"',
            answer: '침대',
            hint: '가구입니다.',
            superHint: '잠잘 때 쓰는 것',
            explanation: '정답은 침대입니다. 수정구슬이 환하게 빛나며 당신의 지혜를 인정합니다.'
          }
        ],
        nextRoomId: 'f_room_2'
      },
      'f_room_2': {
        id: 'f_room_2',
        name: '도서관',
        description: '스스로 날아다니는 책들이 가득한 도서관입니다. 지혜의 시험을 통과해야 합니다.',
        puzzles: [
          {
            id: 'f_p2_1',
            type: 'TEXT',
            question: '지혜의 문구: "가장 가벼우면서도 가장 무거운 것은? (두 글자)"',
            answer: '마음',
            hint: '우리 몸 안에 있습니다.',
            superHint: 'Heart',
            explanation: '마음은 깃털처럼 가벼울 수도, 바위처럼 무거울 수도 있죠. 도서관의 책들이 길을 비켜줍니다.'
          },
          {
            id: 'f_p2_2',
            type: 'PATTERN',
            question: '마법 서적의 암호: "3, 6, 9, 12, ? (다음 숫자는?)"',
            answer: '15',
            hint: '3의 배수입니다.',
            superHint: '12 + 3 = ?',
            explanation: '3의 배수 규칙입니다. 15페이지를 펼치자 탑의 정상으로 통하는 마법진이 활성화됩니다.'
          }
        ],
        nextRoomId: 'f_room_3'
      },
      'f_room_3': {
        id: 'f_room_3',
        name: '정상 제단',
        description: '탑의 꼭대기입니다. 하늘에는 용이 날아다니고 있습니다.',
        puzzles: [
          {
            id: 'f_p3_1',
            type: 'TEXT',
            question: '용의 수수께끼: "나는 날개가 없어도 날고, 눈이 없어도 울며, 입이 없어도 속삭인다. 나는 누구인가?"',
            answer: '바람',
            hint: '공기의 흐름입니다.',
            superHint: 'Wind',
            explanation: '바람입니다. 거대한 용이 고개를 끄덕이며 당신을 탑 밖으로 안전하게 데려다줍니다.'
          },
          {
            id: 'f_p3_2',
            type: 'CHOICE',
            question: '탈출 마법 주문: "무지개의 색깔은 몇 가지인가?"',
            answer: '7',
            options: ['5', '6', '7', '8'],
            hint: '빨주노초파남보',
            superHint: '행운의 숫자',
            explanation: '7가지 색깔의 마법이 합쳐지며 눈부신 포탈이 열립니다. 당신은 무사히 탑을 탈출했습니다!'
          }
        ]
      }
    }
  },
  'mystery': {
    id: 'mystery',
    name: '탐정의 사무실',
    genre: '추리',
    description: '당신은 유명한 탐정의 조수입니다. 탐정이 남긴 암호를 풀어 사라진 보물을 찾아야 합니다.',
    difficulty: 'NORMAL',
    startRoomId: 'm_room_1',
    rooms: {
      'm_room_1': {
        id: 'm_room_1',
        name: '사무실 입구',
        description: '타자기 소리가 들리는 듯한 조용한 사무실입니다. 게시판에 단서들이 붙어 있습니다.',
        puzzles: [
          {
            id: 'm_p1_1',
            type: 'TEXT',
            question: '게시판의 쪽지: "범인은 항상 ?장소에 다시 나타난다. (두 글자)"',
            answer: '사건',
            hint: '일이 일어난 곳.',
            superHint: 'Case',
            explanation: '사건 현장입니다. 탐정의 날카로운 통찰력이 담긴 메모군요. 이제 금고를 조사해봅시다.'
          },
          {
            id: 'm_p1_2',
            type: 'PATTERN',
            question: '금고 비밀번호: "A=1, B=2, C=3... 그렇다면 D는?"',
            answer: '4',
            hint: '알파벳 순서입니다.',
            superHint: 'D = ?',
            explanation: 'D는 4번째 알파벳입니다. 금고가 열리며 암실로 들어가는 열쇠를 얻었습니다.'
          }
        ],
        nextRoomId: 'm_room_2'
      },
      'm_room_2': {
        id: 'm_room_2',
        name: '암실',
        description: '사진을 인화하는 붉은 조명의 방입니다. 벽에 사진들이 걸려 있습니다.',
        puzzles: [
          {
            id: 'm_p2_1',
            type: 'TEXT',
            question: '사진 속 단서: "거꾸로 해도 똑같은 단어, 3글자, 먹는 것"',
            answer: '토마토',
            hint: '빨간 채소입니다.',
            superHint: 'Tomato',
            explanation: '토마토입니다. 사진 뒤에 숨겨진 비밀 버튼을 찾았습니다.'
          },
          {
            id: 'm_p2_2',
            type: 'PATTERN',
            question: '인화액 배합: "1, 1, 2, 3, 5, 8, ? (다음 숫자는?)"',
            answer: '13',
            hint: '피보나치 수열입니다.',
            superHint: '5 + 8 = ?',
            explanation: '피보나치 수열에 따라 다음 숫자는 13입니다. 인화된 사진 속에서 비밀 서재의 위치가 드러납니다.'
          }
        ],
        nextRoomId: 'm_room_3'
      },
      'm_room_3': {
        id: 'm_room_3',
        name: '비밀 서재',
        description: '책장 뒤에 숨겨진 방입니다. 탐정이 찾던 보물이 여기 있을까요?',
        puzzles: [
          {
            id: 'm_p3_1',
            type: 'CHOICE',
            question: '마지막 질문: "셜록 홈즈의 단짝 친구 이름은?"',
            answer: '왓슨',
            options: ['모리아티', '왓슨', '레스트레이드', '허드슨'],
            hint: '존 왓슨',
            superHint: 'Watson',
            explanation: '왓슨 박사입니다. 탐정의 충실한 조력자죠. 이제 마지막 보물 상자만 남았습니다.'
          },
          {
            id: 'm_p3_2',
            type: 'TEXT',
            question: '보물 상자 코드: "우리나라의 국보 1호는?"',
            answer: '숭례문',
            hint: '남대문이라고도 불립니다.',
            superHint: 'ㅅㄹㅁ',
            explanation: '숭례문입니다. 상자가 열리며 탐정이 숨겨둔 황금 돋보기를 발견했습니다. 사건 해결!'
          }
        ]
      }
    }
  },
  'historical': {
    id: 'historical',
    name: '조선시대 감옥 탈출',
    genre: '역사',
    description: '억울하게 옥살이를 하게 된 당신. 암행어사가 오기 전까지 증거를 찾아 탈출해야 합니다.',
    difficulty: 'EASY',
    startRoomId: 'h_room_1',
    rooms: {
      'h_room_1': {
        id: 'h_room_1',
        name: '포도청 감옥',
        description: '창살 너머로 달빛이 들어옵니다. 간수가 잠든 사이 움직여야 합니다.',
        puzzles: [
          {
            id: 'h_p1_1',
            type: 'TEXT',
            question: '벽에 새겨진 글귀: "세종대왕이 창제한 우리 글의 이름은?"',
            answer: '훈민정음',
            hint: '한글의 옛 이름입니다.',
            superHint: 'ㅎㅁㅈㅇ',
            explanation: '백성을 가르치는 바른 소리, 훈민정음입니다. 벽의 글귀가 빛나며 옥사 문이 살짝 열립니다.'
          },
          {
            id: 'h_p1_2',
            type: 'CHOICE',
            question: '옥사 열쇠 암호: "십이지신 중 첫 번째 동물은?"',
            answer: '쥐',
            options: ['쥐', '소', '호랑이', '토끼'],
            hint: '자(子)',
            superHint: '찍찍',
            explanation: '자(子)는 쥐를 상징합니다. 간수의 허리춤에서 열쇠를 몰래 빼내어 탈출에 성공합니다.'
          }
        ],
        nextRoomId: 'h_room_2'
      },
      'h_room_2': {
        id: 'h_room_2',
        name: '형판 사무실',
        description: '각종 서류와 장부들이 쌓여 있습니다. 억울함을 풀 증거를 찾아야 합니다.',
        puzzles: [
          {
            id: 'h_p2_1',
            type: 'TEXT',
            question: '장부의 퀴즈: "조선시대 왕의 이름 뒤에 붙는 글자 두 가지는?"',
            answer: '조종',
            hint: '조와 종',
            superHint: 'ㅈㅈ',
            explanation: '조(祖)와 종(宗)입니다. 장부 속에서 당신의 무죄를 증명할 결정적인 서신을 발견했습니다.'
          },
          {
            id: 'h_p2_2',
            type: 'TEXT',
            question: '비밀 통로 암호: "임진왜란 때 거북선을 만든 장군은?"',
            answer: '이순신',
            hint: '성웅 이순신',
            superHint: 'ㅇㅅㅅ',
            explanation: '충무공 이순신 장군입니다. 책장 뒤의 비밀 통로가 열리며 밖으로 나가는 길이 보입니다.'
          }
        ],
        nextRoomId: 'h_room_3'
      },
      'h_room_3': {
        id: 'h_room_3',
        name: '뒷마당 담벼락',
        description: '이제 담장만 넘으면 자유입니다. 하지만 마지막 관문이 기다리고 있습니다.',
        puzzles: [
          {
            id: 'h_p3_1',
            type: 'TEXT',
            question: '마지막 수수께끼: "낮에는 올라가고 밤에는 내려가는 것은?"',
            answer: '해',
            hint: '태양입니다.',
            superHint: 'ㅎ',
            explanation: '해입니다. 동이 트기 시작합니다. 서둘러야 합니다!'
          },
          {
            id: 'h_p3_2',
            type: 'TEXT',
            question: '탈출 암호: "우리나라의 5대 궁궐 중 가장 큰 곳은?"',
            answer: '경복궁',
            hint: '광화문이 있는 곳입니다.',
            superHint: 'ㄱㅂㄱ',
            explanation: '경복궁입니다. 담장을 넘자마자 암행어사의 마패가 빛납니다. 당신은 무사히 억울함을 풀었습니다!'
          }
        ]
      }
    }
  }
};

export const ESCAPE_ROOM_DATA: Record<string, Room> = ESCAPE_ROOM_THEMES['horror'].rooms;
