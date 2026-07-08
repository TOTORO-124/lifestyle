const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const targetStr = `export interface OldMaidGameState {
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
}`;

const replaceStr = `export interface OldMaidGameState {
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
}`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/types.ts', code);
console.log('patched types');
