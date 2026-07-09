const fs = require('fs');

let path = 'src/services/sessionService.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/playerState\.hand\.length >= 20/g, 'playerState.hand.length > 12');
code = code.replace(/카드가 20장 이상이 되어 파산/g, '카드가 12장을 초과하여 파산');
fs.writeFileSync(path, code);

path = 'src/components/OneCard.tsx';
code = fs.readFileSync(path, 'utf8');

code = code.replace(/handSize >= 20/g, 'handSize > 12');
code = code.replace(/20장 초과/g, '12장 초과');
code = code.replace(/handSize >= 15/g, 'handSize > 9');

fs.writeFileSync(path, code);
console.log('patched over 12');
