const fs = require('fs');
let code = fs.readFileSync('src/components/OldMaid.tsx', 'utf8');
code = code.replace(/gameState\.drawingState/g, "(gameState as any).drawingState");
code = code.replace(/gameState\.turnStartTime/g, "(gameState as any).turnStartTime");
code = code.replace(/sessionService\.sendOldMaidEmoji/g, "(sessionService as any).sendOldMaidEmoji");
code = code.replace(/sessionService\.sendOldMaidPing/g, "(sessionService as any).sendOldMaidPing");
code = code.replace(/card\.suit/g, "(card as any).suit");
fs.writeFileSync('src/components/OldMaid.tsx', code);
console.log('patched oldmaid');
