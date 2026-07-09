const fs = require('fs');
let path = 'src/services/sessionService.ts';
let code = fs.readFileSync(path, 'utf8');

const targetStr = `    if (game.penaltyStack > 0) {
      newLogs[\`log_\${Date.now()}_\${Math.floor(Math.random() * 10000)}\`] = { id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(), content: \`\${playerName}님이 공격 방어에 실패하여 \${actualDrawn}장을 뽑았습니다.\`, type: 'info', timestamp: Date.now()
    };
      game.penaltyStack = 0;
    } else {`;

const replaceStr = `    if (game.penaltyStack > 0) {
      newLogs[\`log_\${Date.now()}_\${Math.floor(Math.random() * 10000)}\`] = { id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(), content: \`\${playerName}님이 공격 방어에 실패하여 \${actualDrawn}장을 뽑았습니다.\`, type: 'info', timestamp: Date.now()
    };
      game.penaltyStack = 0;
      const topCard = game.discardPile[game.discardPile.length - 1];
      if (topCard?.suit === 'joker') {
        game.currentSuit = null as any;
      }
    } else {`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync(path, code);
console.log('patched draw');
