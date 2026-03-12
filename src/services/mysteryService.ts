import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { MysteryReportGameState } from "../types";

let aiInstance: GoogleGenAI | null = null;

async function getAI(): Promise<GoogleGenAI> {
  if (aiInstance) return aiInstance;
  
  // Try to use the build-time injected key first
  let apiKey = process.env.GEMINI_API_KEY || '';
  
  // If not available (e.g., deployed without build-time key), fetch from server
  if (!apiKey) {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      apiKey = data.geminiApiKey || '';
    } catch (e) {
      console.error("Failed to fetch API key from server", e);
    }
  }
  
  aiInstance = new GoogleGenAI({ apiKey });
  return aiInstance;
}

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
  }
];

export const mysteryService = {
  async generateMystery(): Promise<{ mystery: string; solution: string; difficulty: 'EASY' | 'MEDIUM' | 'HARD' }> {
    try {
      const ai = await getAI();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          바다거북 스프(수평적 사고 추리 게임) 문제를 하나 내줘. 
          주제는 일상, 공포, 판타지, SF, 범죄 등 아주 다양하게 선택해줘. (꼭 회사 관련일 필요 없음)
          난이도는 'EASY'(상황이 단순함), 'MEDIUM'(적절한 추리가 필요함), 'HARD'(매우 기발한 발상이 필요함) 중 하나로 랜덤하게 정해줘.
          '상황(mystery)', '해답(solution)', '난이도(difficulty)'를 각각 한국어로 작성해줘.
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mystery: { type: Type.STRING, description: "기이하고 미스테리한 상황 설명" },
              solution: { type: Type.STRING, description: "사건의 실제 전말과 해답" },
              difficulty: { type: Type.STRING, enum: ["EASY", "MEDIUM", "HARD"], description: "난이도" }
            },
            required: ["mystery", "solution", "difficulty"]
          }
        }
      });

      return JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to generate mystery (API Error or Parse Error):", e);
      // Return a random fallback mystery
      const randomIndex = Math.floor(Math.random() * FALLBACK_MYSTERIES.length);
      return FALLBACK_MYSTERIES[randomIndex];
    }
  },

  async answerQuestion(mystery: string, solution: string, question: string, history: any[]): Promise<{ answer: 'YES' | 'NO' | 'IRRELEVANT' | 'HINT'; text: string }> {
    try {
      const historyText = history.map(h => `Q: ${h.text} -> A: ${h.answer}`).join('\n');
      
      const ai = await getAI();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          당신은 '바다거북 스프' 추리 게임의 출제자입니다. 
          상황: ${mystery}
          해답: ${solution}
          
          이전 기록:
          ${historyText}
          
          질문: ${question}
          
          'YES', 'NO', 'IRRELEVANT', 'HINT' 중 하나로 답하세요. 
          - 정답에 가까우면 'YES'
          - 틀리면 'NO'
          - 상관없으면 'IRRELEVANT'
          - 플레이어가 너무 헤매거나 핵심에 근접하면 'HINT'와 함께 짧은 단서를 주세요.
          답변은 JSON 형식으로 하세요.
        `,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              answer: { type: Type.STRING, enum: ["YES", "NO", "IRRELEVANT", "HINT"] },
              text: { type: Type.STRING, description: "답변 부연 설명 (힌트일 경우 내용)" }
            },
            required: ["answer", "text"]
          }
        }
      });

      return JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to answer question (API Error or Parse Error):", e);
      return { answer: 'HINT', text: "⏳ API 무료 사용량(분당 20회)을 초과했습니다. 약 1분 정도 기다렸다가 다시 질문해 주세요!" };
    }
  },

  async checkSolution(mystery: string, solution: string, guess: string): Promise<{ isCorrect: boolean; feedback: string }> {
    try {
      const ai = await getAI();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          당신은 '바다거북 스프' 게임의 출제자입니다.
          상황: ${mystery}
          해답: ${solution}
          
          플레이어의 추측: ${guess}
          
          플레이어가 사건의 핵심 전말을 충분히 맞혔는지 판단하세요. 
          완벽하게 똑같을 필요는 없지만, 핵심적인 이유(왜 그런 일이 일어났는지)가 포함되어야 합니다.
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isCorrect: { type: Type.BOOLEAN },
              feedback: { type: Type.STRING, description: "정답일 경우 축하 메시지, 아닐 경우 격려 메시지" }
            },
            required: ["isCorrect", "feedback"]
          }
        }
      });

      return JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to check solution (API Error or Parse Error):", e);
      return { isCorrect: false, feedback: "⏳ API 무료 사용량(분당 20회)을 초과했습니다. 약 1분 정도 기다렸다가 다시 정답을 제출해 주세요!" };
    }
  }
};
