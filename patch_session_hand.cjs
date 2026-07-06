const fs = require('fs');
const content = fs.readFileSync('src/services/sessionService.ts', 'utf8');

let newContent = content.replace(/const hand = \[\.\.\.game\.players\[playerId\]\.hand\];/g, 'const hand = [...(game.players[playerId].hand || [])];');
fs.writeFileSync('src/services/sessionService.ts', newContent);
