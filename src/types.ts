export enum GameType {
  LIAR = 'LIAR',
  MAFIA = 'MAFIA',
  OMOK = 'OMOK',
  BINGO = 'BINGO',
  DRAW = 'DRAW',
  MINESWEEPER = 'MINESWEEPER',
  OFFICE_2048 = 'OFFICE_2048',
  OLD_MAID = 'OLD_MAID',
  OFFICE_LIFE = 'OFFICE_LIFE',
  COSMIC_JACKPOT = 'COSMIC_JACKPOT',
  YUT_NORI = 'YUT_NORI',
  SUIKA = 'SUIKA',
  ALKKAGI = 'ALKKAGI',
  ONECARD = 'ONECARD',
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
  uid?: string;
  nickname: string;
  isHost: boolean;
  isAlive: boolean;
  isReady: boolean;
  isConnected: boolean;
  isSpectator?: boolean;
  isAI?: boolean;
  isBot?: boolean;
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
  difficulty?: number; // 1: 인턴, 2: 사원, 3: 주임, 4: 대리, 5: 과장, 6: 차장, 7: 부장
  ruleType?: 'RENJU' | 'FREE'; // RENJU: Black restricted, FREE: No restrictions
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
  uid?: string;
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

export interface OldMaidCard {
  id: string;
  uid?: string;
  value: string;
}

export interface OldMaidGameState {
  status: 'PLAYING' | 'FINISHED';
  loserId?: string;
  startTime: number;
  players: Record<string, {
    hand: OldMaidCard[];
    isActive: boolean;
  }>;
  turnOrder: string[];
  currentTurnIndex: number;
  message?: string;
  effect?: string | null;
  effectTimestamp?: number;
  drawingState?: any;
  turnStartTime?: number;
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



export interface ArenaItem {
  id: string;
  uid?: string;
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
  uid?: string;
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
  uid?: string;
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
  uid?: string;
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

export interface SuikaGameState {
  score: number;
  bestScore: number;
  status: 'PLAYING' | 'LOST';
  startTime?: number;
}

export interface CosmicJackpotGameState {
  round: number;
  money: bigint;
  quota: bigint;
  status: 'PLAYING' | 'FINISHED';
  winnerId?: string;
  startTime: number;
}

export interface YutNoriGameState {
  status: 'PLAYING' | 'FINISHED';
  mode: 'INDIVIDUAL' | 'TEAM';
  turnOrder: string[]; // player IDs or team IDs
  currentTurnIndex: number;
  teamPlayers?: Record<string, string[]>;
  teamCurrentTurnIndex?: Record<string, number>;
  pieces: Record<string, { id: string, position: number, count: number, path: number[] }[]>; // teamId/playerId -> pieces
  throwResults: string[];
  canThrow: boolean;
  winner?: string;
  rankings?: string[]; // Array of player/team IDs in finishing order
  lastUpdate: number;
  currentSticks?: { isFlat: boolean, isMarked: boolean, rotation: number, offsetX: number, offsetY: number }[];
  isThrowing?: boolean;
  turnStartTime?: number;
}

export interface AlkkagiPieceState {
  id: string;
  uid?: string;
  team: 'BLACK' | 'WHITE';
  x: number;
  y: number;
  isAlive: boolean;
}

export interface AlkkagiGameState {
  status: 'PLAYING' | 'FINISHED';
  currentPlayerId: string;
  blackPlayerId: string;
  whitePlayerId: string;
  pieces: Record<string, AlkkagiPieceState>;
  winnerId?: string | null;
  action?: {
    actionId: string;
    pieceId: string;
    vx: number;
    vy: number;
    initialPieces: Record<string, AlkkagiPieceState>;
    finalPieces: Record<string, AlkkagiPieceState>;
    nextPlayerId: string;
    timestamp: number;
  };
  lastUpdate: number;
}

export interface LeaderboardEntry {
  playerId: string;
  nickname: string;
  score: number;
  timestamp: number;
}

export interface HallOfFameEntry {
  id: string;
  uid?: string;
  themeId: string;
  themeName: string;
  playerNicknames: string[];
  completionTime: number; // in seconds
  hintsUsed: number;
  difficulty: string;
  timestamp: number;
}


export interface OneCardCard {
  id: string;
  uid?: string;
  suit: 'spades' | 'hearts' | 'diamonds' | 'clubs' | 'joker';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'black' | 'color';
}

export interface OneCardGameState {
  status: 'PLAYING' | 'FINISHED';
  winnerId?: string;
  loserId?: string;
  rankings?: string[];
  deck: OneCardCard[];
  discardPile: OneCardCard[];
  players: Record<string, {
    hand: OneCardCard[];
  }>;
  turnOrder: string[];
  currentTurnIndex: number;
  direction: 1 | -1;
  currentSuit?: 'spades' | 'hearts' | 'diamonds' | 'clubs' | 'joker';
  penaltyStack: number;
}

export interface Session {
  id: string;
  uid?: string;
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
  oldMaidGame?: OldMaidGameState;
  officeLifeGame?: OfficeLifeGameState;
  cyberArenaGame?: CyberArenaGameState;
  suikaGame?: SuikaGameState;
  cosmicJackpot?: CosmicJackpotGameState;
  yutNoriGame?: YutNoriGameState;
  alkkagiGame?: AlkkagiGameState;
  oneCardGame?: OneCardGameState;
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
    flappyBirdMode?: 'SOLO' | 'AI' | 'PVP';
    flappyBirdDifficulty?: 'EASY' | 'NORMAL' | 'HARD' | 'DEVIL';
    officeLifeMode?: 'INDIVIDUAL' | 'TEAM';
    yutNoriMode?: 'INDIVIDUAL' | 'TEAM';
    yutNoriPieceCount?: number;
    cyberArenaPvE?: boolean;
  };
  turnOrder?: string[];
  messages?: Record<string, ChatMessage>;
  logs?: Record<string, GameLog>;
  stats?: Record<string, { wins: number; totalScore: number }>;
}

export interface ChatMessage {
  id: string;
  uid?: string;
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
