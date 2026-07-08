import { Card, Suit } from './cardUtils';

export interface Player {
  id: string;
  name: string;
  isBot: boolean;
  hand: Card[];
}

export interface GameState {
  status: 'LOBBY' | 'PLAYING' | 'FINISHED';
  players: Player[];
  currentPlayerIndex: number;
  direction: 1 | -1;
  deck: Card[];
  discardPile: Card[];
  currentSuit?: Suit;
  logs: string[];
  winner?: string;
  penaltyStack: number;
}

export const getNextPlayerIndex = (currentIndex: number, direction: 1 | -1, totalPlayers: number): number => {
  let next = currentIndex + direction;
  if (next >= totalPlayers) return next % totalPlayers;
  if (next < 0) return (next % totalPlayers + totalPlayers) % totalPlayers;
  return next;
};
