const fs = require('fs');
const content = fs.readFileSync('src/components/OldMaid.tsx', 'utf8');

let newContent = content.replace(/players\[targetPlayerId\]\.hand\.length/g, '(players[targetPlayerId].hand || []).length');
newContent = newContent.replace(/fromPlayer\.hand\[cardIndex\]/g, '(fromPlayer.hand || [])[cardIndex]');
newContent = newContent.replace(/\[\.\.\.fromPlayer\.hand\]/g, '[...(fromPlayer.hand || [])]');
newContent = newContent.replace(/\[\.\.\.toPlayer\.hand, drawnCard\]/g, '[...(toPlayer.hand || []), drawnCard]');

fs.writeFileSync('src/components/OldMaid.tsx', newContent);
