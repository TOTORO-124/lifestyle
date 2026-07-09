const fs = require('fs');

let path = 'src/services/sessionService.ts';
let code = fs.readFileSync(path, 'utf8');

const targetStr = `      let changedSuit: string | undefined;
      if (selectedCard.rank === '7' || selectedCard.suit === 'joker') {
        const suitCounts: Record<string, number> = { spades: 0, hearts: 0, diamonds: 0, clubs: 0 };`;

const replaceStr = `      let changedSuit: string | undefined;
      if (selectedCard.rank === '7') {
        const suitCounts: Record<string, number> = { spades: 0, hearts: 0, diamonds: 0, clubs: 0 };`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync(path, code);
console.log('patched joker bot');
