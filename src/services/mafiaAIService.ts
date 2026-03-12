import { GoogleGenAI, Type } from "@google/genai";
import { Session, Player, MafiaGameState, MafiaPhase } from '../types';

let aiInstance: GoogleGenAI | null = null;
async function getAI() {
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiInstance;
}

export const mafiaAIService = {
  async getNightAction(session: Session, aiPlayer: Player): Promise<string | null> {
    try {
      const ai = await getAI();
      const game = session.mafiaGame as MafiaGameState;
      
      // Doctor can heal anyone including themselves. Others can only target others.
      const alivePlayers = (Object.values(session.players) as Player[]).filter(p => 
        p.isAlive && (aiPlayer.role === 'DOCTOR' || p.id !== aiPlayer.id)
      );
      
      if (alivePlayers.length === 0) return null;

      const prompt = `
        당신은 마피아 게임의 AI 플레이어입니다. 당신의 이름은 '${aiPlayer.nickname}'이고, 역할은 '${aiPlayer.role}'입니다.
        현재 밤이 되었습니다. 당신의 능력을 사용할 대상을 선택해야 합니다.
        선택 가능한 플레이어 목록: ${alivePlayers.map(p => p.nickname).join(', ')}
        
        ${aiPlayer.role === 'MAFIA' ? '마피아로서 죽일 대상을 선택하세요.' : ''}
        ${aiPlayer.role === 'DOCTOR' ? '의사로서 살릴 대상을 선택하세요. (자신을 살릴 수도 있습니다)' : ''}
        ${aiPlayer.role === 'POLICE' ? '경찰로서 조사할 대상을 선택하세요.' : ''}
        
        반드시 위 목록에 있는 플레이어 중 한 명의 닉네임을 선택해서 JSON 형식으로 반환하세요.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              targetNickname: { type: Type.STRING, description: "선택한 플레이어의 닉네임" }
            },
            required: ["targetNickname"]
          }
        }
      });

      const result = JSON.parse(response.text);
      const target = alivePlayers.find(p => p.nickname === result.targetNickname);
      return target ? target.id : alivePlayers[Math.floor(Math.random() * alivePlayers.length)].id;
    } catch (e) {
      console.error("AI Night Action Error:", e);
      // Fallback: Random choice
      const alivePlayers = (Object.values(session.players) as Player[]).filter(p => 
        p.isAlive && (aiPlayer.role === 'DOCTOR' || p.id !== aiPlayer.id)
      );
      if (alivePlayers.length === 0) return null;
      return alivePlayers[Math.floor(Math.random() * alivePlayers.length)].id;
    }
  },

  async getVoteTarget(session: Session, aiPlayer: Player): Promise<string | null> {
    try {
      const ai = await getAI();
      const alivePlayers = (Object.values(session.players) as Player[]).filter(p => p.isAlive && p.id !== aiPlayer.id);
      if (alivePlayers.length === 0) return null;

      // Get recent chat logs
      const recentChats = Object.values(session.messages || {})
        .slice(-20)
        .map(c => `${c.senderName}: ${c.content}`)
        .join('\n');

      const prompt = `
        당신은 마피아 게임의 AI 플레이어입니다. 당신의 이름은 '${aiPlayer.nickname}'이고, 역할은 '${aiPlayer.role}'입니다.
        현재 투표 시간입니다. 마피아로 의심되는 사람을 투표해야 합니다. (당신이 마피아라면 시민을 몰아가세요)
        
        최근 채팅 기록:
        ${recentChats || '(채팅 기록 없음)'}
        
        살아있는 다른 플레이어 목록: ${alivePlayers.map(p => p.nickname).join(', ')}
        
        채팅 기록을 바탕으로 누구를 투표할지 결정하세요. 기권하고 싶다면 빈 문자열을 반환하세요.
        반드시 살아있는 플레이어 중 한 명의 닉네임 또는 빈 문자열을 JSON 형식으로 반환하세요.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              targetNickname: { type: Type.STRING, description: "투표할 플레이어의 닉네임 (기권은 빈 문자열)" }
            },
            required: ["targetNickname"]
          }
        }
      });

      const result = JSON.parse(response.text);
      if (!result.targetNickname) return null; // Skip vote
      const target = alivePlayers.find(p => p.nickname === result.targetNickname);
      return target ? target.id : null;
    } catch (e) {
      console.error("AI Vote Error:", e);
      // Fallback: Random choice or skip
      if (Math.random() > 0.5) return null;
      const alivePlayers = (Object.values(session.players) as Player[]).filter(p => p.isAlive && p.id !== aiPlayer.id);
      return alivePlayers[Math.floor(Math.random() * alivePlayers.length)].id;
    }
  },

  async getChatMessage(session: Session, aiPlayer: Player): Promise<string> {
    try {
      const ai = await getAI();
      const alivePlayers = (Object.values(session.players) as Player[]).filter(p => p.isAlive);
      
      const recentChats = Object.values(session.messages || {})
        .slice(-15)
        .map(c => `${c.senderName}: ${c.content}`)
        .join('\n');

      const prompt = `
        당신은 마피아 게임의 AI 플레이어입니다. 당신의 이름은 '${aiPlayer.nickname}'이고, 역할은 '${aiPlayer.role}'입니다.
        현재 낮 시간이며, 사람들과 대화를 나누고 있습니다.
        
        최근 채팅 기록:
        ${recentChats || '(채팅 기록 없음)'}
        
        살아있는 플레이어 목록: ${alivePlayers.map(p => p.nickname).join(', ')}
        
        당신의 역할에 맞게 자연스럽고 짧은 한국어 채팅 메시지 1개를 작성하세요. (최대 2문장, 구어체 사용)
        마피아라면 정체를 숨기고 시민인 척 해야 합니다.
        의사나 경찰이라면 상황에 따라 직업을 밝히거나 숨길 수 있습니다.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              message: { type: Type.STRING, description: "채팅 메시지" }
            },
            required: ["message"]
          }
        }
      });

      return JSON.parse(response.text).message;
    } catch (e) {
      console.error("AI Chat Error:", e);
      const fallbacks = [
        "음... 누구를 믿어야 할지 모르겠네요.",
        "다들 조용하시네요. 무슨 생각하시나요?",
        "저는 시민입니다! 절 믿어주세요.",
        "누가 마피아일까요?",
        "일단 지켜보겠습니다."
      ];
      return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
  }
};
