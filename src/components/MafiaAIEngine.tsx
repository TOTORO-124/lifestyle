import React, { useEffect, useRef } from 'react';
import { Session, Player, SessionStatus, MafiaPhase } from '../types';
import { mafiaAIService } from '../services/mafiaAIService';
import { sessionService } from '../services/sessionService';

interface MafiaAIEngineProps {
  session: Session;
  currentUser: any;
}

export const MafiaAIEngine: React.FC<MafiaAIEngineProps> = ({ session, currentUser }) => {
  const isHost = session.players[currentUser.uid]?.isHost;
  const processedPhases = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!isHost || !session.mafiaGame) return;

    const aiPlayers = (Object.values(session.players) as Player[]).filter(p => p.isAI && p.isAlive);
    if (aiPlayers.length === 0) return;

    const game = session.mafiaGame;
    const phaseKey = `${session.status}_${game.round}_${game.phase}`;

    if (processedPhases.current.has(phaseKey)) return;

    const processAI = async () => {
      processedPhases.current.add(phaseKey);

      // Role Confirmation Phase
      if (session.status === SessionStatus.REVEAL) {
        for (const ai of aiPlayers) {
          if (!ai.hasConfirmedRole) {
            await sessionService.confirmRole(session.id, ai.id);
          }
        }
      }

      // Day Phase (Chatting)
      if (session.status === SessionStatus.PLAYING && game.phase === MafiaPhase.DAY) {
        // AIs chat randomly over the next 10-20 seconds
        for (const ai of aiPlayers) {
          setTimeout(async () => {
            const message = await mafiaAIService.getChatMessage(session, ai);
            await sessionService.sendMessage(session.id, ai.id, ai.nickname, message);
          }, Math.random() * 15000 + 5000);
        }
      }

      // Voting Phase
      if (session.status === SessionStatus.VOTING) {
        for (const ai of aiPlayers) {
          if (!ai.voteTarget) {
            setTimeout(async () => {
              const targetId = await mafiaAIService.getVoteTarget(session, ai);
              if (targetId) {
                await sessionService.submitVote(session.id, ai.id, targetId);
              }
            }, Math.random() * 5000 + 2000);
          }
        }
      }

      // Night Phase
      if (session.status === SessionStatus.NIGHT && game.phase === MafiaPhase.NIGHT) {
        for (const ai of aiPlayers) {
          setTimeout(async () => {
            const targetId = await mafiaAIService.getNightAction(session, ai);
            if (targetId) {
              await sessionService.submitNightAction(session.id, ai.id, ai.role!, targetId);
            }
          }, Math.random() * 5000 + 2000);
        }
      }
    };

    processAI();

  }, [session.status, session.mafiaGame?.phase, session.mafiaGame?.round, isHost, session.id, session.players]);

  return null; // This is a logic-only component
};
