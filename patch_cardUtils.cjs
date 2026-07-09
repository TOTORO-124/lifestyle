const fs = require('fs');
let path = 'src/game/cardUtils.ts';

const newCode = `export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs' | 'joker';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'black' | 'color';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export const createDeck = (): Card[] => {
  const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
  const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: Card[] = [];
  
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ id: \`\${suit}-\${rank}\`, suit, rank });
    }
  }
  
  deck.push({ id: 'joker-black', suit: 'joker', rank: 'black' });
  deck.push({ id: 'joker-color', suit: 'joker', rank: 'color' });
  
  return deck;
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const getAttackValue = (card: Card): number => {
  if (card.suit === 'joker' && card.rank === 'color') return 7;
  if (card.suit === 'joker' && card.rank === 'black') return 5;
  if (card.rank === 'A' && card.suit === 'spades') return 5;
  if (card.rank === 'A') return 3;
  if (card.rank === '2') return 2;
  return 0;
};

export const isAttackCard = (card: Card): boolean => {
  return getAttackValue(card) > 0;
};

export const isPlayable = (card: Card, topCard: Card, currentSuit?: Suit, penaltyStack: number = 0): boolean => {
  const isJoker = card.suit === 'joker';
  
  if (penaltyStack > 0) {
    // 3 방어 규칙
    if (card.rank === '3' && card.suit === 'spades' && (topCard.suit === 'joker' || (topCard.rank === 'A' && topCard.suit === 'spades'))) return true; // 스페이드 3은 조커와 스페이드 A 방어
    if (card.rank === '3' && currentSuit && card.suit === currentSuit && getAttackValue(topCard) <= 3) return true; // 같은 무늬의 3은 2나 A 방어
    
    if (!isAttackCard(card)) return false;
    
    const topAttack = getAttackValue(topCard);
    const cardAttack = getAttackValue(card);
    
    if (topAttack === 7 && cardAttack < 7) return false;
    if (topAttack === 5 && cardAttack < 5) return false;
    if (topAttack === 3 && cardAttack < 3) return false;
    
    if (isJoker) return true;
    if (cardAttack >= topAttack && card.suit === 'spades' && card.rank === 'A' && topCard.suit === 'joker') return true; // 스페이드 A는 블랙 조커 방어
    
    // 일반적인 방어 (무늬가 같거나 숫자가 같아야 함)
    if (currentSuit && card.suit === currentSuit) return true;
    if (card.rank === topCard.rank) return true;
    
    return false;
  }
  
  if (isJoker) return true;
  if (currentSuit && card.suit === currentSuit) return true;
  if (card.rank === topCard.rank) return true;
  if (topCard.suit === 'joker' && !currentSuit) return true; // 무늬가 없는 조커 위에는 아무 카드나 낼 수 있음
  
  return false;
};
`;

fs.writeFileSync(path, newCode);
console.log('patched cardUtils');
