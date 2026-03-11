import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { MysteryReportGameState } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const mysteryService = {
  async generateMystery(): Promise<{ mystery: string; solution: string }> {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "바다거북 스프(수평적 사고 추리 게임) 문제를 하나 내줘. 오피스/직장 생활과 관련된 미스테리한 상황이면 좋겠어. '상황(문제)'과 '해답(전말)'을 각각 한국어로 작성해줘.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mystery: { type: Type.STRING, description: "기이하고 미스테리한 상황 설명" },
            solution: { type: Type.STRING, description: "사건의 실제 전말과 해답" }
          },
          required: ["mystery", "solution"]
        }
      }
    });

    try {
      return JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse mystery response", e);
      return {
        mystery: "어느 날 아침, 김 대리는 자신의 책상 위에 놓인 차가운 커피를 보고 비명을 질렀습니다. 하지만 그 커피는 독이 든 것도 아니었고, 김 대리가 주문한 것도 아니었습니다. 왜 그랬을까요?",
        solution: "김 대리는 전날 밤 늦게까지 야근을 하다가 책상에서 잠이 들었습니다. 아침에 눈을 떴을 때 놓여있던 차가운 커피는 그가 어젯밤 마시려다 잠들어서 식어버린 자신의 커피였습니다. 그는 자신이 회사에서 밤을 지새웠다는 사실에 절망하여 비명을 지른 것입니다."
      };
    }
  },

  async answerQuestion(mystery: string, solution: string, question: string, history: any[]): Promise<{ answer: 'YES' | 'NO' | 'IRRELEVANT' | 'HINT'; text: string }> {
    const historyText = history.map(h => `Q: ${h.text} -> A: ${h.answer}`).join('\n');
    
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

    try {
      return JSON.parse(response.text);
    } catch (e) {
      return { answer: 'IRRELEVANT', text: "질문을 이해하지 못했습니다." };
    }
  },

  async checkSolution(mystery: string, solution: string, guess: string): Promise<{ isCorrect: boolean; feedback: string }> {
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

    try {
      return JSON.parse(response.text);
    } catch (e) {
      return { isCorrect: false, feedback: "아직 정답과는 거리가 있는 것 같습니다." };
    }
  }
};
