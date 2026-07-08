import { Card, Suit, isPlayable } from './cardUtils';
import { GameState } from './gameLogic';

export const getBotAction = (botHand: Card[], gameState: GameState): { action: 'PLAY', card: Card, changedSuit?: Suit } | { action: 'DRAW' } => {
  const topCard = gameState.discardPile[gameState.discardPile.length - 1];
  const currentSuit = gameState.currentSuit;
  const penaltyStack = gameState.penaltyStack;

  const playableCards = botHand.filter(card => isPlayable(card, topCard, currentSuit, penaltyStack));

  if (playableCards.length > 0) {
    let selectedCard: Card;
    
    // 1. 방어 가능한 공격 카드 (penaltyStack이 있을 때)
    if (penaltyStack > 0) {
      selectedCard = playableCards[0]; 
    } else {
      const getPriority = (card: Card) => {
        if (card.suit === 'joker') return 1; // 2순위: Joker
        if (card.rank === 'A') return 2;     // 3순위: A
        if (card.rank === '2') return 3;     // 4순위: 2
        if (card.rank === 'J') return 4;     // 5순위: J
        if (card.rank === 'Q') return 5;     // 6순위: Q
        if (card.rank === '7') return 6;     // 7순위: 7
        
        // 8순위: 현재 손패에서 가장 많이 가진 무늬의 일반 카드
        const suitCounts: Record<string, number> = { spades: 0, hearts: 0, diamonds: 0, clubs: 0 };
        botHand.forEach(c => {
          if (c.suit !== 'joker') suitCounts[c.suit as keyof typeof suitCounts]++;
        });
        const maxCount = Math.max(...Object.values(suitCounts));
        if (suitCounts[card.suit as keyof typeof suitCounts] === maxCount) {
          return 7;
        }
        
        return 8; // 9순위: 무작위 카드 (나머지)
      };

      playableCards.sort((a, b) => {
        const diff = getPriority(a) - getPriority(b);
        if (diff === 0) return Math.random() - 0.5; // 같은 우선순위면 무작위
        return diff;
      });
      selectedCard = playableCards[0];
    }
    
    let changedSuit: Suit | undefined;
    if (selectedCard.rank === '7' || selectedCard.suit === 'joker') {
      const suitCounts: Record<string, number> = { spades: 0, hearts: 0, diamonds: 0, clubs: 0 };
      botHand.forEach(c => {
        if (c.suit !== 'joker') suitCounts[c.suit as keyof typeof suitCounts]++;
      });
      const maxCount = Math.max(...Object.values(suitCounts));
      const candidates = Object.keys(suitCounts).filter(s => suitCounts[s as keyof typeof suitCounts] === maxCount);
      changedSuit = candidates[Math.floor(Math.random() * candidates.length)] as Suit;
    }

    return { action: 'PLAY', card: selectedCard, changedSuit };
  }

  return { action: 'DRAW' };
};
