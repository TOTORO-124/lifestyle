import re

with open('src/services/sessionService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

target_shuffle = """  async shuffleOldMaidHand(sessionId: string, playerId: string) {
    if (!db) return;
    const gameSnap = await get(ref(db, `sessions/${sessionId}/oldMaidGame`));
    const game = gameSnap.val();
    if (!game || !game.players || !game.players[playerId]) return;

    const hand = [...(game.players[playerId].hand || [])];
    for (let i = hand.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [hand[i], hand[j]] = [hand[j], hand[i]];
    }

    await update(ref(db, `sessions/${sessionId}/oldMaidGame/players/${playerId}`), {
      hand
    });
  },"""

replace_shuffle = """  async shuffleOldMaidHand(sessionId: string, playerId: string) {
    if (!db) return;
    const gameSnap = await get(ref(db, `sessions/${sessionId}/oldMaidGame`));
    const game = gameSnap.val();
    if (!game || !game.players || !game.players[playerId]) return;

    const hand = [...(game.players[playerId].hand || [])];
    for (let i = hand.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [hand[i], hand[j]] = [hand[j], hand[i]];
    }

    const updates: Record<string, any> = {};
    updates[`sessions/${sessionId}/oldMaidGame/players/${playerId}/hand`] = hand;
    updates[`sessions/${sessionId}/oldMaidGame/effect`] = `EMOJI_${playerId}_🔀 슉슉!`;
    updates[`sessions/${sessionId}/oldMaidGame/effectTimestamp`] = Date.now();
    
    await update(ref(db), updates);
  },"""

content = content.replace(target_shuffle, replace_shuffle)

with open('src/services/sessionService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
