const fs = require('fs');
let code = fs.readFileSync('src/services/sessionService.ts', 'utf8');

const targetStr = `    let skipNext = false;
    if (card.rank === 'Q') {
      game.direction = (game.direction === 1 ? -1 : 1) as 1 | -1;
      newLogs[\`log_\${Date.now()}_\${Math.floor(Math.random() * 10000)}\`] = { id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(), content: \`진행 방향이 반대로 바뀝니다!\`, type: 'info', timestamp: Date.now()
    };
    } else if (card.rank === 'J') {
      skipNext = true;
      newLogs[\`log_\${Date.now()}_\${Math.floor(Math.random() * 10000)}\`] = { id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(), content: \`다음 플레이어를 건너뜁니다!\`, type: 'info', timestamp: Date.now()
    };
    }

    if (card.suit === 'joker') {
      game.penaltyStack += 5;
      newLogs[\`log_\${Date.now()}_\${Math.floor(Math.random() * 10000)}\`] = { id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(), content: \`공격! 다음 사람은 누적 \${game.penaltyStack}장을 먹어야 합니다.\`, type: 'info', timestamp: Date.now()
    };
    } else if (card.rank === 'A') {
      game.penaltyStack += 3;
      newLogs[\`log_\${Date.now()}_\${Math.floor(Math.random() * 10000)}\`] = { id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(), content: \`공격! 다음 사람은 누적 \${game.penaltyStack}장을 먹어야 합니다.\`, type: 'info', timestamp: Date.now()
    };
    } else if (card.rank === '2') {
      game.penaltyStack += 2;
      newLogs[\`log_\${Date.now()}_\${Math.floor(Math.random() * 10000)}\`] = { id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(), content: \`공격! 다음 사람은 누적 \${game.penaltyStack}장을 먹어야 합니다.\`, type: 'info', timestamp: Date.now()
    };
    }

    let nextIdx = game.currentTurnIndex + game.direction;
    if (nextIdx >= game.turnOrder.length) nextIdx = nextIdx % game.turnOrder.length;
    if (nextIdx < 0) nextIdx = (nextIdx % game.turnOrder.length + game.turnOrder.length) % game.turnOrder.length;
    
    if (skipNext) {
      nextIdx = nextIdx + game.direction;
      if (nextIdx >= game.turnOrder.length) nextIdx = nextIdx % game.turnOrder.length;
      if (nextIdx < 0) nextIdx = (nextIdx % game.turnOrder.length + game.turnOrder.length) % game.turnOrder.length;
    }`;

const replaceStr = `    let skipNext = false;
    let playAgain = false;
    
    if (card.rank === 'Q') {
      game.direction = (game.direction === 1 ? -1 : 1) as 1 | -1;
      newLogs[\`log_\${Date.now()}_\${Math.floor(Math.random() * 10000)}\`] = { id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(), content: \`Q: 진행 방향이 반대로 바뀝니다!\`, type: 'info', timestamp: Date.now() };
    } else if (card.rank === 'J') {
      skipNext = true;
      newLogs[\`log_\${Date.now()}_\${Math.floor(Math.random() * 10000)}\`] = { id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(), content: \`J: 다음 플레이어를 건너뜁니다!\`, type: 'info', timestamp: Date.now() };
    } else if (card.rank === 'K') {
      playAgain = true;
      newLogs[\`log_\${Date.now()}_\${Math.floor(Math.random() * 10000)}\`] = { id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(), content: \`K: 한번 더 낼 수 있습니다!\`, type: 'info', timestamp: Date.now() };
    } else if (card.rank === '7') {
      newLogs[\`log_\${Date.now()}_\${Math.floor(Math.random() * 10000)}\`] = { id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(), content: \`7: 무늬를 변경했습니다!\`, type: 'info', timestamp: Date.now() };
    }

    if (game.penaltyStack > 0 && card.rank === '3') {
      game.penaltyStack = 0;
      newLogs[\`log_\${Date.now()}_\${Math.floor(Math.random() * 10000)}\`] = { id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(), content: \`3: 공격을 막았습니다!\`, type: 'info', timestamp: Date.now() };
    } else {
      const attackVal = card.suit === 'joker' && card.rank === 'color' ? 7 :
                        card.suit === 'joker' && card.rank === 'black' ? 5 :
                        card.rank === 'A' && card.suit === 'spades' ? 5 :
                        card.rank === 'A' ? 3 :
                        card.rank === '2' ? 2 : 0;
      if (attackVal > 0) {
        game.penaltyStack += attackVal;
        newLogs[\`log_\${Date.now()}_\${Math.floor(Math.random() * 10000)}\`] = { id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(), content: \`공격! 다음 사람은 누적 \${game.penaltyStack}장을 먹어야 합니다.\`, type: 'info', timestamp: Date.now() };
      }
    }

    let nextIdx = game.currentTurnIndex;
    if (!playAgain) {
      nextIdx = game.currentTurnIndex + game.direction;
      if (nextIdx >= game.turnOrder.length) nextIdx = nextIdx % game.turnOrder.length;
      if (nextIdx < 0) nextIdx = (nextIdx % game.turnOrder.length + game.turnOrder.length) % game.turnOrder.length;
      
      if (skipNext) {
        nextIdx = nextIdx + game.direction;
        if (nextIdx >= game.turnOrder.length) nextIdx = nextIdx % game.turnOrder.length;
        if (nextIdx < 0) nextIdx = (nextIdx % game.turnOrder.length + game.turnOrder.length) % game.turnOrder.length;
      }
    }`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('src/services/sessionService.ts', code);
console.log('patched sessionService rules');
