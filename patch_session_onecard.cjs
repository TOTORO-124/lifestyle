const fs = require('fs');
let code = fs.readFileSync('src/services/sessionService.ts', 'utf8');

// add imports
if (!code.includes('import { createDeck')) {
  code = code.replace("import { ARENA_SKILLS", "import { createDeck, shuffleDeck, isPlayable } from '../game/cardUtils';\nimport { ARENA_SKILLS");
}

code = code.replace(
`        session.players[cpuId] = {
          id: cpuId,
          nickname: \`컴퓨터 \${i}\`,
          isBot: true,
        };`,
`        session.players[cpuId] = {
          id: cpuId,
          nickname: \`컴퓨터 \${i}\`,
          isBot: true,
          isHost: false,
          isAlive: true,
          isReady: true,
          isConnected: true,
        };`
);

fs.writeFileSync('src/services/sessionService.ts', code);
console.log('patched');
