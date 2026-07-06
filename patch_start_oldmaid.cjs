const fs = require('fs');
const content = fs.readFileSync('src/services/sessionService.ts', 'utf8');

const replacement = `const allPlayers = Object.keys(session.players);
    const realPlayers = allPlayers.filter(pid => !pid.startsWith('CPU_'));
    const turnOrder = [...realPlayers];
    
    // Cleanup old CPUs from session
    allPlayers.forEach(pid => {
      if (pid.startsWith('CPU_')) {
        delete session.players[pid];
      }
    });

    // Pad with CPUs up to 4 players if needed`;

let newContent = content.replace(/const realPlayers = Object\.keys\(session\.players\);\n    const turnOrder = \[\.\.\.realPlayers\];\n    \n    \/\/ Pad with CPUs up to 4 players if needed/, replacement);
fs.writeFileSync('src/services/sessionService.ts', newContent);
