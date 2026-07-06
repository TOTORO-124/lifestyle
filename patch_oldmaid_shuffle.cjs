const fs = require('fs');

// Update sessionService.ts
const sessionContent = fs.readFileSync('src/services/sessionService.ts', 'utf8');
const sessionRegex = /async endOldMaidGame\([^)]*\)\s*\{[\s\S]*?\n  \},/;
const sessionReplacement = `async endOldMaidGame(sessionId: string, loserId: string) {
    if (!db) return;
    await update(ref(db, \`sessions/\${sessionId}/oldMaidGame\`), {
      status: 'FINISHED',
      loserId: loserId
    });
  },

  async shuffleOldMaidHand(sessionId: string, playerId: string) {
    if (!db) return;
    const gameSnap = await get(ref(db, \`sessions/\${sessionId}/oldMaidGame\`));
    const game = gameSnap.val();
    if (!game || !game.players || !game.players[playerId]) return;

    const hand = [...game.players[playerId].hand];
    for (let i = hand.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [hand[i], hand[j]] = [hand[j], hand[i]];
    }

    await update(ref(db, \`sessions/\${sessionId}/oldMaidGame/players/\${playerId}\`), {
      hand
    });
  },`;
fs.writeFileSync('src/services/sessionService.ts', sessionContent.replace(sessionRegex, sessionReplacement));

// Update OldMaid.tsx
const oldmaidContent = fs.readFileSync('src/components/OldMaid.tsx', 'utf8');
const targetStr = `{!pState.isActive && <span className="text-sm bg-black/50 px-2 py-1 rounded text-white font-bold">탈출 성공! 🎉</span>}`;
const replacementStr = `{!pState.isActive && <span className="text-sm bg-black/50 px-2 py-1 rounded text-white font-bold">탈출 성공! 🎉</span>}
            {pState.isActive && isMe && status === 'PLAYING' && (
              <button 
                onClick={() => sessionService.shuffleOldMaidHand(session.id, pid)}
                className="ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg transition-transform active:scale-95"
              >
                <RefreshCw className="w-4 h-4" /> 카드 섞기
              </button>
            )}`;
fs.writeFileSync('src/components/OldMaid.tsx', oldmaidContent.replace(targetStr, replacementStr));

