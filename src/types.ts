export enum GameType {
  LIAR = 'LIAR',
  MAFIA = 'MAFIA',
  OMOK = 'OMOK',
  BINGO = 'BINGO',
  DRAW = 'DRAW',
  MINESWEEPER = 'MINESWEEPER',
  OFFICE_2048 = 'OFFICE_2048',
  SUDOKU = 'SUDOKU',
  OFFICE_LIFE = 'OFFICE_LIFE',
  ESCAPE_ROOM = 'ESCAPE_ROOM',
  CYBER_ARENA = 'CYBER_ARENA',
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

export enum Department {
  DEV = 'DEV',
  SALES = 'SALES',
  DESIGN = 'DESIGN',
  HR = 'HR',
  PLANNING = 'PLANNING',
}

export interface UserProfile {
  uid: string;
  nickname: string;
  department: Department;
  xp: number;
  level: number;
  totalWins: number;
  joinedAt: number;
}

export interface Player {
  id: string;
  nickname: string;
  isHost: boolean;
  isAlive: boolean;
  isReady: boolean;
  isConnected: boolean;
  isSpectator?: boolean;
  isAI?: boolean;
  role?: string;
  voteTarget?: string;
  hasConfirmedRole?: boolean;
  lastActive?: number;
  score?: number;
  teamId?: string;
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
  lastMove?: { x: number; y: number };
  isAIMatch?: boolean;
  difficulty?: number; // 1: 인턴, 2: 사원, 3: 주임, 4: 대리, 5: 과장
  startTime?: number;
  moveCount?: number;
  lastScore?: number;
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

export interface MinesweeperGameState {
  board: {
    isMine: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    neighborMines: number;
  }[][];
  status: 'PLAYING' | 'WON' | 'LOST';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  mineCount: number;
  revealedCount: number;
  startTime?: number;
}

export interface Office2048GameState {
  board: number[][];
  score: number;
  bestScore: number;
  status: 'PLAYING' | 'WON' | 'LOST';
}

export interface SudokuGameState {
  initialBoard: (number | null)[][];
  currentBoard: (number | null)[][];
  solution: number[][];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  status: 'PLAYING' | 'WON';
  mistakes: number;
}

export interface OfficeLifeGameState {
  playerStates: Record<string, {
    position: number;
    assets: number;
    teamId: string;
    items: string[];
    isJailed: boolean;
    jailTurns: number;
    rank: string;
    rankIndex: number;
    roleId?: string;
    passedHRThisTurn?: boolean;
    doubleCount?: number;
    hasDouble?: boolean;
  }>;
  cells: Record<number, {
    ownerId?: string;
    level: number;
    trapType?: string;
    setterId?: string;
  }>;
  currentTurnIndex: number;
  turnOrder: string[];
  status: 'PLAYING' | 'FINISHED';
  winner?: string;
  winnerTeam?: string;
  lastDice?: number;
  lastChanceCard?: {
    title: string;
    message: string;
    type: 'GOOD' | 'BAD' | 'NEUTRAL';
  };
  waitingForAction?: 'SELECT_ROLE' | 'BUY_PROJECT' | 'CHANCE_CARD' | 'BUY_ITEM' | 'PROMOTION_TEST' | 'END_TURN' | 'NONE';
}

export interface EscapeRoomGameState {
  currentRoomId: string;
  solvedPuzzles: string[];
  inventory: string[];
  startTime: number;
  timeLimit: number;
  status: 'PLAYING' | 'WON' | 'LOST';
  hintsUsed: number;
  lastClue?: string;
}

export interface ArenaItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  tags: string[];
  stars: number;
  rarity: number;
  stats: {
    hp?: number;
    maxHp?: number;
    energy?: number;
    maxEnergy?: number;
    shield?: number;
    damage?: number;
    attackSpeed?: number;
    critRate?: number;
    cooldownReduction?: number;
    lifesteal?: number;
  };
  effect?: string;
}

export interface ArenaCharacter {
  id: string;
  name: string;
  description: string;
  baseHp: number;
  baseEnergy: number;
  baseDamage: number;
  baseAttackSpeed: number;
  skills: string[];
  passive: {
    name: string;
    description: string;
  };
}

export interface ArenaSkill {
  id: string;
  name: string;
  description: string;
  energyCost: number;
  damage?: number;
  damageMultiplier?: number;
  heal?: number;
  shield?: number;
  energyGain?: number;
  effect?: string;
  cooldown: number;
  range?: number;
  speed?: number; // For projectiles
  radius?: number; // For AoE
  type: 'PROJECTILE' | 'INSTANT' | 'BUFF' | 'DASH';
}

export interface ArenaProjectile {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  createdAt: number;
  expiresAt: number;
}

export interface CyberArenaGameState {
  playerStats: Record<string, { 
    hp: number; 
    maxHp: number; 
    energy: number; 
    maxEnergy: number; 
    shield: number; 
    damage: number;
    attackSpeed: number;
    critRate: number;
    cooldownReduction: number;
    lifesteal: number;
    credits: number;
    characterId?: string;
    inventory: ArenaItem[];
    synergies: Record<string, number>;
    x: number;
    y: number;
    rotation: number;
    lastSkillTime: Record<string, number>;
    deferredDamage: number; // For Milk character
    buffs: { type: string; value: number; expiresAt: number }[];
  }>;
  projectiles: Record<string, ArenaProjectile>;
  inventory: Record<string, ArenaItem[]>;
  shopItems: Record<string, ArenaItem[]>;
  status: 'PLAYING' | 'FINISHED' | 'SHOP' | 'SELECT_CHARACTER';
  winnerId?: string;
  isPvE: boolean;
  aiDifficulty: number;
  startTime: number;
  lastUpdate: number;
  currentRound: number;
  roundsWon: Record<string, number>;
  phaseTimer: number;
  streakCount: Record<string, number>; // For loser bonus
}

export interface LeaderboardEntry {
  playerId: string;
  nickname: string;
  score: number;
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
  minesweeperGame?: MinesweeperGameState;
  office2048Game?: Office2048GameState;
  sudokuGame?: SudokuGameState;
  officeLifeGame?: OfficeLifeGameState;
  escapeRoomGame?: EscapeRoomGameState;
  cyberArenaGame?: CyberArenaGameState;
  leaderboards?: Record<string, LeaderboardEntry[]>;
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
    minesweeperDifficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    sudokuDifficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    officeLifeMode?: 'INDIVIDUAL' | 'TEAM';
    escapeRoomDifficulty?: 'EASY' | 'NORMAL' | 'HARD';
    cyberArenaPvE?: boolean;
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
