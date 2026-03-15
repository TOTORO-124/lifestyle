import { ref, set, push, onValue, update, get, remove, onDisconnect } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { db, auth, isConfigured } from '../firebase';
import { Session, Player, SessionStatus, GameType, LiarMode, LiarGameState, MafiaGameState, MafiaPhase, BingoGameState, DrawGameState, LeaderboardEntry, OfficeLifeGameState, EscapeRoomGameState, CyberArenaGameState, ArenaProjectile, ArenaCharacter, ArenaItem } from '../types';
import { LIAR_TOPICS } from '../data/topics';
import { DRAW_TOPICS } from '../data/drawTopics';
import { BINGO_TOPICS } from '../data/bingoTopics';
import { OFFICE_LIFE_BOARD } from '../data/officeLifeBoard';
import { CHANCE_CARDS } from '../data/chanceCards';
import { OFFICE_ITEMS } from '../data/officeItems';
import { OFFICE_RANKS, OFFICE_ROLES } from '../data/officeRanks';
import { ESCAPE_ROOM_DATA } from '../data/escapeRoomData';
import { ARENA_SKILLS, ARENA_ITEMS, ARENA_CHARACTERS } from '../data/cyberArenaData';

export const sessionService = {
  async authenticate() {
    if (!isConfigured || !auth) return null;
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
    
    // Ensure user profile exists
    if (auth.currentUser && db) {
      const userRef = ref(db, `users/${auth.currentUser.uid}`);
      const snapshot = await get(userRef);
      if (!snapshot.exists()) {
        const initialProfile = {
          uid: auth.currentUser.uid,
          nickname: '익명 사원',
          department: 'DEV',
          xp: 0,
          level: 1,
          totalWins: 0,
          joinedAt: Date.now()
        };
        await set(userRef, initialProfile);
      }
    }
    
    return auth.currentUser;
  },

  async getUserProfile(uid: string) {
    if (!db) return null;
    const snapshot = await get(ref(db, `users/${uid}`));
    return snapshot.val();
  },

  async updateUserProfile(uid: string, updates: any) {
    if (!db) return;
    await update(ref(db, `users/${uid}`), updates);
  },

  async updatePresence(sessionId: string, playerId: string, isConnected: boolean) {
    if (!db) return;
    const playerRef = ref(db, `sessions/${sessionId}/players/${playerId}`);
    
    if (isConnected) {
      // Set to true and setup onDisconnect
      await update(playerRef, { isConnected: true });
      onDisconnect(ref(db, `sessions/${sessionId}/players/${playerId}/isConnected`)).set(false);
    } else {
      // Explicitly set to false (e.g. on logout)
      await update(playerRef, { isConnected: false });
      onDisconnect(ref(db, `sessions/${sessionId}/players/${playerId}/isConnected`)).cancel();
    }
  },

  async createSession(nickname: string, gameType: GameType): Promise<string> {
    const user = await this.authenticate();
    if (!user || !db) throw new Error('Firebase configuration required');

    const sessionRef = push(ref(db, 'sessions'));
    const sessionId = sessionRef.key!;
// ... (rest of the code remains same, just ensuring db is checked)

    const initialSession: Partial<Session> = {
      id: sessionId,
      gameType,
      hostId: user.uid,
      status: SessionStatus.LOBBY,
      round: 1,
      createdAt: Date.now(),
      settings: {
        maxPlayers: 10,
        liarMode: LiarMode.BASIC,
        liarCategory: '랜덤',
        mafiaCount: 1,
        doctorCount: 1,
        policeCount: 1,
        escapeRoomDifficulty: 'NORMAL',
        cyberArenaPvE: true,
      },
    };

    const hostPlayer: Player = {
      id: user.uid,
      nickname,
      isHost: true,
      isAlive: true,
      isReady: true,
      isConnected: true,
      lastActive: Date.now(),
    };

    await set(sessionRef, initialSession);
    await set(ref(db, `sessions/${sessionId}/players/${user.uid}`), hostPlayer);

    return sessionId;
  },

  async joinSession(sessionId: string, nickname: string) {
    const user = await this.authenticate();
    if (!user || !db) throw new Error('Firebase configuration required');

    const sessionSnap = await get(ref(db, `sessions/${sessionId}`));
    if (!sessionSnap.exists()) throw new Error('Session not found');

    const sessionData = sessionSnap.val();
    if (sessionData.players) {
      const existingPlayer = Object.values(sessionData.players).find(
        (p: any) => p.nickname === nickname && p.id !== user.uid
      );
      if (existingPlayer) throw new Error('이미 사용 중인 닉네임입니다.');
    }

    const isGameInProgress = sessionData.status !== SessionStatus.LOBBY;

    const player: Player = {
      id: user.uid,
      nickname,
      isHost: false,
      isAlive: true,
      isReady: false,
      isConnected: true,
      lastActive: Date.now(),
      isSpectator: isGameInProgress, // Set spectator if game is running
    };

    await set(ref(db, `sessions/${sessionId}/players/${user.uid}`), player);
    
    if (isGameInProgress) {
      // Add log for spectator join
      const logRef = push(ref(db, `sessions/${sessionId}/logs`));
      await set(logRef, {
        id: logRef.key,
        type: 'info',
        content: `${nickname}님이 관전자로 입장했습니다.`,
        timestamp: Date.now()
      });
    }
  },

  async addAIPlayer(sessionId: string) {
    if (!db) return;
    const aiId = `ai_${Math.random().toString(36).substr(2, 9)}`;
    const aiNicknames = ['인턴_봇', '사원_봇', '주임_봇', '대리_봇', '과장_봇', '차장_봇', '부장_봇', '이사_봇', '상무_봇'];
    const nickname = aiNicknames[Math.floor(Math.random() * aiNicknames.length)];
    
    const aiPlayer: Player = {
      id: aiId,
      nickname: `${nickname}(AI)`,
      isHost: false,
      isAlive: true,
      isReady: true,
      isConnected: true,
      isAI: true,
      lastActive: Date.now(),
    };

    await set(ref(db, `sessions/${sessionId}/players/${aiId}`), aiPlayer);
  },

  async processAllAIMoves(sessionId: string, session: Session) {
    if (!db || !session || session.status === SessionStatus.LOBBY) return;

    const players = Object.values(session.players || {}) as Player[];
    const aiPlayers = players.filter(p => p.isAI && p.isConnected !== false);
    if (aiPlayers.length === 0) return;

    // 1. Handle Role Confirmation
    if (session.status === SessionStatus.REVEAL) {
      for (const ai of aiPlayers) {
        if (!ai.hasConfirmedRole) {
          await update(ref(db, `sessions/${sessionId}/players/${ai.id}`), { hasConfirmedRole: true });
        }
      }
      return;
    }

    // 2. Handle Voting
    if (session.status === SessionStatus.VOTING) {
      const alivePlayers = players.filter(p => p.isAlive);
      for (const ai of aiPlayers) {
        if (ai.isAlive && !ai.voteTarget) {
          const targets = alivePlayers.filter(p => p.id !== ai.id);
          if (targets.length > 0) {
            const target = targets[Math.floor(Math.random() * targets.length)];
            await this.submitVote(sessionId, ai.id, target.id);
            await this.addLog(sessionId, `${ai.nickname}님이 투표를 마쳤습니다.`, 'info');
          }
        }
      }
      return;
    }

    // 3. Game Specific AI Logic
    switch (session.gameType) {
      case GameType.OMOK:
        if (session.omokGame?.currentPlayerId?.startsWith('ai_')) {
          await this.processOmokAIMove(sessionId);
        }
        break;
      case GameType.BINGO:
        if (session.status === SessionStatus.PLAYING && session.bingoGame) {
          for (const ai of aiPlayers) {
            if (!session.bingoGame.boards?.[ai.id]) {
              const words = BINGO_TOPICS.find(t => t.category === session.bingoGame?.category)?.words || [];
              const shuffled = [...words].sort(() => Math.random() - 0.5);
              const board = [];
              for (let i = 0; i < 5; i++) {
                board.push(shuffled.slice(i * 5, (i + 1) * 5));
              }
              await this.submitBingoBoard(sessionId, ai.id, board);
              await this.addLog(sessionId, `${ai.nickname}님이 빙고판 작성을 마쳤습니다.`, 'info');
            }
          }
          const turnOrder = session.turnOrder || [];
          const currentPlayerId = session.bingoGame.currentPlayerId;
          if (currentPlayerId?.startsWith('ai_')) {
             const aiBoard = session.bingoGame.boards?.[currentPlayerId];
             if (aiBoard) {
               const flatBoard = aiBoard.flat();
               const unpicked = flatBoard.filter(w => !session.bingoGame?.markedWords?.includes(w));
               if (unpicked.length > 0) {
                 const word = unpicked[Math.floor(Math.random() * unpicked.length)];
                 await this.pickBingoWord(sessionId, word, session);
               }
             }
          }
        }
        break;
      case GameType.MAFIA:
        if (session.status === SessionStatus.NIGHT && session.mafiaGame) {
           for (const ai of aiPlayers) {
             if (!ai.isAlive) continue;
             if (ai.role === 'MAFIA') {
                if (!session.mafiaGame.mafiaTargets?.[ai.id]) {
                  const targets = players.filter(p => p.isAlive && p.role !== 'MAFIA');
                  if (targets.length > 0) {
                    const target = targets[Math.floor(Math.random() * targets.length)];
                    await this.submitNightAction(sessionId, ai.id, 'MAFIA', target.id);
                    await this.addLog(sessionId, `${ai.nickname}님이 밤의 행동을 마쳤습니다.`, 'info');
                  }
                }
             } else if (ai.role === 'DOCTOR' && !session.mafiaGame.doctorTarget) {
                const targets = players.filter(p => p.isAlive);
                if (targets.length > 0) {
                  const target = targets[Math.floor(Math.random() * targets.length)];
                  await this.submitNightAction(sessionId, ai.id, 'DOCTOR', target.id);
                  await this.addLog(sessionId, `${ai.nickname}님이 밤의 행동을 마쳤습니다.`, 'info');
                }
             } else if (ai.role === 'POLICE' && !session.mafiaGame.policeTarget) {
                const targets = players.filter(p => p.isAlive && p.id !== ai.id);
                if (targets.length > 0) {
                  const target = targets[Math.floor(Math.random() * targets.length)];
                  await this.submitNightAction(sessionId, ai.id, 'POLICE', target.id);
                  await this.addLog(sessionId, `${ai.nickname}님이 밤의 행동을 마쳤습니다.`, 'info');
                }
             }
           }
        } else if (session.status === SessionStatus.PLAYING && session.mafiaGame) {
           // AI debating simulation
           if (Math.random() < 0.1) {
             const ai = aiPlayers[Math.floor(Math.random() * aiPlayers.length)];
             if (ai.isAlive) {
               const messages = [
                 "누가 마피아일까요? 수상한 사람이 있나요?",
                 "저는 시민입니다. 저를 믿어주세요.",
                 "조용히 있는 사람이 수상한 것 같아요.",
                 "어젯밤 일이 너무 충격적이네요.",
                 "빨리 투표를 시작했으면 좋겠어요.",
                 "제 생각에는... 음, 아직 잘 모르겠네요."
               ];
               const msg = messages[Math.floor(Math.random() * messages.length)];
               await this.addLog(sessionId, `[${ai.nickname}] ${msg}`, 'info');
             }
           }
        }
        break;
      case GameType.DRAW:
        if (session.status === SessionStatus.PLAYING && session.drawGame) {
          const currentPlayerId = session.drawGame.presenterId;
          if (currentPlayerId?.startsWith('ai_')) {
            if (session.drawGame.timer > 5) {
               await update(ref(db, `sessions/${sessionId}/drawGame`), { timer: 5 });
            }
          } else {
            for (const ai of aiPlayers) {
              if (ai.id !== currentPlayerId && !(session.drawGame.scores?.[ai.id] > 0)) {
                if (Math.random() < 0.1) {
                  await this.submitDrawGuess(sessionId, ai.id, session.drawGame.word || '', session);
                }
              }
            }
          }
        }
        break;
      case GameType.OFFICE_LIFE:
        // Already handled by processOfficeLifeAITurn
        break;
    }
  },

  async kickPlayer(sessionId: string, playerId: string) {
    if (!db) return;
    await remove(ref(db, `sessions/${sessionId}/players/${playerId}`));
  },

  subscribeToSession(sessionId: string, callback: (session: Session | null) => void) {
    if (!isConfigured || !db) return () => {};
    const sessionRef = ref(db, `sessions/${sessionId}`);
    return onValue(sessionRef, (snapshot) => {
      callback(snapshot.val());
    });
  },

  async updatePlayerReady(sessionId: string, playerId: string, isReady: boolean) {
    if (!db) return;
    await update(ref(db, `sessions/${sessionId}/players/${playerId}`), { isReady });
  },

  async startLiarGame(sessionId: string, players: Record<string, Player>, settings: any, currentTurnOrder?: string[]) {
    if (!db || !players) return;
    
    const playerIds = Object.keys(players || {}).filter(id => !players[id]?.isSpectator);
    const shuffledOrder = [...playerIds].sort(() => Math.random() - 0.5);
    
    const liarIdx = Math.floor(Math.random() * shuffledOrder.length);
    const liarPlayerId = shuffledOrder[liarIdx];

    let spyPlayerId: string | undefined;
    if (settings.liarMode === LiarMode.SPY && shuffledOrder.length >= 3) {
      let spyIdx;
      do {
        spyIdx = Math.floor(Math.random() * shuffledOrder.length);
      } while (spyIdx === liarIdx);
      spyPlayerId = shuffledOrder[spyIdx];
    }

    const category = settings.liarCategory === '랜덤' 
      ? LIAR_TOPICS[Math.floor(Math.random() * LIAR_TOPICS.length)]
      : LIAR_TOPICS.find(t => t.category === settings.liarCategory) || LIAR_TOPICS[0];
    
    const pair = category.pairs[Math.floor(Math.random() * category.pairs.length)];
    
    const liarGame: any = {
      mode: settings.liarMode,
      category: category.category,
      commonWord: pair.word1,
      liarWord: settings.liarMode === LiarMode.FOOL ? pair.word2 : '',
      liarPlayerId,
    };

    if (spyPlayerId) {
      liarGame.spyPlayerId = spyPlayerId;
    }

    // Determine Turn Order
    const turnOrder = [...shuffledOrder];

    const updates: any = {
      status: SessionStatus.REVEAL,
      liarGame,
      turnOrder,
    };

    // Reset player states
    playerIds.forEach(pid => {
      updates[`players/${pid}/hasConfirmedRole`] = false;
      updates[`players/${pid}/voteTarget`] = null;
      updates[`players/${pid}/isAlive`] = true;
    });

    await update(ref(db, `sessions/${sessionId}`), updates);
    await this.addLog(sessionId, `라이어 시트가 시작되었습니다.`, 'success');
  },

  async confirmRole(sessionId: string, playerId: string) {
    if (!db) return;
    await update(ref(db, `sessions/${sessionId}/players/${playerId}`), { hasConfirmedRole: true });
  },

  async startMafiaGame(sessionId: string, players: Record<string, Player>, settings: any, currentTurnOrder?: string[]) {
    if (!db || !players) return;
    const playerIds = Object.keys(players || {}).filter(id => !players[id]?.isSpectator);
    const count = playerIds.length;
    
    const mafiaCount = settings.mafiaCount ?? 1;
    const doctorCount = settings.doctorCount ?? 1;
    const policeCount = settings.policeCount ?? 1;

    if (mafiaCount + doctorCount + policeCount > count) {
      throw new Error('설정된 역할 수가 전체 플레이어 수보다 많습니다.');
    }
    
    // Determine Turn Order
    const finalTurnOrder = [...playerIds].sort(() => Math.random() - 0.5);
    
    // Assign Roles Randomly
    const roleAssignmentOrder = [...playerIds].sort(() => Math.random() - 0.5);
    const roles: Record<string, string> = {};
    
    let currentIndex = 0;

    // Assign Mafia
    for (let i = 0; i < mafiaCount; i++) {
      roles[roleAssignmentOrder[currentIndex]] = 'MAFIA';
      currentIndex++;
    }

    // Assign Doctor
    for (let i = 0; i < doctorCount; i++) {
      roles[roleAssignmentOrder[currentIndex]] = 'DOCTOR';
      currentIndex++;
    }

    // Assign Police
    for (let i = 0; i < policeCount; i++) {
      roles[roleAssignmentOrder[currentIndex]] = 'POLICE';
      currentIndex++;
    }

    // Assign Citizens to the rest
    while (currentIndex < count) {
      roles[roleAssignmentOrder[currentIndex]] = 'CITIZEN';
      currentIndex++;
    }

    const updates: any = {};
    Object.entries(roles).forEach(([pid, role]) => {
      updates[`players/${pid}/role`] = role;
      updates[`players/${pid}/isAlive`] = true;
      updates[`players/${pid}/hasConfirmedRole`] = false;
      updates[`players/${pid}/voteTarget`] = null;
    });

    // Also reset spectators or other players not in the game
    Object.keys(players).forEach(pid => {
      if (!roles[pid]) {
        updates[`players/${pid}/role`] = 'SPECTATOR';
        updates[`players/${pid}/isAlive`] = false;
      }
    });

    const mafiaGame: MafiaGameState = {
      phase: MafiaPhase.NIGHT,
      round: 1,
      mafiaTargets: {},
    };

    updates['status'] = SessionStatus.REVEAL;
    updates['mafiaGame'] = mafiaGame;
    updates['turnOrder'] = finalTurnOrder;

    await update(ref(db, `sessions/${sessionId}`), updates);
    await this.addLog(sessionId, `마피아 게임이 시작되었습니다. 역할을 확인해주세요.`, 'success');
  },

  async shuffleTurnOrder(sessionId: string, players: Record<string, Player>) {
    if (!db) return;
    const playerIds = Object.keys(players);
    const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
    await update(ref(db, `sessions/${sessionId}`), { turnOrder: shuffled });
  },

  async updateTurnOrder(sessionId: string, turnOrder: string[]) {
    if (!db) return;
    await update(ref(db, `sessions/${sessionId}`), { turnOrder });
  },

  async startNightPhase(sessionId: string, players: Record<string, Player>) {
    if (!db) return;
    
    // Reset night actions
    const updates: any = {
      status: SessionStatus.NIGHT,
      'mafiaGame/phase': MafiaPhase.NIGHT,
      'mafiaGame/mafiaTargets': null,
      'mafiaGame/doctorTarget': null,
      'mafiaGame/policeTarget': null,
      'mafiaGame/nightResult': null,
    };

    await update(ref(db, `sessions/${sessionId}`), updates);
  },

  async submitNightAction(sessionId: string, playerId: string, role: string, targetId: string) {
    if (!db) return;
    
    const updates: any = {};
    
    if (role === 'MAFIA') {
      updates[`mafiaGame/mafiaTargets/${playerId}`] = targetId;
    } else if (role === 'DOCTOR') {
      updates['mafiaGame/doctorTarget'] = targetId;
    } else if (role === 'POLICE') {
      updates['mafiaGame/policeTarget'] = targetId;
    }

    await update(ref(db, `sessions/${sessionId}`), updates);
  },

  async processNightPhase(sessionId: string, players: Record<string, Player>, mafiaGame: MafiaGameState) {
    if (!db || !players) return;

    // 1. Calculate Mafia target (majority vote)
    const mafiaVotes: Record<string, number> = {};
    if (mafiaGame.mafiaTargets) {
      Object.values(mafiaGame.mafiaTargets).forEach(targetId => {
        mafiaVotes[targetId] = (mafiaVotes[targetId] || 0) + 1;
      });
    }

    let mafiaTargetId: string | null = null;
    let maxVotes = 0;
    Object.entries(mafiaVotes).forEach(([targetId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        mafiaTargetId = targetId;
      }
    });

    // 2. Resolve actions
    let eliminatedId: string | null = null;
    let savedId: string | null = null;

    if (mafiaTargetId) {
      if (mafiaTargetId === mafiaGame.doctorTarget) {
        savedId = mafiaTargetId;
        await this.addLog(sessionId, `의사가 마피아의 공격으로부터 누군가를 살려냈습니다!`, 'success');
      } else {
        eliminatedId = mafiaTargetId;
        const victimName = players[eliminatedId]?.nickname || '누군가';
        await this.addLog(sessionId, `어젯밤, 마피아의 공격으로 ${victimName}님이 사망하셨습니다.`, 'warning');
      }
    } else {
      await this.addLog(sessionId, `어젯밤에는 아무 일도 일어나지 않았습니다.`, 'info');
    }

    // 3. Update state
    const updates: any = {
      status: SessionStatus.PLAYING,
      'mafiaGame/phase': MafiaPhase.DAY,
      'mafiaGame/round': (mafiaGame.round || 1) + 1,
      'mafiaGame/nightResult': {
        eliminatedPlayerId: eliminatedId,
        savedPlayerId: savedId,
        investigatedPlayerId: mafiaGame.policeTarget || null,
        investigatedRole: mafiaGame.policeTarget ? players[mafiaGame.policeTarget]?.role : null,
      }
    };

    if (eliminatedId) {
      updates[`players/${eliminatedId}/isAlive`] = false;
    }

    // 4. Check Win Conditions
    const currentPlayers = { ...players };
    if (eliminatedId) {
      currentPlayers[eliminatedId].isAlive = false;
    }

    const alivePlayers = Object.values(currentPlayers).filter(p => p.isAlive);
    const mafiaCount = alivePlayers.filter(p => p.role === 'MAFIA').length;
    const citizenCount = alivePlayers.length - mafiaCount;

    if (mafiaCount === 0) {
      updates['status'] = SessionStatus.SUMMARY;
      updates['mafiaGame/winner'] = 'CITIZEN';
      const winners = Object.values(players).filter(p => p.role !== 'MAFIA').map(p => p.id);
      await this.updateStats(sessionId, winners);
      await this.addLog(sessionId, `모든 마피아가 소탕되었습니다! 시민 팀의 승리입니다.`, 'success');
    } else if (mafiaCount >= citizenCount) {
      updates['status'] = SessionStatus.SUMMARY;
      updates['mafiaGame/winner'] = 'MAFIA';
      const winners = Object.values(players).filter(p => p.role === 'MAFIA').map(p => p.id);
      await this.updateStats(sessionId, winners);
      await this.addLog(sessionId, `마피아가 도시를 점령했습니다! 마피아 팀의 승리입니다.`, 'warning');
    }

    // Reset votes for the next day
    Object.keys(players).forEach(pid => {
      updates[`players/${pid}/voteTarget`] = null;
    });

    await update(ref(db, `sessions/${sessionId}`), updates);
  },

  async updateSettings(sessionId: string, settings: any) {
    if (!db) return;
    await update(ref(db, `sessions/${sessionId}/settings`), settings);
  },

  async addLog(sessionId: string, content: string, type: 'info' | 'success' | 'warning' = 'info') {
    if (!db) return;
    const logRef = ref(db, `sessions/${sessionId}/logs`);
    const newLogRef = push(logRef);
    await set(newLogRef, {
      id: newLogRef.key,
      content,
      type,
      timestamp: Date.now()
    });
  },

  async updateStats(sessionId: string, playerIds: string | string[], score: number = 0) {
    if (!db) return;
    const sessionRef = ref(db, `sessions/${sessionId}`);
    const snapshot = await get(sessionRef);
    const session = snapshot.val();
    if (!session) return;

    const ids = Array.isArray(playerIds) ? playerIds : [playerIds];
    const updates: any = {};
    const currentStats = session.stats || {};

    for (const pid of ids) {
      const playerStats = currentStats[pid] || { wins: 0, totalScore: 0 };
      updates[`stats/${pid}`] = {
        wins: (playerStats.wins || 0) + 1,
        totalScore: (playerStats.totalScore || 0) + score
      };

      // Award Global XP and Wins
      const userRef = ref(db, `users/${pid}`);
      const userSnap = await get(userRef);
      if (userSnap.exists()) {
        const profile = userSnap.val();
        const xpGain = 100 + (score > 0 ? Math.floor(score / 10) : 0);
        const newXp = (profile.xp || 0) + xpGain;
        const newLevel = Math.floor(newXp / 1000) + 1;
        
        await update(userRef, {
          xp: newXp,
          level: newLevel,
          totalWins: (profile.totalWins || 0) + 1
        });
      }
    }

    await update(ref(db, `sessions/${sessionId}`), updates);
  },

  async advanceStatus(sessionId: string, status: SessionStatus) {
    if (!db) return;
    await update(ref(db, `sessions/${sessionId}`), { status });
    await this.addLog(sessionId, `상태가 [${status}] 단계로 변경되었습니다.`);
  },

  async resetSession(sessionId: string, players: Record<string, Player>) {
    if (!db) return;
    const updates: any = {
      status: SessionStatus.LOBBY,
      liarGame: null,
      mafiaGame: null,
      bingoGame: null,
      omokGame: null,
      drawGame: null,
      minesweeperGame: null,
      office2048Game: null,
      sudokuGame: null,
      officeLifeGame: null,
      escapeRoomGame: null,
      cyberArenaGame: null,
      mysteryReportGame: null,
    };
    
    Object.keys(players).forEach(pid => {
      updates[`players/${pid}/isAlive`] = true;
      updates[`players/${pid}/voteTarget`] = null;
      updates[`players/${pid}/hasConfirmedRole`] = false;
      updates[`players/${pid}/role`] = null;
    });

    await update(ref(db, `sessions/${sessionId}`), updates);
  },

  async submitVote(sessionId: string, playerId: string, targetId: string) {
    if (!db) return;
    await update(ref(db, `sessions/${sessionId}/players/${playerId}`), { voteTarget: targetId });
  },

  async processMafiaVote(sessionId: string, players: Record<string, Player>) {
    if (!db || !players) return;
    
    const voteCounts: Record<string, number> = {};
    Object.values(players).forEach(p => {
      if (p.isAlive && p.voteTarget) {
        voteCounts[p.voteTarget] = (voteCounts[p.voteTarget] || 0) + 1;
      }
    });

    let maxVotes = 0;
    let votedPlayerId: string | null = null;
    let isTie = false;

    Object.entries(voteCounts).forEach(([pid, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        votedPlayerId = pid;
        isTie = false;
      } else if (count === maxVotes) {
        isTie = true;
      }
    });

    // In Mafia, usually a tie means no one dies, or a re-vote. Let's assume tie = no death for simplicity, or just kill the first one?
    // Let's say tie = no death.
    if (isTie) {
      votedPlayerId = null;
    }

    const updates: any = {};
    updates['status'] = SessionStatus.VOTE_RESULT;
    updates['mafiaGame/eliminatedPlayerId'] = votedPlayerId || null;

    if (votedPlayerId) {
      updates[`players/${votedPlayerId}/isAlive`] = false;
      
      // Check win condition
      const currentPlayers = { ...players };
      currentPlayers[votedPlayerId].isAlive = false; // Simulate death
      
      const alivePlayers = Object.values(currentPlayers).filter(p => p.isAlive);
      const mafiaCount = alivePlayers.filter(p => p.role === 'MAFIA').length;
      const citizenCount = alivePlayers.length - mafiaCount;

      if (mafiaCount === 0) {
        updates['status'] = SessionStatus.SUMMARY;
        updates['mafiaGame/winner'] = 'CITIZEN';
        const winners = Object.values(players).filter(p => p.role !== 'MAFIA').map(p => p.id);
        await this.updateStats(sessionId, winners);
      } else if (mafiaCount >= citizenCount) {
        updates['status'] = SessionStatus.SUMMARY;
        updates['mafiaGame/winner'] = 'MAFIA';
        const winners = Object.values(players).filter(p => p.role === 'MAFIA').map(p => p.id);
        await this.updateStats(sessionId, winners);
      }
    }

    // Reset votes
    Object.keys(players).forEach(pid => {
      updates[`players/${pid}/voteTarget`] = null;
    });

    await update(ref(db, `sessions/${sessionId}`), updates);
  },

  async processLiarVote(sessionId: string, players: Record<string, Player>, liarGame: LiarGameState) {
    if (!db || !players) return;
    
    const voteCounts: Record<string, number> = {};
    Object.values(players).forEach(p => {
      if (p.isAlive && p.voteTarget) {
        voteCounts[p.voteTarget] = (voteCounts[p.voteTarget] || 0) + 1;
      }
    });

    let maxVotes = 0;
    let votedPlayerId: string | null = null;

    Object.entries(voteCounts).forEach(([pid, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        votedPlayerId = pid;
      }
    });

    const updates: any = {};
    
    if (votedPlayerId) {
      updates[`players/${votedPlayerId}/isAlive`] = false;
      updates['liarGame/lastVotedPlayerId'] = votedPlayerId;

      // Check win condition
      const isLiarDead = votedPlayerId === liarGame.liarPlayerId;
      
      if (!isLiarDead) {
        // Citizen died. Check if Liar wins.
        const alivePlayersCount = Object.values(players).filter(p => p.isAlive && p.id !== votedPlayerId).length;
        
        // If only 2 players left (1 Liar + 1 Citizen), Liar wins
        if (alivePlayersCount <= 2) {
          updates['status'] = SessionStatus.SUMMARY;
          updates['liarGame/winner'] = 'LIAR';
          await this.updateStats(sessionId, liarGame.liarPlayerId);
        } else {
          updates['status'] = SessionStatus.VOTE_RESULT;
        }
      } else {
        // Liar died -> Go to result to reveal
        updates['status'] = SessionStatus.VOTE_RESULT;
        updates['liarGame/winner'] = 'CITIZEN';
        const winners = Object.values(players).filter(p => p.id !== liarGame.liarPlayerId).map(p => p.id);
        await this.updateStats(sessionId, winners);
      }
    } else {
      updates['status'] = SessionStatus.VOTE_RESULT;
    }

    // Reset votes for next round if needed
    Object.keys(players).forEach(pid => {
      updates[`players/${pid}/voteTarget`] = null;
    });
    
    await update(ref(db, `sessions/${sessionId}`), updates);
  },

  async resetVotes(sessionId: string, players: Record<string, Player>) {
    if (!db) return;
    const updates: any = {};
    Object.keys(players).forEach(pid => {
      updates[`players/${pid}/voteTarget`] = null;
    });
    await update(ref(db, `sessions/${sessionId}`), updates);
  },

  async sendMessage(sessionId: string, senderId: string, senderName: string, content: string, isSpectatorChat: boolean = false) {
    if (!db) return;
    const messagesRef = ref(db, `sessions/${sessionId}/messages`);
    const newMessageRef = push(messagesRef);
    await set(newMessageRef, {
      id: newMessageRef.key,
      senderId,
      senderName,
      content,
      timestamp: Date.now(),
      isSpectatorChat,
    });
  },

  async startOmokGame(sessionId: string, blackPlayerId: string, whitePlayerId: string, isAIMatch?: boolean, difficulty?: number) {
    if (!db) return;
    
    // Initialize 15x15 board
    const board = Array(15).fill(null).map(() => Array(15).fill(0));
    
    const omokGame: any = {
      board,
      blackPlayerId,
      whitePlayerId,
      currentPlayerId: blackPlayerId,
      winner: null,
      winningLine: null,
      isDraw: false,
      isAIMatch: isAIMatch || false,
      difficulty: difficulty || 1,
      startTime: Date.now(),
      moveCount: 0
    };

    const updates: any = {
      status: SessionStatus.PLAYING,
      omokGame
    };

    await update(ref(db, `sessions/${sessionId}`), updates);
    await this.addLog(sessionId, `오목 대전이 시작되었습니다.${isAIMatch ? ` (AI 난이도: ${difficulty})` : ''}`, 'success');

    // If black is AI, trigger first move
    if (blackPlayerId === 'AI') {
      setTimeout(() => {
        this.processOmokAIMove(sessionId);
      }, 1000);
    }
  },

  async startBingoSetup(sessionId: string, settings: any) {
    if (!db) return;
    
    const updates: any = {
      status: SessionStatus.PREPARING,
      bingoGame: {
        boards: {},
        markedWords: [],
        currentPlayerId: '',
        targetLines: settings.bingoLines || 3,
        category: settings.bingoCategory || '랜덤'
      }
    };

    await update(ref(db, `sessions/${sessionId}`), updates);
    await this.addLog(sessionId, `빙고 시트 준비 단계가 시작되었습니다.`, 'success');
  },

  async submitBingoBoard(sessionId: string, playerId: string, board: string[][], totalPlayers: number) {
    if (!db) return;
    await set(ref(db, `sessions/${sessionId}/bingoGame/boards/${playerId}`), board);

    // Check if all players have submitted
    const snapshot = await get(ref(db, `sessions/${sessionId}/bingoGame/boards`));
    const boards = snapshot.val() || {};
    const submittedCount = Object.keys(boards).length;

    if (submittedCount >= totalPlayers) {
      // Fetch current session data to get players and turnOrder
      const sessionSnap = await get(ref(db, `sessions/${sessionId}`));
      const sessionData = sessionSnap.val();
      if (sessionData) {
        const players = sessionData.players;
        // Generate turn order if not exists
        let turnOrder = sessionData.turnOrder;
        if (!turnOrder) {
          turnOrder = Object.keys(players).sort(() => Math.random() - 0.5);
          await update(ref(db, `sessions/${sessionId}`), { turnOrder });
        }
        await this.startBingoGame(sessionId, players, turnOrder);
      }
    }
  },

  async startBingoGame(sessionId: string, players: Record<string, Player>, turnOrder: string[]) {
    if (!db || !players) return;
    
    // Shuffle turnOrder for fairness
    const playerIds = Object.keys(players || {}).filter(id => !players[id]?.isSpectator);
    const shuffledOrder = [...playerIds].sort(() => Math.random() - 0.5);
    
    const updates: any = {
      status: SessionStatus.PLAYING,
      turnOrder: shuffledOrder,
      'bingoGame/currentPlayerId': shuffledOrder[0]
    };

    await update(ref(db, `sessions/${sessionId}`), updates);
    await this.addLog(sessionId, `모든 플레이어가 준비를 마쳤습니다. 빙고 시트를 시작합니다!`, 'success');
  },

  async pickBingoWord(sessionId: string, playerId: string, word: string, session: Session) {
    if (!db || !session.bingoGame) return;
    
    const game = session.bingoGame;
    if (game.currentPlayerId !== playerId) return;
    
    const currentMarkedWords = game.markedWords || [];
    if (currentMarkedWords.includes(word)) return;

    const newMarkedWords = [...currentMarkedWords, word];
    const updates: any = {};
    updates['bingoGame/markedWords'] = newMarkedWords;

    // Check for winners
    const winners: string[] = [];
    Object.entries(game.boards || {}).forEach(([pid, board]) => {
      const lines = this.countBingoLines(board, newMarkedWords);
      if (lines >= game.targetLines) {
        winners.push(pid);
      }
    });

    if (winners.length > 0) {
      updates['bingoGame/winner'] = winners[0]; // First one detected
      updates['status'] = SessionStatus.SUMMARY;
      
      const player = session.players?.[playerId]?.nickname || '알 수 없는 플레이어';
      await this.addLog(sessionId, `${player}님이 [${word}] 단어를 선택했습니다.`);
      await this.addLog(sessionId, `${session.players?.[winners[0]]?.nickname || '알 수 없는 플레이어'}님이 빙고를 완성하여 승리했습니다!`, 'success');
      await this.updateStats(sessionId, winners[0]);
    } else {
      // Next turn
      const turnOrder = session.turnOrder || Object.keys(session.players || {});
      const currentIndex = turnOrder.indexOf(playerId);
      const nextIndex = (currentIndex + 1) % turnOrder.length;
      updates['bingoGame/currentPlayerId'] = turnOrder[nextIndex];
      
      const player = session.players?.[playerId]?.nickname || '알 수 없는 플레이어';
      await this.addLog(sessionId, `${player}님이 [${word}] 단어를 선택했습니다.`);
    }

    await update(ref(db, `sessions/${sessionId}`), updates);
  },

  async startDrawGame(sessionId: string, players: Record<string, Player>, settings: any, turnOrder: string[]) {
    if (!db || !players) return;
    
    const playerIds = Object.keys(players || {}).filter(id => !players[id]?.isSpectator);
    const shuffledOrder = [...playerIds].sort(() => Math.random() - 0.5);
    
    const category = settings.drawCategory || '랜덤';
    let words: string[] = [];
    if (category === '랜덤') {
      words = DRAW_TOPICS.flatMap(t => t.words);
    } else {
      words = DRAW_TOPICS.find(t => t.category === category)?.words || [];
    }
    const secretWord = words[Math.floor(Math.random() * words.length)];

    const drawGame: DrawGameState = {
      presenterId: shuffledOrder[0],
      word: secretWord,
      category: category,
      canvasData: '',
      round: 1,
      maxRounds: settings.drawRounds || 3,
      timer: settings.drawTime || 60,
      scores: {}
    };

    // Initialize scores
    shuffledOrder.forEach(pid => {
      drawGame.scores[pid] = 0;
    });

    const updates: any = {
      status: SessionStatus.PLAYING,
      drawGame,
      turnOrder: shuffledOrder
    };

    await update(ref(db, `sessions/${sessionId}`), updates);
    await this.addLog(sessionId, `비주얼 브리핑(캐치마인드) 시트가 시작되었습니다.`, 'success');
  },

  async updateDrawCanvas(sessionId: string, canvasData: string) {
    if (!db) return;
    await set(ref(db, `sessions/${sessionId}/drawGame/canvasData`), canvasData);
  },

  async updateDrawTimer(sessionId: string, timer: number) {
    if (!db) return;
    await set(ref(db, `sessions/${sessionId}/drawGame/timer`), timer);
  },

  async passDrawTurn(sessionId: string, session: Session) {
    if (!db || !session.drawGame) return;
    await this.nextDrawTurn(sessionId, session);
  },

  async submitDrawGuess(sessionId: string, playerId: string, guess: string, session: Session) {
    if (!db || !session.drawGame) return;
    
    const game = session.drawGame;
    if (playerId === game.presenterId) return; // Presenter cannot guess

    if (guess.trim() === game.word) {
      // Correct!
      const updates: any = {};
      const newScores = { ...game.scores };
      newScores[playerId] = (newScores[playerId] || 0) + 10; // Guesser gets 10
      newScores[game.presenterId] = (newScores[game.presenterId] || 0) + 5; // Presenter gets 5

      updates['drawGame/scores'] = newScores;
      updates['drawGame/lastGuesserId'] = playerId;
      
      const player = session.players?.[playerId]?.nickname || '알 수 없는 플레이어';
      await this.addLog(sessionId, `${player}님이 정답 [${game.word}]을 맞혔습니다! (+10점)`, 'success');
      await this.updateStats(sessionId, playerId, 10);
      await this.updateStats(sessionId, game.presenterId, 5);

      // Move to next turn or end
      await this.nextDrawTurn(sessionId, session, newScores);
    } else {
      // Incorrect guess - Log it or send a message
      const player = session.players?.[playerId]?.nickname || '알 수 없는 플레이어';
      // We can add a log or just a chat message. Let's add a system message to chat for better visibility
      await this.sendMessage(sessionId, playerId, player, `오답: ${guess}`, false, false);
    }
  },

  async nextDrawTurn(sessionId: string, session: Session, currentScores?: Record<string, number>) {
    if (!db || !session.drawGame) return;
    
    const game = session.drawGame;
    const turnOrder = session.turnOrder || Object.keys(session.players || {});
    const currentIndex = turnOrder.indexOf(game.presenterId);
    let nextIndex = (currentIndex + 1) % turnOrder.length;
    let nextRound = game.round;

    if (nextIndex === 0) {
      nextRound++;
    }

    if (nextRound > game.maxRounds) {
      // End game
      const updates: any = {
        status: SessionStatus.SUMMARY
      };
      await update(ref(db, `sessions/${sessionId}`), updates);
    } else {
      // Next presenter
      const category = game.category;
      let words: string[] = [];
      if (category === '랜덤') {
        words = DRAW_TOPICS.flatMap(t => t.words);
      } else {
        words = DRAW_TOPICS.find(t => t.category === category)?.words || [];
      }
      const secretWord = words[Math.floor(Math.random() * words.length)];

      const updates: any = {
        'drawGame/presenterId': turnOrder[nextIndex],
        'drawGame/word': secretWord,
        'drawGame/canvasData': '', // Clear canvas
        'drawGame/round': nextRound,
        'drawGame/lastGuesserId': null,
        'drawGame/timer': session.settings.drawTime || 60
      };
      if (currentScores) {
        updates['drawGame/scores'] = currentScores;
      }
      await update(ref(db, `sessions/${sessionId}`), updates);
    }
  },

  countBingoLines(board: any, markedWords: string[]) {
    let lines = 0;
    if (!board) return 0;
    
    // Ensure board is 2D array
    const b = (Array.isArray(board) ? board : Object.values(board)).map((row: any) => 
      Array.isArray(row) ? row : Object.values(row)
    );
    const marked = markedWords || [];

    // Rows
    for (let i = 0; i < 5; i++) {
      if (b[i] && b[i].every(word => marked.includes(word))) lines++;
    }

    // Columns
    for (let i = 0; i < 5; i++) {
      let colMarked = true;
      for (let j = 0; j < 5; j++) {
        if (!b[j] || !marked.includes(b[j][i])) {
          colMarked = false;
          break;
        }
      }
      if (colMarked) lines++;
    }

    // Diagonals
    let diag1Marked = true;
    let diag2Marked = true;
    for (let i = 0; i < 5; i++) {
      if (!b[i] || !marked.includes(b[i][i])) diag1Marked = false;
      if (!b[i] || !marked.includes(b[i][4 - i])) diag2Marked = false;
    }
    if (diag1Marked) lines++;
    if (diag2Marked) lines++;

    return lines;
  },

  async placeOmokStone(sessionId: string, playerId: string, x: number, y: number) {
    if (!db) return;
    
    const sessionRef = ref(db, `sessions/${sessionId}`);
    const snapshot = await get(sessionRef);
    const session = snapshot.val();
    if (!session || !session.omokGame) return;
    
    const game = session.omokGame;
    if (game.currentPlayerId !== playerId) return;
    
    const boardMatrix = this.ensureOmokMatrix(game.board);
    if (boardMatrix[y][x] !== 0) return;

    const isBlack = String(playerId).trim() === String(game.blackPlayerId).trim();
    const stone = isBlack ? 1 : 2;
    
    boardMatrix[y][x] = stone;
    
    // Check for forbidden moves (Black only)
    if (isBlack) {
      const forbidden = this.checkOmokForbiddenMove(boardMatrix, x, y, stone);
      if (forbidden) {
        await this.addLog(sessionId, `흑돌은 ${forbidden} 금지 수입니다.`, 'error');
        return;
      }
    }
    
    // Check Win
    const winInfo = this.checkOmokWin(boardMatrix, x, y, stone, isBlack);
    
    const updates: any = {};
    updates[`omokGame/board/${y}/${x}`] = stone;
    updates['omokGame/lastMove'] = { x, y };
    updates['omokGame/moveCount'] = (game.moveCount || 0) + 1;
    
    const nextPlayerId = isBlack ? game.whitePlayerId : game.blackPlayerId;

    if (winInfo) {
      updates['omokGame/winner'] = playerId;
      updates['omokGame/winningLine'] = winInfo;
      updates['status'] = SessionStatus.SUMMARY;

      // Record leaderboard if won against AI at max difficulty (Level 7)
      if (game.isAIMatch && game.difficulty === 7 && playerId !== 'AI') {
        const startTime = game.startTime || Date.now();
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        const moveCount = (game.moveCount || 0) + 1;
        // Score calculation: Base 100,000 - time penalty - move penalty
        const score = Math.max(1000, 100000 - (timeTaken * 10) - (moveCount * 200));
        updates['omokGame/lastScore'] = score;
        
        const player = session.players?.[playerId];
        if (player) {
          this.recordLeaderboard(sessionId, 'OMOK_AI', playerId, player.nickname, score, {
            timeTaken,
            moveCount,
            difficulty: 7
          });
        }
      }
    } else {
      // Check Draw (Board full)
      const isFull = boardMatrix.every((row: any) => row.every((cell: any) => cell !== 0));
      if (isFull) {
        updates['omokGame/isDraw'] = true;
        updates['status'] = SessionStatus.SUMMARY;
      } else {
        updates['omokGame/currentPlayerId'] = nextPlayerId;
        // Trigger AI if next player is AI
        if (nextPlayerId === 'AI') {
          setTimeout(() => {
            this.processOmokAIMove(sessionId);
          }, 1000);
        }
      }
    }

    await update(sessionRef, updates);
    const playerName = playerId === 'AI' ? 'AI 봇' : (session.players?.[playerId]?.nickname || '알 수 없는 플레이어');
    await this.addLog(sessionId, `${playerName}님이 (${x}, ${y}) 위치에 돌을 놓았습니다.`);
    
    if (updates['omokGame/winner']) {
      await this.addLog(sessionId, `${playerName}님이 오목 대전에서 승리했습니다!`, 'success');
      if (playerId !== 'AI') await this.updateStats(sessionId, playerId);
    }
    
    if (updates['omokGame/isDraw']) await this.addLog(sessionId, `오목 대전이 무승부로 종료되었습니다.`, 'warning');
  },

  async processOmokAIMove(sessionId: string) {
    if (!db) return;
    const snapshot = await get(ref(db, `sessions/${sessionId}`));
    const session = snapshot.val();
    if (!session || !session.omokGame || session.omokGame.currentPlayerId !== 'AI') return;

    const game = session.omokGame;
    const board = this.ensureOmokMatrix(game.board);
    const isBlack = game.blackPlayerId === 'AI';
    const aiStone = isBlack ? 1 : 2;
    const playerStone = isBlack ? 2 : 1;
    const difficulty = game.difficulty || 1;

    let bestMove = { x: 7, y: 7 };
    
    if (game.moveCount === 0) {
      bestMove = { x: 7, y: 7 };
    } else {
      bestMove = this.getOmokBestMove(board, aiStone, playerStone, difficulty);
    }

    await this.placeOmokStone(sessionId, 'AI', bestMove.x, bestMove.y);
  },

  getOmokBestMove(board: number[][], aiStone: number, playerStone: number, difficulty: number) {
    // For high difficulty, use Minimax
    if (difficulty >= 6) {
      const depth = difficulty === 7 ? 4 : 2;
      return this.omokMinimaxSearch(board, aiStone, playerStone, depth);
    }

    let maxScore = -1;
    let candidates: {x: number, y: number}[] = [];

    // Optimization: only check points near existing stones
    const searchPoints = this.getOmokSearchPoints(board);

    for (const {x, y} of searchPoints) {
      // For black AI, check forbidden moves
      if (aiStone === 1 && this.checkOmokForbiddenMove(board, x, y, 1)) continue;

      const attackScore = this.evaluateOmokPoint(board, x, y, aiStone);
      const defenseScore = this.evaluateOmokPoint(board, x, y, playerStone);
      
      // Weighting based on difficulty
      let score = 0;
      if (difficulty >= 4) {
        score = attackScore * 1.2 + defenseScore;
      } else if (difficulty >= 2) {
        score = attackScore * 1.0 + defenseScore * 0.8;
      } else {
        score = attackScore * 0.8 + defenseScore * 0.5;
      }
      
      // Add some randomness for lower levels
      if (difficulty === 1) score += Math.random() * 100;
      else if (difficulty === 2) score += Math.random() * 50;
      else if (difficulty === 3) score += Math.random() * 20;
      
      if (score > maxScore) {
        maxScore = score;
        candidates = [{ x, y }];
      } else if (score === maxScore) {
        candidates.push({ x, y });
      }
    }

    if (candidates.length === 0) {
       return { x: 7, y: 7 };
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
  },

  getOmokSearchPoints(board: number[][]) {
    const points: {x: number, y: number}[] = [];
    const visited = Array(15).fill(0).map(() => Array(15).fill(false));
    
    let hasStones = false;
    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        if (board[y][x] !== 0) {
          hasStones = true;
          // Check 2-cell radius
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && nx < 15 && ny >= 0 && ny < 15 && board[ny][nx] === 0 && !visited[ny][nx]) {
                visited[ny][nx] = true;
                points.push({ x: nx, y: ny });
              }
            }
          }
        }
      }
    }
    
    if (!hasStones) return [{ x: 7, y: 7 }];
    return points;
  },

  omokMinimaxSearch(board: number[][], aiStone: number, playerStone: number, depth: number) {
    let bestMove = { x: 7, y: 7 };
    let bestValue = -Infinity;

    const points = this.getOmokSearchPoints(board);
    // Sort points by heuristic to improve pruning
    points.sort((a, b) => {
      const scoreA = this.evaluateOmokPoint(board, a.x, a.y, aiStone) + this.evaluateOmokPoint(board, a.x, a.y, playerStone);
      const scoreB = this.evaluateOmokPoint(board, b.x, b.y, aiStone) + this.evaluateOmokPoint(board, b.x, b.y, playerStone);
      return scoreB - scoreA;
    });

    for (const {x, y} of points) {
      if (aiStone === 1 && this.checkOmokForbiddenMove(board, x, y, 1)) continue;
      
      board[y][x] = aiStone;
      const val = this.minimax(board, depth - 1, -Infinity, Infinity, false, aiStone, playerStone);
      board[y][x] = 0;

      if (val > bestValue) {
        bestValue = val;
        bestMove = { x, y };
      }
    }

    return bestMove;
  },

  minimax(board: number[][], depth: number, alpha: number, beta: number, isMaximizing: boolean, aiStone: number, playerStone: number) {
    const score = this.evaluateOmokBoard(board, aiStone, playerStone);
    
    if (depth === 0 || Math.abs(score) > 50000) {
      return score;
    }

    const points = this.getOmokSearchPoints(board);
    // Limit search points for performance
    const limit = depth > 2 ? 15 : points.length;
    const sortedPoints = points.sort((a, b) => {
      const sA = this.evaluateOmokPoint(board, a.x, a.y, aiStone) + this.evaluateOmokPoint(board, a.x, a.y, playerStone);
      const sB = this.evaluateOmokPoint(board, b.x, b.y, aiStone) + this.evaluateOmokPoint(board, b.x, b.y, playerStone);
      return sB - sA;
    }).slice(0, limit);

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const {x, y} of sortedPoints) {
        if (aiStone === 1 && this.checkOmokForbiddenMove(board, x, y, 1)) continue;
        board[y][x] = aiStone;
        const ev = this.minimax(board, depth - 1, alpha, beta, false, aiStone, playerStone);
        board[y][x] = 0;
        maxEval = Math.max(maxEval, ev);
        alpha = Math.max(alpha, ev);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const {x, y} of sortedPoints) {
        if (playerStone === 1 && this.checkOmokForbiddenMove(board, x, y, 1)) continue;
        board[y][x] = playerStone;
        const ev = this.minimax(board, depth - 1, alpha, beta, true, aiStone, playerStone);
        board[y][x] = 0;
        minEval = Math.min(minEval, ev);
        beta = Math.min(beta, ev);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  },

  evaluateOmokBoard(board: number[][], aiStone: number, playerStone: number) {
    let aiScore = 0;
    let playerScore = 0;

    for (let y = 0; y < 15; y++) {
      for (let x = 0; x < 15; x++) {
        if (board[y][x] === aiStone) {
          aiScore += this.evaluateOmokPoint(board, x, y, aiStone);
        } else if (board[y][x] === playerStone) {
          playerScore += this.evaluateOmokPoint(board, x, y, playerStone);
        }
      }
    }

    return aiScore - playerScore * 1.2; // Favor defense slightly more for "really difficult" feel
  },

  evaluateOmokPoint(board: number[][], x: number, y: number, stone: number) {
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    let totalScore = 0;

    for (const [dx, dy] of directions) {
      let leftBlock = false;
      let rightBlock = false;
      let leftCount = 0;
      let rightCount = 0;

      // Forward
      for (let i = 1; i < 5; i++) {
        const nx = x + dx * i, ny = y + dy * i;
        if (nx < 0 || nx >= 15 || ny < 0 || ny >= 15) {
          rightBlock = true;
          break;
        }
        if (board[ny][nx] === stone) rightCount++;
        else if (board[ny][nx] === 0) break;
        else {
          rightBlock = true;
          break;
        }
      }
      
      // Backward
      for (let i = 1; i < 5; i++) {
        const nx = x - dx * i, ny = y - dy * i;
        if (nx < 0 || nx >= 15 || ny < 0 || ny >= 15) {
          leftBlock = true;
          break;
        }
        if (board[ny][nx] === stone) leftCount++;
        else if (board[ny][nx] === 0) break;
        else {
          leftBlock = true;
          break;
        }
      }

      const count = leftCount + rightCount + 1;
      const block = (leftBlock ? 1 : 0) + (rightBlock ? 1 : 0);

      totalScore += this.getOmokPatternScore(count, block);
    }

    return totalScore;
  },

  getOmokPatternScore(count: number, block: number) {
    if (count >= 5) return 1000000; // Win
    if (block === 0) {
      if (count === 4) return 100000; // Open 4
      if (count === 3) return 10000;  // Open 3
      if (count === 2) return 1000;   // Open 2
      if (count === 1) return 100;
    } else if (block === 1) {
      if (count === 4) return 10000;  // Closed 4
      if (count === 3) return 1000;   // Closed 3
      if (count === 2) return 100;    // Closed 2
      if (count === 1) return 10;
    }
    return 0;
  },

  ensureOmokMatrix(data: any) {
    const matrix = Array(15).fill(0).map(() => Array(15).fill(0));
    if (!data) return matrix;
    const rows = Array.isArray(data) ? data : Object.values(data);
    const rowKeys = Array.isArray(data) ? null : Object.keys(data);
    
    rows.forEach((row: any, ri: number) => {
      const actualRowIdx = rowKeys ? parseInt(rowKeys[ri]) : ri;
      if (actualRowIdx >= 15) return;
      
      const cells = Array.isArray(row) ? row : Object.values(row);
      const cellKeys = Array.isArray(row) ? null : Object.keys(row);
      
      cells.forEach((cell: any, ci: number) => {
        const actualCellIdx = cellKeys ? parseInt(cellKeys[ci]) : ci;
        if (actualCellIdx >= 15) return;
        matrix[actualRowIdx][actualCellIdx] = parseInt(String(cell)) || 0;
      });
    });
    return matrix;
  },

  checkOmokForbiddenMove(board: number[][], x: number, y: number, stone: number) {
    if (this.checkOmokOverline(board, x, y, stone)) return '장목(6목 이상)';
    if (this.checkOmokDoubleFour(board, x, y, stone)) return '4-4';
    if (this.checkOmokDoubleThree(board, x, y, stone)) return '3-3';
    return null;
  },

  checkOmokOverline(board: number[][], x: number, y: number, stone: number) {
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (const [dx, dy] of directions) {
      let count = 1;
      // Forward
      for (let i = 1; i < 7; i++) {
        const nx = x + dx * i, ny = y + dy * i;
        if (nx < 0 || nx >= 15 || ny < 0 || ny >= 15 || board[ny][nx] !== stone) break;
        count++;
      }
      // Backward
      for (let i = 1; i < 7; i++) {
        const nx = x - dx * i, ny = y - dy * i;
        if (nx < 0 || nx >= 15 || ny < 0 || ny >= 15 || board[ny][nx] !== stone) break;
        count++;
      }
      if (count > 5) return true;
    }
    return false;
  },

  checkOmokDoubleFour(board: number[][], x: number, y: number, stone: number) {
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    let fourCount = 0;

    for (const [dx, dy] of directions) {
      let createdWinPoints = 0;
      // Check all empty spots in this line
      for (let i = -4; i <= 4; i++) {
        if (i === 0) continue;
        const nx = x + dx * i, ny = y + dy * i;
        if (nx < 0 || nx >= 15 || ny < 0 || ny >= 15 || board[ny][nx] !== 0) continue;
        
        // If we place a stone at (nx, ny), do we get exactly 5?
        board[ny][nx] = stone;
        if (this.isFive(board, nx, ny, stone)) {
          createdWinPoints++;
        }
        board[ny][nx] = 0;
        if (createdWinPoints > 0) break; 
      }
      if (createdWinPoints > 0) fourCount++;
    }

    return fourCount >= 2;
  },

  checkOmokDoubleThree(board: number[][], x: number, y: number, stone: number) {
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    let openThreeCount = 0;

    for (const [dx, dy] of directions) {
      if (this.isOpenThree(board, x, y, dx, dy, stone)) {
        openThreeCount++;
      }
    }
    return openThreeCount >= 2;
  },

  isOpenThree(board: number[][], x: number, y: number, dx: number, dy: number, stone: number) {
    // An Open Three is a move that creates a "Three" which can become an "Open Four"
    // An Open Four is a 4-stone line that can become a 5 from either end.
    
    // Check all empty spots in this line
    for (let i = -4; i <= 4; i++) {
      if (i === 0) continue;
      const nx = x + dx * i, ny = y + dy * i;
      if (nx < 0 || nx >= 15 || ny < 0 || ny >= 15 || board[ny][nx] !== 0) continue;
      
      // If we place a stone at (nx, ny), does it become an OPEN FOUR?
      board[ny][nx] = stone;
      if (this.isOpenFour(board, nx, ny, dx, dy, stone)) {
        // But wait, it must not be a forbidden move itself (like 4-4 or overline)
        // Actually, the rule is simpler: can it become a 5?
        board[ny][nx] = 0;
        return true;
      }
      board[ny][nx] = 0;
    }
    return false;
  },

  isOpenFour(board: number[][], x: number, y: number, dx: number, dy: number, stone: number) {
    // Already has 4 stones including (x,y)
    // Must have TWO win points in this direction
    let winPoints = 0;
    for (let i = -4; i <= 4; i++) {
      if (i === 0) continue;
      const nx = x + dx * i, ny = y + dy * i;
      if (nx < 0 || nx >= 15 || ny < 0 || ny >= 15 || board[ny][nx] !== 0) continue;
      
      board[ny][nx] = stone;
      if (this.isFive(board, nx, ny, stone)) {
        winPoints++;
      }
      board[ny][nx] = 0;
    }
    return winPoints >= 2;
  },

  isFive(board: number[][], x: number, y: number, stone: number) {
    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    for (const [dx, dy] of directions) {
      let count = 1;
      for (let i = 1; i < 5; i++) {
        const nx = x + dx * i, ny = y + dy * i;
        if (nx < 0 || nx >= 15 || ny < 0 || ny >= 15 || board[ny][nx] !== stone) break;
        count++;
      }
      for (let i = 1; i < 5; i++) {
        const nx = x - dx * i, ny = y - dy * i;
        if (nx < 0 || nx >= 15 || ny < 0 || ny >= 15 || board[ny][nx] !== stone) break;
        count++;
      }
      if (count === 5) return true;
    }
    return false;
  },

  checkOmokWin(board: number[][], x: number, y: number, stone: number, isBlack: boolean) {
    const directions = [
      [1, 0],  // Horizontal
      [0, 1],  // Vertical
      [1, 1],  // Diagonal \
      [1, -1]  // Diagonal /
    ];

    for (const [dx, dy] of directions) {
      let count = 1;
      const line = [{x, y}];

      // Check forward
      let i = 1;
      while (true) {
        const nx = x + dx * i;
        const ny = y + dy * i;
        if (ny < 0 || ny >= 15 || nx < 0 || nx >= 15 || board[ny][nx] !== stone) break;
        count++;
        line.push({x: nx, y: ny});
        i++;
      }

      // Check backward
      i = 1;
      while (true) {
        const nx = x - dx * i;
        const ny = y - dy * i;
        if (ny < 0 || ny >= 15 || nx < 0 || nx >= 15 || board[ny][nx] !== stone) break;
        count++;
        line.push({x: nx, y: ny});
        i++;
      }

      // Official Rules:
      // Black: Wins ONLY on exactly 5. (Overline is forbidden, so >5 shouldn't happen if checked properly, but strictly >5 is not a win)
      // White: Wins on 5 or more.
      if (isBlack) {
        if (count === 5) return line;
      } else {
        if (count >= 5) return line;
      }
    }
    return null;
  },

  // --- Minesweeper ---
  async startMinesweeperGame(sessionId: string, difficulty: 'EASY' | 'MEDIUM' | 'HARD') {
    if (!db) return;
    
    let rows = 9, cols = 9, mines = 10;
    if (difficulty === 'MEDIUM') { rows = 16; cols = 16; mines = 40; }
    if (difficulty === 'HARD') { rows = 16; cols = 30; mines = 99; }

    const board = Array(rows).fill(null).map(() => 
      Array(cols).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0
      }))
    );

    // Place mines
    let placed = 0;
    while (placed < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      if (!board[r][c].isMine) {
        board[r][c].isMine = true;
        placed++;
      }
    }

    // Calculate neighbors
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (board[r][c].isMine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) {
              count++;
            }
          }
        }
        board[r][c].neighborMines = count;
      }
    }

    const minesweeperGame: any = {
      board,
      status: 'PLAYING',
      difficulty,
      mineCount: mines,
      revealedCount: 0,
      startTime: Date.now()
    };

    await update(ref(db, `sessions/${sessionId}`), {
      status: SessionStatus.PLAYING,
      minesweeperGame
    });
    await this.addLog(sessionId, `지뢰 찾기(데이터 오류 검수) 시트가 시작되었습니다.`, 'success');
  },

  async recordLeaderboard(sessionId: string, gameType: string, playerId: string, nickname: string, score: number, extraData: any = {}) {
    if (!db) return;
    const leaderboardRef = ref(db, `leaderboards/${gameType}`);
    const snapshot = await get(leaderboardRef);
    let leaderboard = snapshot.val() || [];
    if (!Array.isArray(leaderboard)) leaderboard = Object.values(leaderboard);

    // Check if player already exists
    const existingIndex = leaderboard.findIndex((e: any) => e.playerId === playerId);
    
    if (existingIndex !== -1) {
      // Only update if the new score is better
      if (score > leaderboard[existingIndex].score) {
        leaderboard[existingIndex] = {
          playerId,
          nickname,
          score,
          timestamp: Date.now(),
          ...extraData
        };
      } else {
        // No need to update if score is not better
        return;
      }
    } else {
      // Add new entry
      leaderboard.push({
        playerId,
        nickname,
        score,
        timestamp: Date.now(),
        ...extraData
      });
    }

    // Sort by score descending
    leaderboard.sort((a: any, b: any) => b.score - a.score);

    // Keep top 10
    leaderboard = leaderboard.slice(0, 10);

    await set(leaderboardRef, leaderboard);
  },

  async removeLeaderboardEntry(sessionId: string, gameType: string, index: number) {
    if (!db) return;
    const leaderboardRef = ref(db, `leaderboards/${gameType}`);
    const snapshot = await get(leaderboardRef);
    let leaderboard = snapshot.val() || [];
    if (!Array.isArray(leaderboard)) leaderboard = Object.values(leaderboard);

    if (index >= 0 && index < leaderboard.length) {
      leaderboard.splice(index, 1);
      await set(leaderboardRef, leaderboard);
    }
  },

  subscribeToGlobalLeaderboards(callback: (leaderboards: Record<string, LeaderboardEntry[]>) => void) {
    if (!isConfigured || !db) return () => {};
    const leaderboardsRef = ref(db, 'leaderboards');
    return onValue(leaderboardsRef, (snapshot) => {
      callback(snapshot.val() || {});
    });
  },

  async revealMinesweeperCell(sessionId: string, r: number, c: number, session: Session) {
    if (!db || !session.minesweeperGame || session.minesweeperGame.status !== 'PLAYING') return;
    
    const game = JSON.parse(JSON.stringify(session.minesweeperGame));
    // Ensure board is 2D array
    game.board = (Array.isArray(game.board) ? game.board : Object.values(game.board)).map((row: any) => 
      Array.isArray(row) ? row : Object.values(row)
    );
    const board = game.board;
    
    if (board[r][c].isRevealed || board[r][c].isFlagged) return;

    if (board[r][c].isMine) {
      game.status = 'LOST';
      // Reveal all mines
      board.forEach((row: any) => row.forEach((cell: any) => { if (cell.isMine) cell.isRevealed = true; }));
      await this.addLog(sessionId, `지뢰(데이터 오류)를 밟았습니다! 시트 오버.`, 'warning');
    } else {
      const reveal = (row: number, col: number) => {
        if (row < 0 || row >= board.length || col < 0 || col >= board[0].length || board[row][col].isRevealed || board[row][col].isFlagged) return;
        board[row][col].isRevealed = true;
        game.revealedCount++;
        if (board[row][col].neighborMines === 0) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              reveal(row + dr, col + dc);
            }
          }
        }
      };
      reveal(r, c);

      const totalCells = board.length * board[0].length;
      if (game.revealedCount === totalCells - game.mineCount) {
        game.status = 'WON';
        await this.addLog(sessionId, `모든 지뢰를 성공적으로 찾아냈습니다!`, 'success');
        
        // Record leaderboard
        const timeTaken = Date.now() - (game.startTime || Date.now());
        const difficultyBonus = { 'EASY': 1000, 'MEDIUM': 5000, 'HARD': 15000 }[game.difficulty as 'EASY' | 'MEDIUM' | 'HARD'];
        const score = Math.max(0, difficultyBonus + 100000 - Math.floor(timeTaken / 10));
        const user = auth?.currentUser;
        if (user && session.players?.[user.uid]) {
          await this.recordLeaderboard(sessionId, 'MINESWEEPER', user.uid, session.players[user.uid]?.nickname || '플레이어', score);
        } else {
          await this.recordLeaderboard(sessionId, 'MINESWEEPER', session.players?.[session.hostId]?.id || '', session.players?.[session.hostId]?.nickname || '', score);
        }
      }
    }

    await update(ref(db, `sessions/${sessionId}`), { minesweeperGame: game });
  },

  async flagMinesweeperCell(sessionId: string, r: number, c: number, session: Session) {
    if (!db || !session.minesweeperGame || session.minesweeperGame.status !== 'PLAYING') return;
    const game = JSON.parse(JSON.stringify(session.minesweeperGame));
    
    // Ensure board is 2D array
    game.board = (Array.isArray(game.board) ? game.board : Object.values(game.board)).map((row: any) => 
      Array.isArray(row) ? row : Object.values(row)
    );
    
    game.board[r][c].isFlagged = !game.board[r][c].isFlagged;
    
    // Update mineCount display
    let flags = 0;
    game.board.forEach((row: any) => row.forEach((cell: any) => { if (cell.isFlagged) flags++; }));
    const totalMines = { 'EASY': 10, 'MEDIUM': 40, 'HARD': 99 }[game.difficulty as 'EASY' | 'MEDIUM' | 'HARD'] || 10;
    game.mineCount = totalMines - flags;

    await update(ref(db, `sessions/${sessionId}`), { minesweeperGame: game });
  },

  async chordMinesweeperCell(sessionId: string, r: number, c: number, session: Session) {
    if (!db || !session.minesweeperGame || session.minesweeperGame.status !== 'PLAYING') return;
    
    const game = JSON.parse(JSON.stringify(session.minesweeperGame));
    game.board = (Array.isArray(game.board) ? game.board : Object.values(game.board)).map((row: any) => 
      Array.isArray(row) ? row : Object.values(row)
    );
    const board = game.board;
    const rows = board.length;
    const cols = board[0].length;
    
    if (!board[r][c].isRevealed || board[r][c].neighborMines === 0) return;

    // Count flags around the cell
    let flagCount = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isFlagged) {
          flagCount++;
        }
      }
    }

    // If flag count matches neighbor mines, reveal all non-flagged neighbors
    if (flagCount === board[r][c].neighborMines) {
      let hitMine = false;
      const reveal = (row: number, col: number) => {
        if (row < 0 || row >= rows || col < 0 || col >= cols || board[row][col].isRevealed || board[row][col].isFlagged) return;
        
        if (board[row][col].isMine) {
          hitMine = true;
          return;
        }

        board[row][col].isRevealed = true;
        game.revealedCount++;
        if (board[row][col].neighborMines === 0) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              reveal(row + dr, col + dc);
            }
          }
        }
      };

      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          reveal(r + dr, c + dc);
        }
      }

      if (hitMine) {
        game.status = 'LOST';
        board.forEach((row: any) => row.forEach((cell: any) => { if (cell.isMine) cell.isRevealed = true; }));
        await this.addLog(sessionId, `잘못된 검수로 지뢰(데이터 오류)가 폭발했습니다!`, 'warning');
      } else {
        const totalCells = rows * cols;
        if (game.revealedCount === totalCells - game.mineCount) {
          game.status = 'WON';
          await this.addLog(sessionId, `모든 지뢰를 성공적으로 찾아냈습니다!`, 'success');
          
          const timeTaken = Date.now() - (game.startTime || Date.now());
          const difficultyBonus = { 'EASY': 1000, 'MEDIUM': 5000, 'HARD': 15000 }[game.difficulty as 'EASY' | 'MEDIUM' | 'HARD'];
          const score = Math.max(0, difficultyBonus + 100000 - Math.floor(timeTaken / 10));
          const user = auth?.currentUser;
          if (user && session.players?.[user.uid]) {
            await this.recordLeaderboard(sessionId, 'MINESWEEPER', user.uid, session.players[user.uid]?.nickname || '플레이어', score);
          }
        }
      }
      await update(ref(db, `sessions/${sessionId}`), { minesweeperGame: game });
    }
  },

  // --- Office 2048 ---
  async startOffice2048Game(sessionId: string) {
    if (!db) return;
    const board = Array(4).fill(null).map(() => Array(4).fill(0));
    this.addRandomTile(board);
    this.addRandomTile(board);

    const office2048Game: any = {
      board,
      score: 0,
      bestScore: 0,
      status: 'PLAYING'
    };

    await update(ref(db, `sessions/${sessionId}`), {
      status: SessionStatus.PLAYING,
      office2048Game
    });
    await this.addLog(sessionId, `직급 승진 2048 시트가 시작되었습니다.`, 'success');
  },

  addRandomTile(board: number[][]) {
    const empty = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (board[r][c] === 0) empty.push({r, c});
      }
    }
    if (empty.length > 0) {
      const {r, c} = empty[Math.floor(Math.random() * empty.length)];
      board[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
  },

  async moveOffice2048(sessionId: string, direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT', session: Session) {
    if (!db || !session.office2048Game || session.office2048Game.status !== 'PLAYING') return;
    
    const game = JSON.parse(JSON.stringify(session.office2048Game));
    // Ensure board is 2D array
    game.board = (Array.isArray(game.board) ? game.board : Object.values(game.board)).map((row: any) => 
      Array.isArray(row) ? row : Object.values(row)
    );
    const board = game.board;
    let moved = false;

    const rotate = (b: number[][]) => {
      const newB = Array(4).fill(null).map(() => Array(4).fill(0));
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          newB[c][3-r] = b[r][c];
        }
      }
      return newB;
    };

    let tempBoard = board;
    const rotations = { 'LEFT': 0, 'UP': 3, 'RIGHT': 2, 'DOWN': 1 }[direction];
    for (let i = 0; i < rotations; i++) tempBoard = rotate(tempBoard);

    for (let r = 0; r < 4; r++) {
      const row = tempBoard[r].filter((v: number) => v !== 0);
      for (let i = 0; i < row.length - 1; i++) {
        if (row[i] === row[i+1]) {
          row[i] *= 2;
          game.score += row[i];
          row.splice(i+1, 1);
          moved = true;
        }
      }
      const newRow = [...row, ...Array(4 - row.length).fill(0)];
      if (JSON.stringify(tempBoard[r]) !== JSON.stringify(newRow)) moved = true;
      tempBoard[r] = newRow;
    }

    for (let i = 0; i < (4 - rotations) % 4; i++) tempBoard = rotate(tempBoard);
    game.board = tempBoard;

    if (moved) {
      this.addRandomTile(game.board);
      // Check for game over
      let canMove = false;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (game.board[r][c] === 0) canMove = true;
          if (c < 3 && game.board[r][c] === game.board[r][c+1]) canMove = true;
          if (r < 3 && game.board[r][c] === game.board[r+1][c]) canMove = true;
        }
      }
      if (!canMove) {
        game.status = 'LOST';
        await this.addLog(sessionId, `더 이상 움직일 수 없습니다. 최종 점수: ${game.score}점`, 'warning');
        const user = auth?.currentUser;
        if (user && session.players?.[user.uid]) {
          await this.recordLeaderboard(sessionId, 'OFFICE_2048', user.uid, session.players[user.uid]?.nickname || '플레이어', game.score);
        } else {
          await this.recordLeaderboard(sessionId, 'OFFICE_2048', session.players?.[session.hostId]?.id || '', session.players?.[session.hostId]?.nickname || '', game.score);
        }
      }
      if (game.board.some((row: any) => row.includes(2048))) {
        game.status = 'WON';
        await this.addLog(sessionId, `축하합니다! 사장(2048)으로 승진했습니다!`, 'success');
        const user = auth?.currentUser;
        if (user && session.players?.[user.uid]) {
          await this.recordLeaderboard(sessionId, 'OFFICE_2048', user.uid, session.players[user.uid]?.nickname || '플레이어', game.score);
        } else {
          await this.recordLeaderboard(sessionId, 'OFFICE_2048', session.players?.[session.hostId]?.id || '', session.players?.[session.hostId]?.nickname || '', game.score);
        }
      }
      
      await update(ref(db, `sessions/${sessionId}`), { office2048Game: game });
    }
  },

  // --- Sudoku ---
  async startSudokuGame(sessionId: string, difficulty: 'EASY' | 'MEDIUM' | 'HARD') {
    if (!db) return;
    
    const solution = Array(9).fill(null).map(() => Array(9).fill(0));
    const fill = (r: number, c: number): boolean => {
      if (c === 9) { r++; c = 0; }
      if (r === 9) return true;
      const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
      for (const num of nums) {
        if (this.isSudokuSafe(solution, r, c, num)) {
          solution[r][c] = num;
          if (fill(r, c + 1)) return true;
          solution[r][c] = 0;
        }
      }
      return false;
    };
    fill(0, 0);

    const initialBoard = solution.map(row => [...row]);
    const removeCount = { 'EASY': 30, 'MEDIUM': 45, 'HARD': 60 }[difficulty];
    let removed = 0;
    while (removed < removeCount) {
      const r = Math.floor(Math.random() * 9);
      const c = Math.floor(Math.random() * 9);
      if (initialBoard[r][c] !== 0) {
        initialBoard[r][c] = 0;
        removed++;
      }
    }

    const sudokuGame: any = {
      initialBoard,
      currentBoard: initialBoard.map(row => [...row]),
      solution,
      difficulty,
      status: 'PLAYING',
      mistakes: 0
    };

    await update(ref(db, `sessions/${sessionId}`), {
      status: SessionStatus.PLAYING,
      sudokuGame
    });
    await this.addLog(sessionId, `스도쿠(데이터 검증) 시트가 시작되었습니다.`, 'success');
  },

  isSudokuSafe(board: number[][], r: number, c: number, num: number) {
    for (let i = 0; i < 9; i++) if (board[r][i] === num || board[i][c] === num) return false;
    const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (board[br + i][bc + j] === num) return false;
    return true;
  },

  async updateSudokuCell(sessionId: string, r: number, c: number, num: number, session: Session) {
    if (!db || !session.sudokuGame || session.sudokuGame.status !== 'PLAYING') return;
    
    const game = JSON.parse(JSON.stringify(session.sudokuGame));
    
    // Helper to ensure 9x9 matrix from Firebase object/array
    const ensureSudokuMatrix = (data: any) => {
      const matrix = Array(9).fill(0).map(() => Array(9).fill(0));
      if (!data) return matrix;
      const rows = Array.isArray(data) ? data : Object.values(data);
      rows.forEach((row: any, ri: number) => {
        if (ri >= 9) return;
        const cells = Array.isArray(row) ? row : Object.values(row);
        cells.forEach((cell: any, ci: number) => {
          if (ci >= 9) return;
          matrix[ri][ci] = cell || 0;
        });
      });
      return matrix;
    };

    game.initialBoard = ensureSudokuMatrix(game.initialBoard);
    game.currentBoard = ensureSudokuMatrix(game.currentBoard);
    game.solution = ensureSudokuMatrix(game.solution);
    
    if (game.initialBoard[r][c] !== 0) return;

    if (num !== 0 && num !== game.solution[r][c]) {
      game.mistakes++;
      await this.addLog(sessionId, `잘못된 숫자를 입력했습니다. (실수: ${game.mistakes}/3)`, 'warning');
      if (game.mistakes >= 3) {
        game.status = 'LOST';
        await this.addLog(sessionId, `실수 횟수 초과로 데이터 검증에 실패했습니다.`, 'error');
      }
    }
    
    game.currentBoard[r][c] = num;
    
    let won = true;
    if (game.status !== 'LOST') {
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          if (game.currentBoard[i][j] !== game.solution[i][j]) won = false;
        }
      }
    } else {
      won = false;
    }

    if (won) {
      game.status = 'WON';
      await this.addLog(sessionId, `스도쿠를 완벽하게 해결했습니다!`, 'success');
      
      // Record leaderboard
      const difficultyBonus = { 'EASY': 1000, 'MEDIUM': 5000, 'HARD': 15000 }[game.difficulty as 'EASY' | 'MEDIUM' | 'HARD'];
      const score = Math.max(0, difficultyBonus + 10000 - (game.mistakes * 1000));
      const user = auth?.currentUser;
      if (user && session.players?.[user.uid]) {
        await this.recordLeaderboard(sessionId, 'SUDOKU', user.uid, session.players[user.uid]?.nickname || '플레이어', score);
      } else {
        await this.recordLeaderboard(sessionId, 'SUDOKU', session.players?.[session.hostId]?.id || '', session.players?.[session.hostId]?.nickname || '', score);
      }
    }

    await update(ref(db, `sessions/${sessionId}`), { sudokuGame: game });
  },

  // --- Office Life ---
  async startOfficeLifeGame(sessionId: string, players: Record<string, Player>, turnOrder?: string[], mode: 'INDIVIDUAL' | 'TEAM' = 'INDIVIDUAL') {
    if (!db || !players) return;
    
    const order = turnOrder || Object.keys(players || {});
    const playerStates: Record<string, any> = {};
    
    order.forEach(pid => {
      playerStates[pid] = {
        position: 0,
        assets: 5000,
        teamId: mode === 'TEAM' ? (players[pid]?.teamId || 'TEAM_A') : 'INDIVIDUAL',
        items: [],
        isJailed: false,
        jailTurns: 0,
        rank: OFFICE_RANKS[0].name,
        rankIndex: 0,
        doubleCount: 0,
        hasDouble: false
      };
    });

    const officeLifeGame: OfficeLifeGameState = {
      playerStates,
      cells: {},
      currentTurnIndex: 0,
      turnOrder: order,
      status: 'PLAYING',
      waitingForAction: 'SELECT_ROLE'
    };

    await update(ref(db, `sessions/${sessionId}`), {
      status: SessionStatus.PLAYING,
      officeLifeGame
    });
    await this.addLog(sessionId, "오피스 라이프: 승진 대작전 프로젝트가 시작되었습니다!", "success");

    // Trigger AI if first player is AI
    const firstPlayerId = order[0];
    if (players[firstPlayerId]?.isAI) {
      const snapshot = await get(ref(db, `sessions/${sessionId}`));
      const session = snapshot.val();
      if (session) {
        await this.processOfficeLifeAITurn(sessionId, session);
      }
    }
  },

  async rollOfficeLifeDice(sessionId: string, playerId: string, session: Session) {
    if (!db || !session.officeLifeGame || session.officeLifeGame.status !== 'PLAYING') return;
    const game = JSON.parse(JSON.stringify(session.officeLifeGame)) as OfficeLifeGameState;
    const turnOrder = game.turnOrder || [];
    const currentPlayerId = turnOrder[game.currentTurnIndex || 0];
    
    if (currentPlayerId !== playerId) return;
    if (game.waitingForAction !== 'NONE' && game.waitingForAction !== undefined) return;
    
    const pState = game.playerStates?.[playerId];
    if (!pState) return;

    if (pState.isJailed) {
      pState.jailTurns++;
      if (pState.jailTurns >= 3) {
        pState.isJailed = false;
        pState.jailTurns = 0;
        await this.addLog(sessionId, `${session.players?.[playerId]?.nickname || '플레이어'}님이 경위서 작성을 마치고 복귀했습니다.`, 'info');
      } else {
        await this.addLog(sessionId, `${session.players?.[playerId]?.nickname || '플레이어'}님이 경위서를 작성 중입니다. (${pState.jailTurns}/3)`, 'warning');
        game.currentTurnIndex = (game.currentTurnIndex + 1) % (turnOrder.length || 1);
        await update(ref(db, `sessions/${sessionId}/officeLifeGame`), game);
        return;
      }
    }

    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const dice = dice1 + dice2;
    const isDouble = dice1 === dice2;
    game.lastDice = dice;
    
    if (isDouble) {
      pState.doubleCount = (pState.doubleCount || 0) + 1;
      if (pState.doubleCount >= 3) {
        pState.position = 10;
        pState.isJailed = true;
        pState.jailTurns = 0;
        pState.doubleCount = 0;
        pState.hasDouble = false;
        await this.addLog(sessionId, `🚨 3연속 더블! 과도한 업무(주사위 조작 의심)로 인해 감사팀으로 긴급 호출되었습니다!`, 'error');
        game.waitingForAction = 'END_TURN';
        await update(ref(db, `sessions/${sessionId}/officeLifeGame`), game);
        return;
      } else {
        pState.hasDouble = true;
        await this.addLog(sessionId, `🎲 더블! (${dice1}, ${dice2}) 보너스 턴을 획득했습니다!`, 'success');
      }
    } else {
      pState.doubleCount = 0;
      pState.hasDouble = false;
    }
    
    const oldPos = pState.position || 0;
    let newPos = (oldPos + dice) % 40;
    
    // Salary check (passed HR)
    if (newPos < oldPos) {
      const rank = OFFICE_RANKS[pState.rankIndex || 0] || OFFICE_RANKS[0];
      let salary = rank.salary * 2; // Double salary for faster gameplay
      
      // Planner skill: 20% bonus
      if (pState.roleId === 'PLANNER') {
        salary = Math.floor(salary * 1.2);
      }
      
      pState.assets = (pState.assets || 0) + salary;
      pState.passedHRThisTurn = true;
      await this.addLog(sessionId, `${session.players?.[playerId]?.nickname || '플레이어'}님이 인사팀을 통과하여 월급 ${salary}만원을 수령했습니다! (기본급 2배 인상)`, 'success');
    } else {
      pState.passedHRThisTurn = false;
    }
    
    pState.position = newPos;
    const cell = OFFICE_LIFE_BOARD[newPos];
    
    await this.addLog(sessionId, `${session.players?.[playerId]?.nickname || '플레이어'}님이 주사위 ${dice}을 굴려 '${cell.name}'에 도착했습니다.`, 'info');
    
    if (cell.type === 'TAX') {
      const tax = Math.floor((pState.assets || 0) * 0.1);
      pState.assets = (pState.assets || 0) - tax;
      await this.addLog(sessionId, `세금으로 ${tax}만원이 공제되었습니다.`, 'warning');
    } else if (cell.type === 'GO_TO_JAIL') {
      pState.position = 10;
      pState.isJailed = true;
      pState.jailTurns = 0;
      pState.hasDouble = false;
      pState.doubleCount = 0;
      await this.addLog(sessionId, `감사팀으로 긴급 호출되었습니다!`, 'error');
    } else if (cell.type === 'PROJECT') {
      const cellData = (game.cells || {})[newPos];
      if (cellData && cellData.ownerId && cellData.ownerId !== playerId) {
        const ownerState = (game.playerStates || {})[cellData.ownerId];
        
        if (ownerState && (pState.teamId === 'INDIVIDUAL' || pState.teamId !== ownerState.teamId)) {
          const baseRent = cell.rent?.[(cellData.level || 1) - 1] || 0;
          const rankMultiplier = (OFFICE_RANKS[ownerState.rankIndex || 0] || OFFICE_RANKS[0]).tollMultiplier;
          let finalRent = Math.floor(baseRent * rankMultiplier);
          
          // Developer skill: 10% discount for payer
          if (pState.roleId === 'DEV') {
            finalRent = Math.floor(finalRent * 0.9);
          }
          
          // Designer skill: 10% extra for owner
          if (ownerState.roleId === 'DESIGN') {
            finalRent = Math.floor(finalRent * 1.1);
          }
 
          pState.assets = (pState.assets || 0) - finalRent;
          ownerState.assets = (ownerState.assets || 0) + finalRent;
          await this.addLog(sessionId, `${session.players?.[cellData.ownerId]?.nickname || '플레이어'}님에게 협업 비용 ${finalRent}만원을 지불했습니다.`, 'warning');
        }
      } else if (!cellData || cellData.level < 3) {
        game.waitingForAction = 'BUY_PROJECT';
      }
    } else if (cell.type === 'CHANCE') {
      game.waitingForAction = 'CHANCE_CARD';
    } else if (cell.type === 'REST') {
      game.waitingForAction = 'BUY_ITEM';
    }

    if (game.waitingForAction === 'NONE' || !game.waitingForAction) {
      game.waitingForAction = 'END_TURN';
    }
    
    await update(ref(db, `sessions/${sessionId}/officeLifeGame`), game);
  },

  async buyOfficeLifeProject(sessionId: string, playerId: string, session: Session) {
    if (!db || !session.officeLifeGame) return;
    const game = JSON.parse(JSON.stringify(session.officeLifeGame)) as OfficeLifeGameState;
    const pState = game.playerStates?.[playerId];
    if (!pState) return;
    
    const cellPos = pState.position || 0;
    const cell = OFFICE_LIFE_BOARD[cellPos];
    
    if (cell.type !== 'PROJECT') return;
    
    const cellData = (game.cells || {})[cellPos] || { level: 0 };
    if (cellData.ownerId && cellData.ownerId !== playerId) return;
    
    if (cellData.level >= 3) return;
    
    let cost = cell.price || 0;
    // Sales skill: 10% discount
    if (pState.roleId === 'SALES') {
      cost = Math.floor(cost * 0.9);
    }

    if ((pState.assets || 0) < cost) {
      await this.addLog(sessionId, `자산이 부족하여 프로젝트를 진행할 수 없습니다.`, 'warning');
      return;
    }
    
    pState.assets = (pState.assets || 0) - cost;
    if (!game.cells) game.cells = {};
    game.cells[cellPos] = {
      ownerId: playerId,
      level: (cellData.level || 0) + 1
    };
    
    game.waitingForAction = 'END_TURN';
    await this.addLog(sessionId, `'${cell.name}' 프로젝트를 ${game.cells[cellPos].level}단계로 승인했습니다.`, 'success');
    
    // Check if promotion test is needed after cell action
    if (pState.passedHRThisTurn && (pState.rankIndex || 0) < OFFICE_RANKS.length - 1) {
      game.waitingForAction = 'PROMOTION_TEST';
      pState.passedHRThisTurn = false;
    }

    await update(ref(db, `sessions/${sessionId}/officeLifeGame`), game);
  },

  async drawOfficeLifeChanceCard(sessionId: string, playerId: string, session: Session) {
    if (!db || !session.officeLifeGame) return;
    const game = JSON.parse(JSON.stringify(session.officeLifeGame)) as OfficeLifeGameState;
    const turnOrder = game.turnOrder || [];
    const currentPlayerId = turnOrder[game.currentTurnIndex || 0];
    if (currentPlayerId !== playerId || game.waitingForAction !== 'CHANCE_CARD') return;

    const pState = game.playerStates?.[playerId];
    if (!pState) return;

    let card = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
    
    // HR Skill: Draw 2 cards and pick the best one
    if (pState.roleId === 'HR') {
      const card2 = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
      const assets = pState.assets || 0;
      const result1 = card.effect(assets) - assets;
      const result2 = card2.effect(assets) - assets;
      
      if (result2 > result1) {
        card = card2;
      }
      await this.addLog(sessionId, `[인사팀 스킬] 두 장의 카드 중 더 유리한 카드를 선택했습니다.`, 'success');
    }

    const oldAssets = pState.assets || 0;
    pState.assets = card.effect(oldAssets);
    const diff = pState.assets - oldAssets;

    game.lastChanceCard = {
      title: card.title,
      message: card.message,
      type: card.type
    };
    
    game.waitingForAction = 'END_TURN';
    
    await this.addLog(sessionId, `[법인카드 찬스] ${card.title}: ${card.message} (${diff > 0 ? '+' : ''}${diff}만원)`, card.type === 'GOOD' ? 'success' : card.type === 'BAD' ? 'warning' : 'info');
    
    // Check if promotion test is needed after cell action
    if (pState.passedHRThisTurn && (pState.rankIndex || 0) < OFFICE_RANKS.length - 1) {
      game.waitingForAction = 'PROMOTION_TEST';
      pState.passedHRThisTurn = false;
    }

    await update(ref(db, `sessions/${sessionId}/officeLifeGame`), game);
  },

  async buyOfficeLifeItem(sessionId: string, playerId: string, itemId: string, session: Session) {
    if (!db || !session.officeLifeGame) return;
    const game = JSON.parse(JSON.stringify(session.officeLifeGame)) as OfficeLifeGameState;
    const pState = game.playerStates?.[playerId];
    if (!pState) return;

    const item = OFFICE_ITEMS.find(i => i.id === itemId);
    
    if (!item || (pState.assets || 0) < item.price) {
      await this.addLog(sessionId, `자산이 부족하여 아이템을 구매할 수 없습니다.`, 'warning');
      return;
    }
    
    pState.assets = (pState.assets || 0) - item.price;
    pState.items = [...(pState.items || []), item.id];
    
    await this.addLog(sessionId, `'${item.name}' 아이템을 구매했습니다.`, 'success');
    await update(ref(db, `sessions/${sessionId}/officeLifeGame`), game);
  },

  async useOfficeLifeItem(sessionId: string, playerId: string, itemId: string, session: Session) {
    if (!db || !session.officeLifeGame) return;
    const game = JSON.parse(JSON.stringify(session.officeLifeGame)) as OfficeLifeGameState;
    const pState = game.playerStates?.[playerId];
    if (!pState) return;
    
    const items = pState.items || [];
    const itemIdx = items.indexOf(itemId);
    if (itemIdx === -1) return;
    
    // Remove item from inventory
    items.splice(itemIdx, 1);
    pState.items = items;
    
    const item = OFFICE_ITEMS.find(i => i.id === itemId);
    if (!item) return;

    // Item Effects
    if (itemId === 'COFFEE') {
      if (pState.isJailed) {
        pState.jailTurns = Math.min(3, pState.jailTurns + 2); // Speed up
        if (pState.jailTurns >= 3) {
          pState.isJailed = false;
          pState.jailTurns = 0;
        }
        await this.addLog(sessionId, `아이스 아메리카노의 힘으로 경위서 작성이 빨라졌습니다!`, 'success');
      } else {
        await this.addLog(sessionId, `커피를 마셨지만 아무 일도 일어나지 않았습니다. (경위서 작성 중이 아님)`, 'info');
      }
    } else {
      await this.addLog(sessionId, `'${item.name}' 아이템을 사용했습니다. (효과 적용 예정)`, 'info');
    }
    
    await update(ref(db, `sessions/${sessionId}/officeLifeGame`), game);
  },

  async setPlayerTeam(sessionId: string, playerId: string, teamId: string) {
    if (!db) return;
    await update(ref(db, `sessions/${sessionId}/players/${playerId}`), { teamId });
  },

  async payOfficeLifeJailFine(sessionId: string, playerId: string, session: Session) {
    if (!db || !session.officeLifeGame) return;
    const game = JSON.parse(JSON.stringify(session.officeLifeGame)) as OfficeLifeGameState;
    const pState = game.playerStates?.[playerId];
    if (!pState || !pState.isJailed) return;

    const fine = 500;
    
    if ((pState.assets || 0) >= fine) {
      pState.assets = (pState.assets || 0) - fine;
      pState.isJailed = false;
      pState.jailTurns = 0;
      await this.addLog(sessionId, `${session.players?.[playerId]?.nickname || '플레이어'}님이 벌금 ${fine}만원을 지불하고 즉시 복귀했습니다.`, 'success');
      await update(ref(db, `sessions/${sessionId}/officeLifeGame`), game);
    } else {
      await this.addLog(sessionId, `벌금을 지불할 자산이 부족합니다.`, 'warning');
    }
  },

  async selectOfficeLifeRole(sessionId: string, playerId: string, roleId: string, session: Session) {
    if (!db || !session.officeLifeGame) return;
    
    const role = OFFICE_ROLES.find(r => r.id === roleId);
    await this.addLog(sessionId, `${session.players?.[playerId]?.nickname || '플레이어'}님이 '${role?.name}' 직무를 선택했습니다.`, 'info');
    
    // Update only this player's role
    await update(ref(db, `sessions/${sessionId}/officeLifeGame/playerStates/${playerId}`), { roleId });
    
    // Check if all players have selected roles to advance the game state
    // We fetch the latest state to be sure
    const snapshot = await get(ref(db, `sessions/${sessionId}/officeLifeGame`));
    if (snapshot.exists()) {
      const latestGame = snapshot.val() as OfficeLifeGameState;
      const turnOrder = latestGame.turnOrder || [];
      const allSelected = turnOrder.every(pid => latestGame.playerStates?.[pid]?.roleId);
      if (allSelected) {
        await update(ref(db, `sessions/${sessionId}/officeLifeGame`), { waitingForAction: 'NONE' });
        
        // Trigger AI if current player is AI
        const currentTurnPlayerId = turnOrder[0];
        if (session.players?.[currentTurnPlayerId]?.isAI) {
          const updatedSnapshot = await get(ref(db, `sessions/${sessionId}`));
          const updatedSession = updatedSnapshot.val();
          if (updatedSession) {
            await this.processOfficeLifeAITurn(sessionId, updatedSession);
          }
        }
      } else {
        // If not all selected, find the next AI that needs to select a role
        for (const pid of turnOrder) {
          if (session.players?.[pid]?.isAI && !latestGame.playerStates?.[pid]?.roleId) {
             await this.processOfficeLifeAITurn(sessionId, session, pid);
             break;
          }
        }
      }
    }
  },

  async takeOfficeLifePromotionTest(sessionId: string, playerId: string, accept: boolean, session: Session) {
    if (!db || !session.officeLifeGame) return;
    const game = JSON.parse(JSON.stringify(session.officeLifeGame)) as OfficeLifeGameState;
    const pState = game.playerStates?.[playerId];
    if (!pState || game.waitingForAction !== 'PROMOTION_TEST') return;

    if (accept) {
      const nextRankIndex = (pState.rankIndex || 0) + 1;
      const nextRank = OFFICE_RANKS[nextRankIndex];
      
      if (nextRank && (pState.assets || 0) >= nextRank.promotionCost) {
        pState.assets = (pState.assets || 0) - nextRank.promotionCost;
        pState.rankIndex = nextRankIndex;
        pState.rank = nextRank.name;
        await this.addLog(sessionId, `${session.players?.[playerId]?.nickname || '플레이어'}님이 '${nextRank.name}'으로 승진했습니다! 축하합니다!`, 'success');
      } else {
        await this.addLog(sessionId, `자산이 부족하여 승진에 실패했습니다.`, 'warning');
      }
    } else {
      await this.addLog(sessionId, `승진 기회를 다음으로 미뤘습니다.`, 'info');
    }

    game.waitingForAction = 'END_TURN';
    await update(ref(db, `sessions/${sessionId}/officeLifeGame`), game);
  },

  async endOfficeLifeTurn(sessionId: string, playerId: string, session: Session) {
    if (!db || !session.officeLifeGame) return;
    const game = JSON.parse(JSON.stringify(session.officeLifeGame)) as OfficeLifeGameState;
    const turnOrder = game.turnOrder || [];
    const currentPlayerId = turnOrder[game.currentTurnIndex || 0];
    if (currentPlayerId !== playerId) return;

    // Victory Check
    const pState = game.playerStates?.[playerId];
    if (!pState) return;
    
    const targetAssets = 30000; // 3억
    const maxRankIndex = OFFICE_RANKS.length - 1;

    if ((pState.assets || 0) >= targetAssets || (pState.rankIndex || 0) === maxRankIndex) {
      game.status = 'FINISHED';
      game.winner = playerId;
      if (pState.teamId !== 'INDIVIDUAL') {
        game.winnerTeam = pState.teamId;
      }
      await this.addLog(sessionId, `축하합니다! ${session.players?.[playerId]?.nickname || '플레이어'}님이 최종 승리했습니다!`, 'success');
    }

    if (pState.hasDouble) {
      pState.hasDouble = false;
      game.waitingForAction = 'NONE';
      await this.addLog(sessionId, `🎲 더블 찬스! ${session.players?.[playerId]?.nickname || '플레이어'}님이 한 번 더 주사위를 굴립니다!`, 'success');
    } else {
      game.waitingForAction = 'NONE';
      game.currentTurnIndex = ((game.currentTurnIndex || 0) + 1) % (turnOrder.length || 1);
    }
    
    await update(ref(db, `sessions/${sessionId}/officeLifeGame`), game);

    // Trigger AI turn if next player is AI
    const nextPlayerId = turnOrder[game.currentTurnIndex];
    if (session.players?.[nextPlayerId]?.isAI && game.status === 'PLAYING') {
      await this.processOfficeLifeAITurn(sessionId, session);
    }
  },

  async processOfficeLifeAITurn(sessionId: string, session: Session, targetPlayerId?: string) {
    if (!db || !session.officeLifeGame) return;
    const game = session.officeLifeGame;
    const turnOrder = game.turnOrder || [];
    const currentPlayerId = targetPlayerId || turnOrder[game.currentTurnIndex || 0];
    const player = session.players?.[currentPlayerId];

    if (!player || !player.isAI) return;

    setTimeout(async () => {
      // Re-fetch session to get latest waitingForAction
      const snapshot = await get(ref(db, `sessions/${sessionId}`));
      const currentSession = snapshot.val() as Session;
      if (!currentSession || !currentSession.officeLifeGame) return;
      const currentGame = currentSession.officeLifeGame;

      if (currentGame.waitingForAction === 'NONE' || !currentGame.waitingForAction) {
        await this.addLog(sessionId, `${player.nickname}님이 주사위를 굴립니다...`, 'info');
        await this.rollOfficeLifeDice(sessionId, currentPlayerId, currentSession);
      } else if (currentGame.waitingForAction === 'BUY_PROJECT') {
        const shouldBuy = Math.random() > 0.3;
        if (shouldBuy) {
          await this.buyOfficeLifeProject(sessionId, currentPlayerId, currentSession);
        }
        await this.endOfficeLifeTurn(sessionId, currentPlayerId, currentSession);
      } else if (currentGame.waitingForAction === 'CHANCE_CARD') {
        await this.drawOfficeLifeChanceCard(sessionId, currentPlayerId, currentSession);
        await this.endOfficeLifeTurn(sessionId, currentPlayerId, currentSession);
      } else if (currentGame.waitingForAction === 'BUY_ITEM') {
        await this.endOfficeLifeTurn(sessionId, currentPlayerId, currentSession);
      } else if (currentGame.waitingForAction === 'PROMOTION_TEST') {
        await this.takeOfficeLifePromotionTest(sessionId, currentPlayerId, true, currentSession);
      } else if (currentGame.waitingForAction === 'END_TURN') {
        await this.endOfficeLifeTurn(sessionId, currentPlayerId, currentSession);
      } else if (currentGame.waitingForAction === 'SELECT_ROLE') {
        const roles = ['PLANNER', 'DEV', 'DESIGN', 'SALES'];
        const randomRole = roles[Math.floor(Math.random() * roles.length)];
        await this.selectOfficeLifeRole(sessionId, currentPlayerId, randomRole, currentSession);
      }
    }, 2000);
  },

  // --- Escape Room ---
  async startEscapeRoom(sessionId: string, settings: any) {
    if (!db) return;
    const escapeRoomGame: EscapeRoomGameState = {
      currentRoomId: 'room_1',
      solvedPuzzles: [],
      inventory: [],
      startTime: Date.now(),
      timeLimit: settings.escapeRoomDifficulty === 'EASY' ? 1800 : settings.escapeRoomDifficulty === 'HARD' ? 600 : 1200,
      status: 'PLAYING',
      hintsUsed: 0
    };
    await update(ref(db, `sessions/${sessionId}`), {
      status: SessionStatus.PLAYING,
      escapeRoomGame
    });
    await this.addLog(sessionId, '방탈출이 시작되었습니다. 첫 번째 방을 탐색하세요!', 'success');
  },

  async submitEscapeRoomAnswer(sessionId: string, puzzleId: string, answer: string, session: Session) {
    if (!db || !session.escapeRoomGame) return;
    const room = ESCAPE_ROOM_DATA[session.escapeRoomGame.currentRoomId];
    const puzzle = room.puzzles.find(p => p.id === puzzleId);
    if (!puzzle) return;

    if (puzzle.answer === answer.trim()) {
      const solvedPuzzles = [...(session.escapeRoomGame.solvedPuzzles || []), puzzleId];
      const inventory = [...(session.escapeRoomGame.inventory || [])];
      if (puzzle.rewardItem) inventory.push(puzzle.rewardItem);

      const allSolved = room.puzzles.every(p => solvedPuzzles.includes(p.id));
      let nextRoomId = session.escapeRoomGame.currentRoomId;
      let status = session.escapeRoomGame.status;

      if (allSolved) {
        if (room.nextRoomId) {
          nextRoomId = room.nextRoomId;
          await this.addLog(sessionId, `방을 탈출했습니다! 다음 방: ${ESCAPE_ROOM_DATA[nextRoomId].name}`, 'success');
        } else {
          status = 'WON';
          await this.addLog(sessionId, '축하합니다! 모든 방을 탈출했습니다!', 'success');
          await this.advanceStatus(sessionId, SessionStatus.SUMMARY);
        }
      } else {
        await this.addLog(sessionId, '정답입니다! 퍼즐을 해결했습니다.', 'success');
      }

      await update(ref(db, `sessions/${sessionId}/escapeRoomGame`), {
        solvedPuzzles,
        inventory,
        currentRoomId: nextRoomId,
        status
      });
    } else {
      await this.addLog(sessionId, '틀렸습니다. 다시 생각해보세요.', 'warning');
    }
  },
  
  async useEscapeRoomHint(sessionId: string, puzzleId: string, session: Session) {
    if (!db || !session.escapeRoomGame) return;
    const room = ESCAPE_ROOM_DATA[session.escapeRoomGame.currentRoomId];
    const puzzle = room.puzzles.find(p => p.id === puzzleId);
    if (!puzzle) return;

    await this.addLog(sessionId, `힌트 사용: ${puzzle.hint}`, 'info');
    await update(ref(db, `sessions/${sessionId}/escapeRoomGame`), {
      hintsUsed: (session.escapeRoomGame.hintsUsed || 0) + 1
    });
  },

  // --- Cyber Arena (Real-time Action) ---
  async startCyberArena(sessionId: string, players: Record<string, Player>, settings: any) {
    if (!db || !players) return;
    const playerIds = Object.keys(players || {}).filter(id => !players[id]?.isSpectator);
    
    if (settings.cyberArenaPvE && playerIds.length === 1) {
      playerIds.push('ai_bot_1');
    }

    const playerStats: Record<string, any> = {};
    const inventory: Record<string, string[]> = {};
    
    playerIds.forEach((pid, idx) => {
      playerStats[pid] = {
        hp: 100,
        maxHp: 100,
        energy: 50,
        maxEnergy: 100,
        shield: 0,
        level: 1,
        exp: 0,
        credits: 100,
        characterId: pid.startsWith('ai_') ? 'AI' : null,
        x: idx === 0 ? 100 : 700,
        y: 300,
        vx: 0,
        vy: 0,
        rotation: 0,
        lastSkillTime: {}
      };
      inventory[pid] = [];
    });

    const roundsWon: Record<string, number> = {};
    playerIds.forEach(pid => roundsWon[pid] = 0);

    const cyberArenaGame: CyberArenaGameState = {
      playerStats,
      projectiles: {},
      inventory,
      status: 'PLAYING',
      isPvE: !!settings.cyberArenaPvE,
      aiDifficulty: 1,
      startTime: Date.now(),
      lastUpdate: Date.now(),
      currentRound: 1,
      roundsWon
    };

    await update(ref(db, `sessions/${sessionId}`), {
      status: SessionStatus.PLAYING,
      cyberArenaGame
    });
    await this.addLog(sessionId, '사이버 아레나에 입장했습니다! 실시간 전투가 시작됩니다.', 'success');
  },

  async updateArenaPlayerPosition(sessionId: string, playerId: string, x: number, y: number, vx: number, vy: number, rotation: number) {
    if (!db) return;
    const updates: any = {};
    updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${playerId}/x`] = x;
    updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${playerId}/y`] = y;
    updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${playerId}/vx`] = vx;
    updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${playerId}/vy`] = vy;
    updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${playerId}/rotation`] = rotation;
    updates[`sessions/${sessionId}/cyberArenaGame/lastUpdate`] = Date.now();
    await update(ref(db), updates);
  },

  async triggerArenaSkill(sessionId: string, playerId: string, skillId: string, x: number, y: number, rotation: number, session: Session) {
    if (!db || !session.cyberArenaGame) return;
    const game = session.cyberArenaGame;
    const stats = game.playerStats[playerId];
    const skill = ARENA_SKILLS.find(s => s.id === skillId);
    
    if (!skill || stats.energy < skill.energyCost) return;

    const now = Date.now();
    const lastUsed = stats.lastSkillTime?.[skillId] || 0;
    if (now - lastUsed < skill.cooldown) return;

    const updates: any = {};
    updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${playerId}/energy`] = stats.energy - skill.energyCost;
    updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${playerId}/lastSkillTime/${skillId}`] = now;

    if (skill.type === 'PROJECTILE') {
      const projectileId = `proj_${now}_${playerId}`;
      const vx = Math.cos(rotation) * (skill.speed || 5);
      const vy = Math.sin(rotation) * (skill.speed || 5);
      
      const projectile: ArenaProjectile = {
        id: projectileId,
        ownerId: playerId,
        x: x + Math.cos(rotation) * 30,
        y: y + Math.sin(rotation) * 30,
        vx,
        vy,
        damage: skill.damage || 10,
        radius: skill.radius || 10,
        createdAt: now,
        expiresAt: now + (skill.range || 1000) / (skill.speed || 5) * 16 // Approx life in ms
      };
      updates[`sessions/${sessionId}/cyberArenaGame/projectiles/${projectileId}`] = projectile;
    } else if (skill.type === 'DASH') {
      updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${playerId}/x`] = x + Math.cos(rotation) * (skill.range || 100);
      updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${playerId}/y`] = y + Math.sin(rotation) * (skill.range || 100);
    } else if (skill.type === 'INSTANT') {
      // Handle instant effects (heal, shield, etc.)
      if (skill.heal) updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${playerId}/hp`] = Math.min(stats.maxHp, stats.hp + skill.heal);
      if (skill.shield) updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${playerId}/shield`] = stats.shield + skill.shield;
    }

    await update(ref(db), updates);
  },

  async handleArenaProjectileHit(sessionId: string, projectileId: string, targetId: string, session: Session) {
    if (!db || !session.cyberArenaGame) return;
    const game = session.cyberArenaGame;
    const projectile = game.projectiles[projectileId];
    const targetStats = game.playerStats[targetId];
    const shooterId = projectile?.ownerId;
    const shooterStats = shooterId ? game.playerStats[shooterId] : null;

    if (!projectile || !targetStats) return;

    const damage = Math.max(0, projectile.damage - (targetStats.shield || 0));
    const newShield = Math.max(0, (targetStats.shield || 0) - projectile.damage);
    const newHp = Math.max(0, targetStats.hp - damage);

    const updates: any = {};
    updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${targetId}/hp`] = newHp;
    updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${targetId}/shield`] = newShield;

    // Award XP to shooter
    if (shooterStats && !shooterId.startsWith('ai_')) {
      const xpGain = Math.floor(projectile.damage);
      const newExp = (shooterStats.exp || 0) + xpGain;
      const currentLevel = shooterStats.level || 1;
      const nextLevelExp = currentLevel * 100;

      if (newExp >= nextLevelExp) {
        // Level Up!
        const nextLevel = currentLevel + 1;
        updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${shooterId}/level`] = nextLevel;
        updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${shooterId}/exp`] = newExp - nextLevelExp;
        updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${shooterId}/maxHp`] = (shooterStats.maxHp || 100) + 20;
        updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${shooterId}/hp`] = (shooterStats.maxHp || 100) + 20; // Full heal on level up
        updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${shooterId}/maxEnergy`] = (shooterStats.maxEnergy || 100) + 10;
        updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${shooterId}/credits`] = (shooterStats.credits || 0) + 50;
        await this.addLog(sessionId, `${session.players?.[shooterId]?.nickname}님이 레벨 업! (Lv.${nextLevel})`, 'success');
      } else {
        updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${shooterId}/exp`] = newExp;
      }
    }

    if (newHp <= 0) {
      const currentRounds = (game.roundsWon?.[shooterId] || 0) + 1;
      updates[`sessions/${sessionId}/cyberArenaGame/roundsWon/${shooterId}`] = currentRounds;
      
      if (currentRounds >= 3) {
        updates[`sessions/${sessionId}/cyberArenaGame/status`] = 'FINISHED';
        updates[`sessions/${sessionId}/cyberArenaGame/winnerId`] = shooterId;
        updates[`sessions/${sessionId}/cyberArenaGame/projectiles/${projectileId}`] = null; // Remove specific projectile
        await this.addLog(sessionId, `최종 승리! ${session.players?.[shooterId]?.nickname || '플레이어'}님이 챔피언이 되었습니다!`, 'success');
      } else {
        updates[`sessions/${sessionId}/cyberArenaGame/status`] = 'SHOP';
        updates[`sessions/${sessionId}/cyberArenaGame/projectiles`] = null; // Remove ALL projectiles (Ancestor path)
        // Give bonus credits for winning round
        updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${shooterId}/credits`] = (shooterStats.credits || 0) + 200;
        updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${targetId}/credits`] = (targetStats.credits || 0) + 100;
        await this.addLog(sessionId, `라운드 종료! ${session.players?.[shooterId]?.nickname || '플레이어'}님이 승리했습니다. 상점으로 이동합니다.`, 'info');
      }
    } else {
      updates[`sessions/${sessionId}/cyberArenaGame/projectiles/${projectileId}`] = null; // Remove specific projectile
    }

    await update(ref(db), updates);
  },

  async cleanupArenaProjectiles(sessionId: string, projectileIds: string[]) {
    if (!db || projectileIds.length === 0) return;
    const updates: any = {};
    projectileIds.forEach(id => {
      updates[`sessions/${sessionId}/cyberArenaGame/projectiles/${id}`] = null;
    });
    await update(ref(db), updates);
  },

  async buyArenaItem(sessionId: string, playerId: string, itemId: string, session: Session) {
    if (!db || !session.cyberArenaGame) return;
    const game = session.cyberArenaGame;
    const stats = game.playerStats[playerId];
    const item = ARENA_ITEMS.find(i => i.id === itemId);

    if (!item || stats.credits < item.cost) return;

    const updates: any = {};
    updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${playerId}/credits`] = stats.credits - item.cost;
    
    // Apply item effect
    const newStats = item.effect(stats);
    Object.keys(newStats).forEach(key => {
      updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${playerId}/${key}`] = (newStats as any)[key];
    });

    await update(ref(db), updates);
    await this.addLog(sessionId, `${session.players?.[playerId]?.nickname}님이 ${item.name}을(를) 구매했습니다.`, 'info');
  },

  async startNextRound(sessionId: string, session: Session) {
    if (!db || !session.cyberArenaGame) return;
    const game = session.cyberArenaGame;
    const playerIds = Object.keys(game.playerStats);
    
    const updates: any = {};
    updates[`sessions/${sessionId}/cyberArenaGame/status`] = 'PLAYING';
    updates[`sessions/${sessionId}/cyberArenaGame/currentRound`] = (game.currentRound || 1) + 1;
    updates[`sessions/${sessionId}/cyberArenaGame/projectiles`] = null;

    playerIds.forEach((pid, idx) => {
      const stats = game.playerStats[pid];
      updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${pid}/hp`] = stats.maxHp;
      updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${pid}/energy`] = Math.floor(stats.maxEnergy / 2);
      updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${pid}/shield`] = 0;
      updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${pid}/x`] = idx === 0 ? 100 : 700;
      updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${pid}/y`] = 300;
      updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${pid}/vx`] = 0;
      updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${pid}/vy`] = 0;
      updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${pid}/rotation`] = idx === 0 ? 0 : Math.PI;
    });

    await update(ref(db), updates);
    await this.addLog(sessionId, `${game.currentRound + 1} 라운드가 시작됩니다!`, 'warning');
  },

  async selectArenaCharacter(sessionId: string, playerId: string, characterId: string, session: Session) {
    if (!db || !session.cyberArenaGame) return;
    
    const character = ARENA_CHARACTERS.find(c => c.id === characterId);
    if (!character) return;

    const updates: any = {};
    updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${playerId}/characterId`] = characterId;
    updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${playerId}/hp`] = character.baseHp;
    updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${playerId}/maxHp`] = character.baseHp;
    updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${playerId}/energy`] = Math.floor(character.baseEnergy / 2);
    updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${playerId}/maxEnergy`] = character.baseEnergy;

    await update(ref(db), updates);
    await this.addLog(sessionId, `${session.players?.[playerId]?.nickname || '플레이어'}님이 ${character.name} 캐릭터를 선택했습니다.`, 'success');
  },

  async updateArenaAI(sessionId: string, session: Session) {
    if (!db || !session.cyberArenaGame || session.cyberArenaGame.status !== 'PLAYING') return;
    const game = session.cyberArenaGame;
    const aiIds = Object.keys(game.playerStats).filter(id => id.startsWith('ai_'));
    if (aiIds.length === 0) return;

    const updates: any = {};
    const now = Date.now();

    aiIds.forEach(aiId => {
      const stats = game.playerStats[aiId];
      // Find nearest player
      const targetId = Object.keys(game.playerStats).find(id => !id.startsWith('ai_'));
      if (!targetId) return;
      const targetStats = game.playerStats[targetId];

      const dx = targetStats.x - stats.x;
      const dy = targetStats.y - stats.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const rotation = Math.atan2(dy, dx);

      // Move towards target if far, or away if too close
      let vx = 0;
      let vy = 0;
      const speed = 1.8;

      if (dist > 250) {
        vx = Math.cos(rotation) * speed;
        vy = Math.sin(rotation) * speed;
      } else if (dist < 150) {
        vx = -Math.cos(rotation) * speed;
        vy = -Math.sin(rotation) * speed;
      }

      // Dodging logic
      Object.values(game.projectiles || {}).forEach((proj: any) => {
        if (proj && proj.ownerId !== aiId) {
          const pdx = proj.x - stats.x;
          const pdy = proj.y - stats.y;
          const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
          if (pdist < 120) {
            // Move perpendicular to projectile to dodge
            vx += -proj.vy * 0.8;
            vy += proj.vx * 0.8;
          }
        }
      });

      // Normalize velocity if it exceeds speed
      const currentSpeed = Math.sqrt(vx * vx + vy * vy);
      if (currentSpeed > speed) {
        vx = (vx / currentSpeed) * speed;
        vy = (vy / currentSpeed) * speed;
      }

      updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${aiId}/x`] = stats.x + vx;
      updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${aiId}/y`] = stats.y + vy;
      updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${aiId}/vx`] = vx;
      updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${aiId}/vy`] = vy;
      updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${aiId}/rotation`] = rotation;

      // Try to attack
      if (dist < 450 && now - (stats.lastSkillTime?.['basic_attack'] || 0) > 1200) {
        const projectileId = `proj_${now}_${aiId}`;
        const pvx = Math.cos(rotation) * 5;
        const pvy = Math.sin(rotation) * 5;
        
        const projectile: ArenaProjectile = {
          id: projectileId,
          ownerId: aiId,
          x: stats.x + Math.cos(rotation) * 30,
          y: stats.y + Math.sin(rotation) * 30,
          vx: pvx,
          vy: pvy,
          damage: 10,
          radius: 10,
          createdAt: now,
          expiresAt: now + 3000
        };
        updates[`sessions/${sessionId}/cyberArenaGame/projectiles/${projectileId}`] = projectile;
        updates[`sessions/${sessionId}/cyberArenaGame/playerStats/${aiId}/lastSkillTime/basic_attack`] = now;
      }
    });

    updates[`sessions/${sessionId}/cyberArenaGame/lastUpdate`] = now;
    await update(ref(db), updates);
  }
};
