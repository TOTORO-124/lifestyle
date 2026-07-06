const fs = require('fs');
let content = fs.readFileSync('src/services/sessionService.ts', 'utf8');
content = content.replace("currentTurnIndex: 0,", "currentTurnIndex: 0,\n      turnStartTime: Date.now(),");
fs.writeFileSync('src/services/sessionService.ts', content);

let oldContent = fs.readFileSync('src/components/OldMaid.tsx', 'utf8');
oldContent = oldContent.replace("updates.currentTurnIndex = nextTurn;", "updates.currentTurnIndex = nextTurn;\n      updates.turnStartTime = Date.now();");
fs.writeFileSync('src/components/OldMaid.tsx', oldContent);
