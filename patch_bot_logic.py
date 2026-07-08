import re

with open('src/game/botLogic.ts', 'r', encoding='utf-8') as f:
    content = f.read()

target = """    let changedSuit: Suit | undefined;
    if (selectedCard.rank === '7' || selectedCard.suit === 'joker') {
      const suitCounts = { spades: 0, hearts: 0, diamonds: 0, clubs: 0 };
      botHand.forEach(c => {
        if (c.suit !== 'joker') suitCounts[c.suit as keyof typeof suitCounts]++;
      });
      const maxSuit = Object.keys(suitCounts).reduce((a, b) => suitCounts[a as keyof typeof suitCounts] > suitCounts[b as keyof typeof suitCounts] ? a : b);
      changedSuit = maxSuit as Suit;
    }"""

replace = """    let changedSuit: Suit | undefined;
    if (selectedCard.rank === '7' || selectedCard.suit === 'joker') {
      const suitCounts: Record<string, number> = { spades: 0, hearts: 0, diamonds: 0, clubs: 0 };
      botHand.forEach(c => {
        if (c.suit !== 'joker') suitCounts[c.suit as keyof typeof suitCounts]++;
      });
      const maxCount = Math.max(...Object.values(suitCounts));
      const candidates = Object.keys(suitCounts).filter(s => suitCounts[s as keyof typeof suitCounts] === maxCount);
      changedSuit = candidates[Math.floor(Math.random() * candidates.length)] as Suit;
    }"""

content = content.replace(target, replace)

with open('src/game/botLogic.ts', 'w', encoding='utf-8') as f:
    f.write(content)
