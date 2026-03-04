import { ref, set, push, onValue, update, get, remove, onDisconnect } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { db, auth, isConfigured } from '../firebase';
import { Session, Player, SessionStatus, GameType, LiarMode, LiarGameState, MafiaGameState, MafiaPhase, BingoGameState, DrawGameState } from '../types';
import { LIAR_TOPICS } from '../data/topics';
import { DRAW_TOPICS } from '../data/drawTopics';

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
    await this.addLog(sessionId, `라이어 게임이 시작되었습니다.`, 'success');
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
    await this.addLog(sessionId, `마피아 게임이 시작되었습니다.`, 'success');
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
      const winners = Object.values(players).filter(p => p.role !== 'MAFIA').map(p => p.id);
      await this.updateStats(sessionId, winners);
    } else if (mafiaCount >= citizenCount) {
      updates['status'] = SessionStatus.SUMMARY;
      updates['mafiaGame/winner'] = 'MAFIA';
      const winners = Object.values(players).filter(p => p.role === 'MAFIA').map(p => p.id);
      await this.updateStats(sessionId, winners);
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

    ids.forEach(pid => {
      const playerStats = currentStats[pid] || { wins: 0, totalScore: 0 };
      updates[`stats/${pid}`] = {
        wins: playerStats.wins + 1,
        totalScore: playerStats.totalScore + score
      };
    });

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

  async startOmokGame(sessionId: string, blackPlayerId: string, whitePlayerId: string) {
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
      isDraw: false
    };

    const updates: any = {
      status: SessionStatus.PLAYING,
      omokGame
    };

    await update(ref(db, `sessions/${sessionId}`), updates);
    await this.addLog(sessionId, `오목 대전이 시작되었습니다.`, 'success');
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
    await this.addLog(sessionId, `빙고 게임 준비 단계가 시작되었습니다.`, 'success');
  },

  async submitBingoBoard(sessionId: string, playerId: string, board: string[][]) {
    if (!db) return;
    await set(ref(db, `sessions/${sessionId}/bingoGame/boards/${playerId}`), board);
  },

  async startBingoGame(sessionId: string, players: Record<string, Player>, turnOrder: string[]) {
    if (!db) return;
    
    const updates: any = {
      status: SessionStatus.PLAYING,
      'bingoGame/currentPlayerId': turnOrder[0]
    };

    await update(ref(db, `sessions/${sessionId}`), updates);
  },

  async pickBingoWord(sessionId: string, playerId: string, word: string, session: Session) {
    if (!db || !session.bingoGame) return;
    
    const game = session.bingoGame;
    if (game.currentPlayerId !== playerId) return;
    if (game.markedWords.includes(word)) return;

    const newMarkedWords = [...game.markedWords, word];
    const updates: any = {};
    updates['bingoGame/markedWords'] = newMarkedWords;

    // Check for winners
    const winners: string[] = [];
    Object.entries(game.boards).forEach(([pid, board]) => {
      const lines = this.countBingoLines(board, newMarkedWords);
      if (lines >= game.targetLines) {
        winners.push(pid);
      }
    });

    if (winners.length > 0) {
      updates['bingoGame/winner'] = winners[0]; // First one detected
      updates['status'] = SessionStatus.SUMMARY;
    } else {
      // Next turn
      const turnOrder = session.turnOrder || Object.keys(session.players);
      const currentIndex = turnOrder.indexOf(playerId);
      const nextIndex = (currentIndex + 1) % turnOrder.length;
      updates['bingoGame/currentPlayerId'] = turnOrder[nextIndex];
    }

    await update(ref(db, `sessions/${sessionId}`), updates);
    const player = session.players[playerId].nickname;
    await this.addLog(sessionId, `${player}님이 [${word}] 단어를 선택했습니다.`);
    if (updates['bingoGame/winner']) {
      await this.addLog(sessionId, `${player}님이 빙고를 완성하여 승리했습니다!`, 'success');
      await this.updateStats(sessionId, updates['bingoGame/winner']);
    }
  },

  async startDrawGame(sessionId: string, players: Record<string, Player>, settings: any, turnOrder: string[]) {
    if (!db) return;
    
    const category = settings.drawCategory || '랜덤';
    let words: string[] = [];
    if (category === '랜덤') {
      words = DRAW_TOPICS.flatMap(t => t.words);
    } else {
      words = DRAW_TOPICS.find(t => t.category === category)?.words || [];
    }
    const secretWord = words[Math.floor(Math.random() * words.length)];

    const drawGame: DrawGameState = {
      presenterId: turnOrder[0],
      word: secretWord,
      category: category,
      canvasData: '',
      round: 1,
      maxRounds: settings.drawRounds || 3,
      timer: settings.drawTime || 60,
      scores: {}
    };

    // Initialize scores
    Object.keys(players).forEach(pid => {
      drawGame.scores[pid] = 0;
    });

    const updates: any = {
      status: SessionStatus.PLAYING,
      drawGame
    };

    await update(ref(db, `sessions/${sessionId}`), updates);
    await this.addLog(sessionId, `비주얼 브리핑(캐치마인드) 게임이 시작되었습니다.`, 'success');
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
      
      const player = session.players[playerId].nickname;
      await this.addLog(sessionId, `${player}님이 정답 [${game.word}]을 맞혔습니다! (+10점)`, 'success');
      await this.updateStats(sessionId, playerId, 10);
      await this.updateStats(sessionId, game.presenterId, 5);

      // Move to next turn or end
      await this.nextDrawTurn(sessionId, session, newScores);
    }
  },

  async nextDrawTurn(sessionId: string, session: Session, currentScores?: Record<string, number>) {
    if (!db || !session.drawGame) return;
    
    const game = session.drawGame;
    const turnOrder = session.turnOrder || Object.keys(session.players);
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
        'drawGame/canvasData': '',
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

  countBingoLines(board: string[][], markedWords: string[]) {
    let lines = 0;

    // Rows
    for (let i = 0; i < 5; i++) {
      if (board[i].every(word => markedWords.includes(word))) lines++;
    }

    // Columns
    for (let i = 0; i < 5; i++) {
      let colMarked = true;
      for (let j = 0; j < 5; j++) {
        if (!markedWords.includes(board[j][i])) {
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
      if (!markedWords.includes(board[i][i])) diag1Marked = false;
      if (!markedWords.includes(board[i][4 - i])) diag2Marked = false;
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
    if (game.board[y][x] !== 0) return;

    const isBlack = playerId === game.blackPlayerId;
    const stone = isBlack ? 1 : 2;
    
    // Update local board copy for win check
    const newBoard = game.board.map((row: any) => [...row]);
    newBoard[y][x] = stone;
    
    // Check for forbidden moves (Black only)
    if (isBlack) {
      if (this.checkOmokOverline(newBoard, x, y, stone)) {
        // Forbidden: Overline (6 or more stones)
        // Send a system message or just return (UI won't update, which is fine for invalid move)
        // Ideally, we should notify the user, but for now, preventing the move is key.
        return;
      }
      // 3-3 check is complex and omitted for stability unless strictly required.
      // Overline restriction is the most impactful "Official Rule" for casual play.
    }
    
    // Check Win
    const winInfo = this.checkOmokWin(newBoard, x, y, stone, isBlack);
    
    const updates: any = {};
    updates[`omokGame/board/${y}/${x}`] = stone;
    
    if (winInfo) {
      updates['omokGame/winner'] = playerId;
      updates['omokGame/winningLine'] = winInfo;
      updates['status'] = SessionStatus.SUMMARY;
    } else {
      // Check Draw (Board full)
      const isFull = newBoard.every((row: any) => row.every((cell: any) => cell !== 0));
      if (isFull) {
        updates['omokGame/isDraw'] = true;
        updates['status'] = SessionStatus.SUMMARY;
      } else {
        updates['omokGame/currentPlayerId'] = isBlack ? game.whitePlayerId : game.blackPlayerId;
      }
    }

    await update(sessionRef, updates);
    const player = session.players[playerId].nickname;
    await this.addLog(sessionId, `${player}님이 (${x}, ${y}) 위치에 돌을 놓았습니다.`);
    if (updates['omokGame/winner']) {
      await this.addLog(sessionId, `${player}님이 오목 대전에서 승리했습니다!`, 'success');
      await this.updateStats(sessionId, playerId);
    }
    if (updates['omokGame/isDraw']) await this.addLog(sessionId, `오목 대전이 무승부로 종료되었습니다.`, 'warning');
  },

  checkOmokOverline(board: number[][], x: number, y: number, stone: number) {
    const directions = [
      [1, 0], [0, 1], [1, 1], [1, -1]
    ];

    for (const [dx, dy] of directions) {
      let count = 1;
      
      // Check forward
      let i = 1;
      while (true) {
        const nx = x + dx * i;
        const ny = y + dy * i;
        if (ny < 0 || ny >= 15 || nx < 0 || nx >= 15 || board[ny][nx] !== stone) break;
        count++;
        i++;
      }

      // Check backward
      i = 1;
      while (true) {
        const nx = x - dx * i;
        const ny = y - dy * i;
        if (ny < 0 || ny >= 15 || nx < 0 || nx >= 15 || board[ny][nx] !== stone) break;
        count++;
        i++;
      }

      if (count > 5) return true; // Overline found
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
  }
};
