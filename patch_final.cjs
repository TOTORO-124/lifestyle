const fs = require('fs');
let code = fs.readFileSync('src/services/sessionService.ts', 'utf8');

// Fix the missing id in logs
code = code.replace(/\{ content: /g, "{ id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(), content: ");
code = code.replace(/\{\n\s+content:/g, "{\n        id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(),\n        content:");

// Fix OldMaid player properties
code = code.replace(/session\.players\[cpuId\] = \{ id: cpuId, nickname: \`컴퓨터 \$\{cpuCount\}\`, isReady: true \};/g, 
  "session.players[cpuId] = { id: cpuId, nickname: `컴퓨터 ${cpuCount}`, isReady: true, isHost: false, isAlive: true, isConnected: true, isBot: true };");

// Fix the message vs content issue on line 2763
code = code.replace(/content: \`\$\{attackerName\}님이/g, "message: `${attackerName}님이");

fs.writeFileSync('src/services/sessionService.ts', code);
console.log('patched final');
