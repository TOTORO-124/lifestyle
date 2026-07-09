const fs = require('fs');

let path = 'src/components/OneCard.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetStr = `    if (card.rank === '7' || card.suit === 'joker') {
      setPendingCardIndex(index);
      setSuitPickerOpen(true);
      return;
    }`;

const replaceStr = `    if (card.rank === '7') {
      setPendingCardIndex(index);
      setSuitPickerOpen(true);
      return;
    }`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync(path, code);
console.log('patched joker ui');
