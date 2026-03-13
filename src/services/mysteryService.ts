const FALLBACK_MYSTERIES = [
  {
    mystery: "어느 날 아침, 김 대리는 자신의 책상 위에 놓인 차가운 커피를 보고 비명을 질렀습니다. 하지만 그 커피는 독이 든 것도 아니었고, 김 대리가 주문한 것도 아니었습니다. 왜 그랬을까요?",
    solution: "김 대리는 전날 밤 늦게까지 야근을 하다가 책상에서 잠이 들었습니다. 아침에 눈을 떴을 때 놓여있던 차가운 커피는 그가 어젯밤 마시려다 잠들어서 식어버린 자신의 커피였습니다. 그는 자신이 회사에서 밤을 지새웠다는 사실에 절망하여 비명을 지른 것입니다.",
    difficulty: 'EASY' as const
  },
  {
    mystery: "어떤 남자가 10층 아파트에 산다. 그는 출근할 때는 엘리베이터를 타고 1층까지 내려가지만, 퇴근하고 돌아올 때는 비가 오는 날을 제외하고는 7층까지만 엘리베이터를 타고 나머지 3층은 계단으로 걸어 올라간다. 왜 그럴까?",
    solution: "남자는 키가 아주 작은 아이여서 10층 버튼에 손이 닿지 않는다. 비가 오는 날에는 우산을 가지고 있어서 우산 끝으로 10층 버튼을 누를 수 있다.",
    difficulty: 'EASY' as const
  },
  {
    mystery: "사막 한가운데에 한 남자가 벌거벗은 채 죽어 있다. 그의 손에는 부러진 성냥개비가 쥐어져 있고, 주변에는 발자국이나 다른 흔적이 전혀 없다. 남자는 왜 죽었을까?",
    solution: "남자는 다른 사람들과 열기구를 타고 사막을 건너고 있었다. 열기구가 추락할 위기에 처하자 무게를 줄이기 위해 짐과 옷을 다 버렸지만 역부족이었다. 결국 제비뽑기를 해서 한 명을 떨어뜨리기로 했고, 부러진 성냥개비를 뽑은 남자가 희생된 것이다.",
    difficulty: 'MEDIUM' as const
  },
  {
    mystery: "두 명의 여자가 한 식당에서 똑같은 음료를 주문했다. 한 여자는 음료를 1분 만에 벌컥벌컥 마셨고, 다른 여자는 30분 동안 천천히 마셨다. 천천히 마신 여자는 죽고, 빨리 마신 여자는 살았다. 두 음료에는 모두 독이 들어있었는데 왜 한 명만 죽었을까?",
    solution: "독은 음료 자체가 아니라 음료에 든 '얼음'에 들어있었다. 빨리 마신 여자는 얼음이 녹기 전에 다 마셔서 독이 퍼지지 않았고, 천천히 마신 여자는 얼음이 녹아 독이 음료에 섞이면서 죽게 되었다.",
    difficulty: 'MEDIUM' as const
  },
  {
    mystery: "남자는 라디오를 듣고 권총으로 자살했다. 왜 그랬을까?",
    solution: "남자는 등대지기였다. 라디오 뉴스에서 등대 불이 꺼져 여객선이 암초에 부딪혀 침몰했다는 소식을 듣고 죄책감에 자살한 것이다.",
    difficulty: 'HARD' as const
  },
  {
    mystery: "한 남자가 식당에서 '바다거북 스프'를 주문해 한 입 먹고는 집으로 돌아가 자살했습니다. 왜 그랬을까요?",
    solution: "남자는 과거에 배가 난파되어 아내와 함께 무인도에 표류했습니다. 먹을 것이 없어 굶어 죽기 직전, 동료가 '바다거북 스프'라며 고기 국을 주어 먹고 살아남았습니다. 하지만 나중에 식당에서 진짜 바다거북 스프를 먹어보니 그때 먹었던 맛과 전혀 달랐고, 그제야 자신이 그때 먹은 것이 아내의 살이었다는 것을 깨닫고 죄책감에 자살한 것입니다.",
    difficulty: 'HARD' as const
  }
];

export const mysteryService = {
  async generateMystery(): Promise<{ mystery: string; solution: string; difficulty: 'EASY' | 'MEDIUM' | 'HARD' }> {
    // Return a random fallback mystery instead of using AI
    const randomIndex = Math.floor(Math.random() * FALLBACK_MYSTERIES.length);
    return FALLBACK_MYSTERIES[randomIndex];
  },

  async answerQuestion(mystery: string, solution: string, question: string, history: any[]): Promise<{ answer: 'YES' | 'NO' | 'IRRELEVANT' | 'HINT'; text: string }> {
    // AI is disabled, so we return a placeholder. 
    // In the UI, we should probably allow the host to answer manually.
    return { 
      answer: 'HINT', 
      text: "AI 기능이 비활성화되었습니다. 방장(호스트)이 정답을 확인하고 답변을 입력해주세요." 
    };
  },

  async checkSolution(mystery: string, solution: string, guess: string): Promise<{ isCorrect: boolean; feedback: string }> {
    // AI is disabled. We can't automatically check the solution accurately.
    // We'll return a message asking the host to judge or just show the solution.
    return { 
      isCorrect: false, 
      feedback: "AI 자동 검증 기능이 비활성화되었습니다. 방장에게 정답 여부를 확인받거나 직접 정답을 확인하세요." 
    };
  }
};
