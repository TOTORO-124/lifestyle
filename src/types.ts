export enum GameType {
  LIAR = 'LIAR',
  MAFIA = 'MAFIA',
}

export enum SessionStatus {
  LOBBY = 'LOBBY',
  REVEAL = 'REVEAL',
  PLAYING = 'PLAYING',
  VOTING = 'VOTING',
  VOTE_RESULT = 'VOTE_RESULT',
  SUMMARY = 'SUMMARY',
}

export enum LiarMode {
  BASIC = 'BASIC',
  FOOL = 'FOOL',
  SPY = 'SPY',
}

export enum MafiaRole {
  CITIZEN = 'CITIZEN',
  MAFIA = 'MAFIA',
  DOCTOR = 'DOCTOR',
  POLICE = 'POLICE',
}

export enum MafiaPhase {
  NIGHT = 'NIGHT',
  DAY = 'DAY',
}

export interface Player {
  id: string;
  nickname: string;
  isHost: boolean;
  isAlive: boolean;
  isReady: boolean;
  isConnected: boolean;
  role?: string;
  voteTarget?: string;
  hasConfirmedRole?: boolean;
  lastActive?: number;
}

export interface LiarGameState {
  mode: LiarMode;
  category: string;
  commonWord: string;
  liarWord: string;
  liarPlayerId: string;
  spyPlayerId?: string;
  lastVotedPlayerId?: string;
}

export interface MafiaGameState {
  phase: MafiaPhase;
  round: number;
  mafiaTargets: Record<string, string>; // mafiaPlayerId -> targetPlayerId
  doctorTarget?: string;
  policeTarget?: string;
  eliminatedPlayerId?: string;
  winner?: 'MAFIA' | 'CITIZEN';
}

export interface Session {
  id: string;
  gameType: GameType;
  hostId: string;
  status: SessionStatus;
  round: number;
  createdAt: number;
  players: Record<string, Player>;
  liarGame?: LiarGameState;
  mafiaGame?: MafiaGameState;
  settings: {
    maxPlayers: number;
    liarMode?: LiarMode;
    liarCategory?: string;
  };
}

export interface Topic {
  category: string;
  pairs: {
    word1: string;
    word2: string;
  }[];
}
