const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

const targetStr = `export interface OneCardGameState {
  status: 'PLAYING' | 'FINISHED';
  winnerId?: string;
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
}`;

const replaceStr = `export interface OneCardGameState {
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
}`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync('src/types.ts', code);
console.log('patched types');
