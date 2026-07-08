const fs = require('fs');

const path = 'src/services/sessionService.ts';
let code = fs.readFileSync(path, 'utf8');

const getNextTurnIndexCode = `
    const getNextTurnIdx = (game, skipNext, playAgain, currentTurnIdx) => {
      let nextIdx = currentTurnIdx;
      if (playAgain && (!game.rankings || !game.rankings.includes(game.turnOrder[currentTurnIdx]))) {
        return nextIdx;
      }
      
      const isFinished = (idx) => game.rankings && game.rankings.includes(game.turnOrder[idx]);
      
      let step = game.direction;
      let count = skipNext ? 2 : 1;
      
      let moves = 0;
      while (moves < game.turnOrder.length) {
        nextIdx = (nextIdx + step + game.turnOrder.length) % game.turnOrder.length;
        if (!isFinished(nextIdx)) {
          count--;
          if (count === 0) break;
        }
        moves++;
      }
      return nextIdx;
    };
`;

code = code.replace("let nextIdx = game.currentTurnIndex;", getNextTurnIndexCode + "\n    let nextIdx = getNextTurnIdx(game, skipNext, playAgain, game.currentTurnIndex);");
// Remove the old nextIdx calculation block in playOneCard:
/*
    if (!playAgain) {
      nextIdx = game.currentTurnIndex + game.direction;
      if (nextIdx >= game.turnOrder.length) nextIdx = nextIdx % game.turnOrder.length;
      if (nextIdx < 0) nextIdx = (nextIdx % game.turnOrder.length + game.turnOrder.length) % game.turnOrder.length;
      
      if (skipNext) {
        nextIdx = nextIdx + game.direction;
        if (nextIdx >= game.turnOrder.length) nextIdx = nextIdx % game.turnOrder.length;
        if (nextIdx < 0) nextIdx = (nextIdx % game.turnOrder.length + game.turnOrder.length) % game.turnOrder.length;
      }
    }
*/
const oldNextIdxCode = `    if (!playAgain) {
      nextIdx = game.currentTurnIndex + game.direction;
      if (nextIdx >= game.turnOrder.length) nextIdx = nextIdx % game.turnOrder.length;
      if (nextIdx < 0) nextIdx = (nextIdx % game.turnOrder.length + game.turnOrder.length) % game.turnOrder.length;
      
      if (skipNext) {
        nextIdx = nextIdx + game.direction;
        if (nextIdx >= game.turnOrder.length) nextIdx = nextIdx % game.turnOrder.length;
        if (nextIdx < 0) nextIdx = (nextIdx % game.turnOrder.length + game.turnOrder.length) % game.turnOrder.length;
      }
    }`;
code = code.replace(oldNextIdxCode, "");

// Modify the logic when hand is empty in playOneCard
const oldEmptyHandCode = `    if (playerState.hand.length === 0) {
      game.status = 'FINISHED';
      game.winnerId = playerId;
      newLogs[\`log_\${Date.now()}_\${Math.floor(Math.random() * 10000)}\`] = {
        id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(),
        content: \`\${playerName}님 승리!\`,
        type: 'info',
        timestamp: Date.now()
    };
      await update(ref(db, \`sessions/\${sessionId}\`), { oneCardGame: game, logs: newLogs });
      return;
    }`;

const newEmptyHandCode = `    if (playerState.hand.length === 0) {
      if (!game.rankings) game.rankings = [];
      game.rankings.push(playerId);
      newLogs[\`log_\${Date.now()}_\${Math.floor(Math.random() * 10000)}\`] = {
        id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(),
        content: \`\${playerName}님 카드 모두 소진! (\${game.rankings.length}등)\`,
        type: 'info',
        timestamp: Date.now()
      };
      
      const activePlayers = game.turnOrder.filter(pid => !game.rankings.includes(pid));
      if (activePlayers.length <= 1) {
        game.status = 'FINISHED';
        game.loserId = activePlayers[0] || game.rankings[game.rankings.length - 1]; // Fallback if 0 for some reason
        newLogs[\`log_\${Date.now()}_\${Math.floor(Math.random() * 10000)}\`] = {
          id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(),
          content: \`게임 종료! \${session.players[game.loserId]?.nickname || game.loserId}님이 마지막까지 남았습니다.\`,
          type: 'info',
          timestamp: Date.now()
        };
        await update(ref(db, \`sessions/\${sessionId}\`), { oneCardGame: game, logs: newLogs });
        return;
      }
    }`;
code = code.replace(oldEmptyHandCode, newEmptyHandCode);

// Now for drawOneCard
// Remove the old simple nextIdx
const oldDrawNextIdxCode = `    let nextIdx = game.currentTurnIndex + game.direction;
    if (nextIdx >= game.turnOrder.length) nextIdx = nextIdx % game.turnOrder.length;
    if (nextIdx < 0) nextIdx = (nextIdx % game.turnOrder.length + game.turnOrder.length) % game.turnOrder.length;
    game.currentTurnIndex = nextIdx;`;

const newDrawNextIdxCode = `
    if (playerState.hand.length >= 20) {
      game.status = 'FINISHED';
      game.loserId = playerId;
      newLogs[\`log_\${Date.now()}_\${Math.floor(Math.random() * 10000)}\`] = {
        id: Date.now().toString() + Math.floor(Math.random() * 10000).toString(),
        content: \`\${playerName}님의 카드가 20장 이상이 되어 파산했습니다! 조기 게임 종료.\`,
        type: 'info',
        timestamp: Date.now()
      };
      await update(ref(db, \`sessions/\${sessionId}\`), { oneCardGame: game, logs: newLogs });
      return;
    }

    const getNextTurnIdx = (game, currentTurnIdx) => {
      const isFinished = (idx) => game.rankings && game.rankings.includes(game.turnOrder[idx]);
      let nextIdx = currentTurnIdx;
      let step = game.direction;
      let moves = 0;
      while (moves < game.turnOrder.length) {
        nextIdx = (nextIdx + step + game.turnOrder.length) % game.turnOrder.length;
        if (!isFinished(nextIdx)) break;
        moves++;
      }
      return nextIdx;
    };
    game.currentTurnIndex = getNextTurnIdx(game, game.currentTurnIndex);
`;
code = code.replace(oldDrawNextIdxCode, newDrawNextIdxCode);


fs.writeFileSync(path, code);
console.log('patched session service rules');
