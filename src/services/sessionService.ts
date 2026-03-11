import { ref, set, push, onValue, update, get, remove, onDisconnect } from 'firebase/database';
import { signInAnonymously } from 'firebase/auth';
import { db, auth, isConfigured } from '../firebase';
import { Session, Player, SessionStatus, GameType, LiarMode, LiarGameState, MafiaGameState, MafiaPhase, BingoGameState, DrawGameState, LeaderboardEntry, OfficeLifeGameState } from '../types';
import { LIAR_TOPICS } from '../data/topics';
import { DRAW_TOPICS } from '../data/drawTopics';
import { OFFICE_LIFE_BOARD } from '../data/officeLifeBoard';
import { CHANCE_CARDS } from '../data/chanceCards';
import { OFFICE_ITEMS } from '../data/officeItems';
import { OFFICE_RANKS, OFFICE_ROLES } from '../data/officeRanks';

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
    if (!db) return;
    
    const playerIds = Object.keys(players).filter(id => !players[id].isSpectator);
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
    const playerIds = Object.keys(players);
    const count = playerIds.length;
    
    const mafiaCount = settings.mafiaCount || 1;
    const doctorCount = settings.doctorCount || 1;
    const policeCount = settings.policeCount || 1;

    if (mafiaCount + doctorCount + policeCount > count) {
      throw new Error('설정된 역할 수가 전체 플레이어 수보다 많습니다.');
    }
    
    // Determine Turn Order
    const finalTurnOrder = [...playerIds].sort(() => Math.random() - 0.5);
    
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
    await this.addLog(sessionId, `마피아 시트가 시작되었습니다.`, 'success');
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
      bingoGame: null,
      omokGame: null,
      drawGame: null,
      minesweeperGame: null,
      office2048Game: null,
      sudokuGame: null,
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

  async startOmokGame(sessionId: string, blackPlayerId: string, whitePlayerId: string, isAIMatch: boolean = false, difficulty: number = 1) {
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
      isAIMatch,
      difficulty,
      startTime: Date.now(),
      moveCount: 0
    };

    const updates: any = {
      status: SessionStatus.PLAYING,
      omokGame
    };

    if (isAIMatch) {
      // Add AI player if not exists
      const aiNicknames = ['알파고_인턴', '알파고_사원', '알파고_주임', '알파고_대리', '알파고_과장', '알파고_차장', '알파고_부장'];
      const aiPlayer: Player = {
        id: 'AI_PLAYER',
        nickname: aiNicknames[difficulty - 1] || '알파고_인턴',
        isHost: false,
        isAlive: true,
        isReady: true,
        isConnected: true,
        isAI: true
      };
      updates[`players/AI_PLAYER`] = aiPlayer;
    }

    await update(ref(db, `sessions/${sessionId}`), updates);
    await this.addLog(sessionId, isAIMatch ? `AI와의 오목 대전이 시작되었습니다.` : `오목 대전이 시작되었습니다.`, 'success');

    // Trigger AI move if AI is the first player
    if (isAIMatch && blackPlayerId === 'AI_PLAYER') {
      setTimeout(() => {
        this.makeOmokAIMove(sessionId, 'AI_PLAYER');
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
    if (!db) return;
    
    // Shuffle turnOrder for fairness
    const playerIds = Object.keys(players).filter(id => !players[id].isSpectator);
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
      
      const player = session.players[playerId].nickname;
      await this.addLog(sessionId, `${player}님이 [${word}] 단어를 선택했습니다.`);
      await this.addLog(sessionId, `${session.players[winners[0]].nickname}님이 빙고를 완성하여 승리했습니다!`, 'success');
      await this.updateStats(sessionId, winners[0]);
    } else {
      // Next turn
      const turnOrder = session.turnOrder || Object.keys(session.players);
      const currentIndex = turnOrder.indexOf(playerId);
      const nextIndex = (currentIndex + 1) % turnOrder.length;
      updates['bingoGame/currentPlayerId'] = turnOrder[nextIndex];
      
      const player = session.players[playerId].nickname;
      await this.addLog(sessionId, `${player}님이 [${word}] 단어를 선택했습니다.`);
    }

    await update(ref(db, `sessions/${sessionId}`), updates);
  },

  async startDrawGame(sessionId: string, players: Record<string, Player>, settings: any, turnOrder: string[]) {
    if (!db) return;
    
    const playerIds = Object.keys(players).filter(id => !players[id].isSpectator);
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
      
      const player = session.players[playerId].nickname;
      await this.addLog(sessionId, `${player}님이 정답 [${game.word}]을 맞혔습니다! (+10점)`, 'success');
      await this.updateStats(sessionId, playerId, 10);
      await this.updateStats(sessionId, game.presenterId, 5);

      // Move to next turn or end
      await this.nextDrawTurn(sessionId, session, newScores);
    } else {
      // Incorrect guess - Log it or send a message
      const player = session.players[playerId].nickname;
      // We can add a log or just a chat message. Let's add a system message to chat for better visibility
      await this.sendMessage(sessionId, playerId, player, `오답: ${guess}`, false, false);
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
    
    // Normalize board to 15x15 matrix
    const ensureOmokMatrix = (data: any) => {
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
    };

    const boardMatrix = ensureOmokMatrix(game.board);
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
    } else {
      // Check Draw (Board full)
      const isFull = boardMatrix.every((row: any) => row.every((cell: any) => cell !== 0));
      if (isFull) {
        updates['omokGame/isDraw'] = true;
        updates['status'] = SessionStatus.SUMMARY;
      } else {
        updates['omokGame/currentPlayerId'] = nextPlayerId;
      }
    }

    await update(sessionRef, updates);
    const player = session.players[playerId].nickname;
    await this.addLog(sessionId, `${player}님이 (${x}, ${y}) 위치에 돌을 놓았습니다.`);
    
    if (updates['omokGame/winner']) {
      await this.addLog(sessionId, `${player}님이 오목 대전에서 승리했습니다!`, 'success');
      await this.updateStats(sessionId, playerId);
      
      // AI Match Leaderboard
      if (game.isAIMatch && playerId !== 'AI_PLAYER' && game.difficulty === 7) {
        const timeTaken = (Date.now() - (game.startTime || Date.now())) / 1000;
        const moveCount = (game.moveCount || 0) + 1;
        // Score calculation: Base 10000 - (time * 10) - (moves * 50)
        const score = Math.max(0, 10000 - Math.floor(timeTaken * 10) - (moveCount * 50));
        
        // Record to Hall of Fame
        await this.recordLeaderboard(sessionId, 'OMOK_HOF', playerId, player, score, { timeTaken, moveCount });
        updates['omokGame/lastScore'] = score;
      }
    }
    
    if (updates['omokGame/isDraw']) await this.addLog(sessionId, `오목 대전이 무승부로 종료되었습니다.`, 'warning');

    // Trigger AI move if next player is AI
    if (!updates['omokGame/winner'] && !updates['omokGame/isDraw'] && nextPlayerId === 'AI_PLAYER') {
      setTimeout(() => {
        this.makeOmokAIMove(sessionId, nextPlayerId);
      }, 600);
    }
  },

  async makeOmokAIMove(sessionId: string, aiPlayerId: string) {
    if (!db) return;
    const sessionSnap = await get(ref(db, `sessions/${sessionId}`));
    const session = sessionSnap.val();
    if (!session || !session.omokGame || session.omokGame.currentPlayerId !== aiPlayerId) return;

    const game = session.omokGame;
    
    // Normalize board to 15x15 matrix
    const ensureOmokMatrix = (data: any) => {
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
    };

    const boardMatrix = ensureOmokMatrix(game.board);
    
    const aiStone = String(aiPlayerId).trim() === String(game.blackPlayerId).trim() ? 1 : 2;
    const playerStone = aiStone === 1 ? 2 : 1;
    const difficulty = game.difficulty || 1;

    const bestMove = this.getOmokBestMove(boardMatrix, aiStone, playerStone, difficulty);
    if (bestMove) {
      await this.placeOmokStone(sessionId, aiPlayerId, bestMove.x, bestMove.y);
    }
  },

  getOmokBestMove(board: number[][], aiStone: number, playerStone: number, difficulty: number) {
    // Difficulty adjustments for 7 levels
    // Level 1: 55% mistake chance, Level 2: 30%, Level 3: 15%, Level 4+: 0%
    const mistakeChance = difficulty === 1 ? 0.55 : (difficulty === 2 ? 0.30 : (difficulty === 3 ? 0.15 : 0));
    const randomness = Math.max(0, (7 - difficulty) * 1000); 
    const searchRange = difficulty >= 6 ? 3 : (difficulty >= 4 ? 2 : 1);

    // Chance to make a completely random move near existing stones
    if (Math.random() < mistakeChance) {
      const validMoves: {x: number, y: number}[] = [];
      for (let y = 0; y < 15; y++) {
        for (let x = 0; x < 15; x++) {
          if (board[y][x] === 0) {
            let hasNeighbor = false;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const ny = y + dy, nx = x + dx;
                if (ny >= 0 && ny < 15 && nx >= 0 && nx < 15 && board[ny][nx] !== 0) {
                  hasNeighbor = true;
                  break;
                }
              }
              if (hasNeighbor) break;
            }
            if (hasNeighbor) {
              if (aiStone === 1 && this.checkOmokForbiddenMove(board, x, y, aiStone)) continue;
              validMoves.push({x, y});
            }
          }
        }
      }
      if (validMoves.length > 0) return validMoves[Math.floor(Math.random() * validMoves.length)];
    }

    const getCandidates = (currentBoard: number[][], stone: number, opponent: number) => {
      const candidates: {x: number, y: number, score: number}[] = [];
      for (let y = 0; y < 15; y++) {
        for (let x = 0; x < 15; x++) {
          if (currentBoard[y][x] === 0) {
            let hasNeighbor = false;
            for (let dy = -searchRange; dy <= searchRange; dy++) {
              for (let dx = -searchRange; dx <= searchRange; dx++) {
                const ny = y + dy, nx = x + dx;
                if (ny >= 0 && ny < 15 && nx >= 0 && nx < 15 && currentBoard[ny][nx] !== 0) {
                  hasNeighbor = true;
                  break;
                }
              }
              if (hasNeighbor) break;
            }
            if (!hasNeighbor && currentBoard.some(row => row.some(cell => cell !== 0))) continue;
            if (stone === 1 && this.checkOmokForbiddenMove(currentBoard, x, y, stone)) continue;

            const score = this.evaluateOmokPosition(currentBoard, x, y, stone, opponent, difficulty);
            candidates.push({x, y, score});
          }
        }
      }
      return candidates.sort((a, b) => b.score - a.score);
    };

    const aiCandidates = getCandidates(board, aiStone, playerStone);
    if (aiCandidates.length === 0) return null;

    // For Level 7, use 2-ply Minimax
    if (difficulty === 7) {
      let bestMinimaxScore = -Infinity;
      let bestMove = aiCandidates[0];

      // Only check top 15 candidates for performance
      const topCandidates = aiCandidates.slice(0, 15);
      
      for (const move of topCandidates) {
        // AI wins immediately
        if (move.score >= 1000000) return move;

        board[move.y][move.x] = aiStone;
        
        // Find player's best response
        const playerCandidates = getCandidates(board, playerStone, aiStone);
        let playerBestScore = 0;
        if (playerCandidates.length > 0) {
          playerBestScore = playerCandidates[0].score;
        }
        
        // Minimax score: AI score - Player's best response score
        const minimaxScore = move.score - playerBestScore;
        
        if (minimaxScore > bestMinimaxScore) {
          bestMinimaxScore = minimaxScore;
          bestMove = move;
        }
        
        board[move.y][move.x] = 0; // Backtrack
      }
      return bestMove;
    }

    // For other levels, pick from best moves with randomness
    const maxScore = aiCandidates[0].score;
    const bestMoves = aiCandidates.filter(c => c.score >= maxScore - randomness);
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  },

  evaluateOmokPosition(board: number[][], x: number, y: number, aiStone: number, playerStone: number, difficulty: number) {
    let aiTotalScore = 0;
    let playerTotalScore = 0;
    let aiThreats = { fours: 0, openThrees: 0 };
    let playerThreats = { fours: 0, openThrees: 0 };

    const directions = [[1, 0], [0, 1], [1, 1], [1, -1]];
    
    for (const [dx, dy] of directions) {
      const aiScore = this.evaluateOmokLine(board, x, y, dx, dy, aiStone, playerStone, difficulty);
      const playerScore = this.evaluateOmokLine(board, x, y, dx, dy, playerStone, aiStone, difficulty);
      
      aiTotalScore += aiScore;
      playerTotalScore += playerScore;

      // Identify specific threats for combination detection
      if (aiScore >= 100000) aiThreats.fours++; // Open 4
      else if (aiScore >= 10000) {
        if (this.isOpenThree(board, x, y, dx, dy, aiStone)) aiThreats.openThrees++;
        else aiThreats.fours++; // Blocked 4
      }

      if (playerScore >= 100000) playerThreats.fours++;
      else if (playerScore >= 10000) {
        if (this.isOpenThree(board, x, y, dx, dy, playerStone)) playerThreats.openThrees++;
        else playerThreats.fours++;
      }
    }

    // Combination bonuses (Double Three, Four-Three, etc.)
    // These are extremely powerful for White (AI if White)
    if (aiThreats.fours >= 2 || (aiThreats.fours >= 1 && aiThreats.openThrees >= 1)) aiTotalScore += 500000;
    if (aiThreats.openThrees >= 2) aiTotalScore += 300000;

    if (playerThreats.fours >= 2 || (playerThreats.fours >= 1 && playerThreats.openThrees >= 1)) playerTotalScore += 500000;
    if (playerThreats.openThrees >= 2) playerTotalScore += 300000;

    // Prioritize defense if player is about to win
    let defenseMultiplier = 1.1;
    if (difficulty >= 5) defenseMultiplier = 1.5;
    else if (difficulty <= 2) defenseMultiplier = 0.8;
    
    // If player is Black, their forbidden moves are not threats
    if (playerStone === 1) {
      board[y][x] = playerStone;
      if (this.checkOmokForbiddenMove(board, x, y, playerStone)) {
        playerTotalScore = 0;
      }
      board[y][x] = 0;
    }

    if (playerTotalScore >= 10000) return playerTotalScore * defenseMultiplier;
    
    if (difficulty === 7 && aiTotalScore >= 10000) return aiTotalScore * 2;

    return aiTotalScore + playerTotalScore;
  },

  evaluateOmokLine(board: number[][], x: number, y: number, dx: number, dy: number, stone: number, opponent: number, difficulty: number) {
    let count = 1;
    let blocked = 0;

    // Forward
    for (let i = 1; i < 5; i++) {
      const nx = x + dx * i;
      const ny = y + dy * i;
      if (nx < 0 || nx >= 15 || ny < 0 || ny >= 15) {
        blocked++;
        break;
      }
      if (board[ny][nx] === stone) count++;
      else if (board[ny][nx] === 0) break;
      else {
        blocked++;
        break;
      }
    }

    // Backward
    for (let i = 1; i < 5; i++) {
      const nx = x - dx * i;
      const ny = y - dy * i;
      if (nx < 0 || nx >= 15 || ny < 0 || ny >= 15) {
        blocked++;
        break;
      }
      if (board[ny][nx] === stone) count++;
      else if (board[ny][nx] === 0) break;
      else {
        blocked++;
        break;
      }
    }

    let score = count;
    if (count === 5) score = 1000000; // Win
    else if (count > 5) {
      score = (stone === 1 ? 0 : 1000000); // Overline is win for White, forbidden for Black
    }
    else if (count === 4) {
      score = (blocked === 0 ? 100000 : 10000); // Open 4 vs Blocked 4
    }
    else if (count === 3) {
      score = (blocked === 0 ? 10000 : 500);    // Open 3 vs Blocked 3
    }
    else if (count === 2) {
      score = (blocked === 0 ? 200 : 20);       // Open 2 vs Blocked 2
    }

    // Scale score by difficulty for levels 1-3 to make AI "blind" to some threats
    if (difficulty <= 3) {
      const awareness = difficulty / 4; // Lv.1: 0.25, Lv.2: 0.5, Lv.3: 0.75
      score = Math.floor(score * awareness);
    }
    return score;
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
      // For each direction, check if placing a stone at (x,y) creates a 4
      // A 4 is exactly 4 stones in a row (or more, but overline is checked separately)
      // Actually, for double four, any 4 counts.
      
      // We need to check all possible 5-cell windows that include (x,y)
      for (let startOffset = -4; startOffset <= 0; startOffset++) {
        let stones = 0;
        let possible = true;
        for (let i = 0; i < 5; i++) {
          const nx = x + dx * (startOffset + i);
          const ny = y + dy * (startOffset + i);
          if (nx < 0 || nx >= 15 || ny < 0 || ny >= 15) {
            possible = false;
            break;
          }
          if (board[ny][nx] === stone || (nx === x && ny === y)) stones++;
          else if (board[ny][nx] !== 0) {
            possible = false;
            break;
          }
        }
        
        if (possible && stones === 4) {
          // This window can become a 5. Is it a 4 right now?
          // To be a "4", it must be able to become a 5 in ONE move.
          // Since we just placed a stone at (x,y), we check if this line has 4 stones.
          
          // Count consecutive stones in this direction
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
          
          if (count === 4) {
            fourCount++;
            break; // Found a 4 in this direction
          }
          
          // Also check for "jump" fours like OO.OO
          // This is more complex. Let's use a simpler check:
          // If we place a stone, how many ways can we win in one more move?
          // If there are two or more ways to win (creating a 5), it's a double four.
        }
      }
    }
    
    // Re-implementing more accurately:
    fourCount = 0;
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
        if (user && session.players[user.uid]) {
          await this.recordLeaderboard(sessionId, 'MINESWEEPER', user.uid, session.players[user.uid].nickname, score);
        } else {
          await this.recordLeaderboard(sessionId, 'MINESWEEPER', session.players[session.hostId].id, session.players[session.hostId].nickname, score);
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
          if (user && session.players[user.uid]) {
            await this.recordLeaderboard(sessionId, 'MINESWEEPER', user.uid, session.players[user.uid].nickname, score);
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
        if (user && session.players[user.uid]) {
          await this.recordLeaderboard(sessionId, 'OFFICE_2048', user.uid, session.players[user.uid].nickname, game.score);
        } else {
          await this.recordLeaderboard(sessionId, 'OFFICE_2048', session.players[session.hostId].id, session.players[session.hostId].nickname, game.score);
        }
      }
      if (game.board.some((row: any) => row.includes(2048))) {
        game.status = 'WON';
        await this.addLog(sessionId, `축하합니다! 사장(2048)으로 승진했습니다!`, 'success');
        const user = auth?.currentUser;
        if (user && session.players[user.uid]) {
          await this.recordLeaderboard(sessionId, 'OFFICE_2048', user.uid, session.players[user.uid].nickname, game.score);
        } else {
          await this.recordLeaderboard(sessionId, 'OFFICE_2048', session.players[session.hostId].id, session.players[session.hostId].nickname, game.score);
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
      if (user && session.players[user.uid]) {
        await this.recordLeaderboard(sessionId, 'SUDOKU', user.uid, session.players[user.uid].nickname, score);
      } else {
        await this.recordLeaderboard(sessionId, 'SUDOKU', session.players[session.hostId].id, session.players[session.hostId].nickname, score);
      }
    }

    await update(ref(db, `sessions/${sessionId}`), { sudokuGame: game });
  },

  // --- Office Life ---
  addOfficeLifeLog(game: OfficeLifeGameState, message: string) {
    if (!game.logs) game.logs = [];
    game.logs.unshift({ message, timestamp: Date.now() });
    if (game.logs.length > 50) game.logs.pop(); // Keep last 50 logs
  },

  async startOfficeLifeGame(sessionId: string, players: Record<string, Player>, turnOrder?: string[], mode: 'INDIVIDUAL' | 'TEAM' = 'INDIVIDUAL') {
    if (!db) return;
    
    const order = turnOrder || Object.keys(players);
    const playerStates: Record<string, any> = {};
    
    order.forEach(pid => {
      playerStates[pid] = {
        position: 0,
        assets: 2000,
        teamId: mode === 'TEAM' ? (players[pid].teamId || 'TEAM_A') : 'INDIVIDUAL',
        items: [],
        isJailed: false,
        jailTurns: 0,
        rank: OFFICE_RANKS[0].name,
        rankIndex: 0
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

    const dice = Math.floor(Math.random() * 6) + 1;
    game.lastDice = dice;
    
    const oldPos = pState.position || 0;
    let newPos = (oldPos + dice) % 40;
    
    // Salary check (passed HR)
    if (newPos < oldPos) {
      const rank = OFFICE_RANKS[pState.rankIndex || 0] || OFFICE_RANKS[0];
      let salary = rank.salary;
      
      // Planner skill: 20% bonus
      if (pState.roleId === 'PLANNER') {
        salary = Math.floor(salary * 1.2);
      }
      
      pState.assets = (pState.assets || 0) + salary;
      pState.passedHRThisTurn = true;
      await this.addLog(sessionId, `${session.players?.[playerId]?.nickname || '플레이어'}님이 인사팀을 통과하여 월급 ${salary}만원을 수령했습니다!`, 'success');
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
      // No action needed
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
    
    game.waitingForAction = 'NONE';
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
    
    game.waitingForAction = 'NONE';
    
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

    game.waitingForAction = 'NONE';
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

    game.waitingForAction = 'NONE';
    game.currentTurnIndex = ((game.currentTurnIndex || 0) + 1) % (turnOrder.length || 1);
    
    await update(ref(db, `sessions/${sessionId}/officeLifeGame`), game);
  }
};
