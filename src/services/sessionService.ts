import { ref, set, push, onValue, update, get, remove, onDisconnect } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { db, auth, isConfigured } from '../firebase';
import { Session, Player, SessionStatus, GameType, LiarMode, LiarGameState, MafiaGameState, MafiaPhase } from '../types';
import { LIAR_TOPICS } from '../data/topics';

export const sessionService = {
  async authenticate() {
    if (!isConfigured || !auth) return null;
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }
    return auth.currentUser;
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

    const player: Player = {
      id: user.uid,
      nickname,
      isHost: false,
      isAlive: true,
      isReady: false,
      isConnected: true,
      lastActive: Date.now(),
    };

    await set(ref(db, `sessions/${sessionId}/players/${user.uid}`), player);
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
    const playerIds = Object.keys(players);
    const liarIdx = Math.floor(Math.random() * playerIds.length);
    const liarPlayerId = playerIds[liarIdx];

    let spyPlayerId: string | undefined;
    if (settings.liarMode === LiarMode.SPY && playerIds.length >= 3) {
      let spyIdx;
      do {
        spyIdx = Math.floor(Math.random() * playerIds.length);
      } while (spyIdx === liarIdx);
      spyPlayerId = playerIds[spyIdx];
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
    let turnOrder: string[] = [];
    if (currentTurnOrder) {
      // Filter out players who are no longer in the session
      const validOrderedIds = currentTurnOrder.filter(id => playerIds.includes(id));
      
      // Find players who are not in the turn order (newly joined)
      const newPlayerIds = playerIds.filter(id => !validOrderedIds.includes(id));
      
      // Combine valid existing order with new players
      turnOrder = [...validOrderedIds, ...newPlayerIds];
    }

    // If turnOrder is empty or invalid (shouldn't happen with logic above, but safety check), shuffle
    if (turnOrder.length === 0) {
      turnOrder = [...playerIds].sort(() => Math.random() - 0.5);
    }

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
  },

  async confirmRole(sessionId: string, playerId: string) {
    if (!db) return;
    await update(ref(db, `sessions/${sessionId}/players/${playerId}`), { hasConfirmedRole: true });
  },

  async startMafiaGame(sessionId: string, players: Record<string, Player>, settings: any, currentTurnOrder?: string[]) {
    const playerIds = Object.keys(players);
    const count = playerIds.length;
    
    const mafiaCount = settings.mafiaCount || 1;
    const doctorCount = settings.doctorCount || 1;
    const policeCount = settings.policeCount || 1;

    if (mafiaCount + doctorCount + policeCount > count) {
      throw new Error('설정된 역할 수가 전체 플레이어 수보다 많습니다.');
    }
    
    // Determine Turn Order
    let finalTurnOrder: string[] = [];
    if (currentTurnOrder) {
      // Filter out players who are no longer in the session
      const validOrderedIds = currentTurnOrder.filter(id => playerIds.includes(id));
      
      // Find players who are not in the turn order (newly joined)
      const newPlayerIds = playerIds.filter(id => !validOrderedIds.includes(id));
      
      // Combine valid existing order with new players
      finalTurnOrder = [...validOrderedIds, ...newPlayerIds];
    }

    // If turnOrder is empty or invalid (shouldn't happen with logic above, but safety check), shuffle
    if (finalTurnOrder.length === 0) {
      finalTurnOrder = [...playerIds].sort(() => Math.random() - 0.5);
    }
    
    // Assign Roles Randomly (independent of turn order)
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

    const mafiaGame: MafiaGameState = {
      phase: MafiaPhase.NIGHT,
      round: 1,
      mafiaTargets: {},
    };

    updates['status'] = SessionStatus.REVEAL;
    updates['mafiaGame'] = mafiaGame;
    updates['turnOrder'] = finalTurnOrder;

    await update(ref(db, `sessions/${sessionId}`), updates);
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
    if (!db) return;

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
    let eliminatedId: string | undefined = undefined;
    let savedId: string | undefined = undefined;

    if (mafiaTargetId) {
      if (mafiaTargetId === mafiaGame.doctorTarget) {
        savedId = mafiaTargetId;
      } else {
        eliminatedId = mafiaTargetId;
      }
    }

    // 3. Update state
    const updates: any = {
      status: SessionStatus.PLAYING,
      'mafiaGame/phase': MafiaPhase.DAY,
      'mafiaGame/round': (mafiaGame.round || 1) + 1,
      'mafiaGame/nightResult': {
        eliminatedPlayerId: eliminatedId,
        savedPlayerId: savedId,
        investigatedPlayerId: mafiaGame.policeTarget,
        investigatedRole: mafiaGame.policeTarget ? players[mafiaGame.policeTarget]?.role : undefined,
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
    } else if (mafiaCount > citizenCount) {
      updates['status'] = SessionStatus.SUMMARY;
      updates['mafiaGame/winner'] = 'MAFIA';
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

  async advanceStatus(sessionId: string, status: SessionStatus) {
    if (!db) return;
    await update(ref(db, `sessions/${sessionId}`), { status });
  },

  async resetSession(sessionId: string, players: Record<string, Player>) {
    if (!db) return;
    const updates: any = {
      status: SessionStatus.LOBBY,
      liarGame: null,
      mafiaGame: null,
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
    if (!db) return;
    
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
      } else if (mafiaCount > citizenCount) {
        updates['status'] = SessionStatus.SUMMARY;
        updates['mafiaGame/winner'] = 'MAFIA';
      }
    }

    // Reset votes
    Object.keys(players).forEach(pid => {
      updates[`players/${pid}/voteTarget`] = null;
    });

    await update(ref(db, `sessions/${sessionId}`), updates);
  },

  async processLiarVote(sessionId: string, players: Record<string, Player>, liarGame: LiarGameState) {
    if (!db) return;
    
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
        } else {
          updates['status'] = SessionStatus.VOTE_RESULT;
        }
      } else {
        // Liar died -> Go to result to reveal
        updates['status'] = SessionStatus.VOTE_RESULT;
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
  }
};
