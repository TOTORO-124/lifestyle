export enum GameType {
  LIAR = 'LIAR',
  MAFIA = 'MAFIA',
  OMOK = 'OMOK',
  BINGO = 'BINGO',
  DRAW = 'DRAW',
}

export enum SessionStatus {
  LOBBY = 'LOBBY',
  REVEAL = 'REVEAL',
  PLAYING = 'PLAYING',
  VOTING = 'VOTING',
  VOTE_RESULT = 'VOTE_RESULT',
  NIGHT = 'NIGHT',
  SUMMARY = 'SUMMARY',
  PREPARING = 'PREPARING', // Added for Bingo setup
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
  score?: number;
}

export interface LiarGameState {
  mode: LiarMode;
  category: string;
  commonWord: string;
  liarWord: string;
  liarPlayerId: string;
  spyPlayerId?: string;
  lastVotedPlayerId?: string;
  winner?: 'LIAR' | 'CITIZEN';
}

export interface MafiaGameState {
  phase: MafiaPhase;
  round: number;
  mafiaTargets: Record<string, string>; // mafiaPlayerId -> targetPlayerId
  doctorTarget?: string;
  policeTarget?: string;
  eliminatedPlayerId?: string;
  winner?: 'MAFIA' | 'CITIZEN';
  nightResult?: {
    eliminatedPlayerId?: string;
    savedPlayerId?: string;
    investigatedPlayerId?: string;
    investigatedRole?: string;
  };
}

export interface OmokGameState {
  board: number[][]; // 0: empty, 1: black, 2: white
  currentPlayerId: string;
  blackPlayerId: string;
  whitePlayerId: string;
  winner?: string; // playerId
  winningLine?: {x: number, y: number}[];
  isDraw?: boolean;
}

export interface BingoGameState {
  boards: Record<string, string[][]>; // playerId -> 5x5 board
  markedWords: string[];
  currentPlayerId: string;
  winner?: string;
  targetLines: number;
  category: string;
}

export interface DrawGameState {
  presenterId: string;
  word: string;
  category: string;
  canvasData?: string; // Base64 or path data
  round: number;
  maxRounds: number;
  timer: number;
  lastGuesserId?: string;
  scores: Record<string, number>;
}

export interface GameLog {
  id: string;
  type: 'info' | 'success' | 'warning';
  content: string;
  timestamp: number;
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
  omokGame?: OmokGameState;
  bingoGame?: BingoGameState;
  drawGame?: DrawGameState;
  settings: {
    maxPlayers: number;
    liarMode?: LiarMode;
    liarCategory?: string;
    mafiaCount?: number;
    doctorCount?: number;
    policeCount?: number;
    bingoLines?: number;
    bingoCategory?: string;
    drawRounds?: number;
    drawTime?: number;
  };
  turnOrder?: string[];
  messages?: Record<string, ChatMessage>;
  logs?: Record<string, GameLog>;
  stats?: Record<string, { wins: number; totalScore: number }>;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  isSystem?: boolean;
  isSpectatorChat?: boolean;
}

export interface Topic {
  category: string;
  pairs: {
    word1: string;
    word2: string;
  }[];
}
