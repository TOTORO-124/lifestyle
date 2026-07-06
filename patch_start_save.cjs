const fs = require('fs');
const content = fs.readFileSync('src/services/sessionService.ts', 'utf8');

const replacement = `    await update(ref(db, \`sessions/\${sessionId}\`), {
      oldMaidGame: game,
      players: session.players
    });`;

let newContent = content.replace(/    await update\(ref\(db, `sessions\/\$\{sessionId\}`\), \{\n      oldMaidGame: game,\n    \}\);/, replacement);
fs.writeFileSync('src/services/sessionService.ts', newContent);
