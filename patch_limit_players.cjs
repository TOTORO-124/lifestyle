const fs = require('fs');
const content = fs.readFileSync('src/services/sessionService.ts', 'utf8');

const replacement = `const allPlayers = Object.keys(session.players);
    let realPlayers = allPlayers.filter(pid => !pid.startsWith('CPU_'));
    if (realPlayers.length > 4) {
      realPlayers = realPlayers.slice(0, 4); // Limit to 4 players max
    }
    const turnOrder = [...realPlayers];`;

let newContent = content.replace(/const allPlayers = Object\.keys\(session\.players\);\n    const realPlayers = allPlayers\.filter\(pid => !pid\.startsWith\('CPU_'\)\);\n    const turnOrder = \[\.\.\.realPlayers\];/, replacement);
fs.writeFileSync('src/services/sessionService.ts', newContent);
