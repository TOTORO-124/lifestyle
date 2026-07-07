import re

with open('src/services/sessionService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

target = """  async shuffleOldMaidHand(sessionId: string, playerId: string) {
    if (!db) return;
    const sessionSnap = await get(ref(db, `sessions/${sessionId}`));
    const session = sessionSnap.val() as Session;
    if (!session || !session.oldMaidGame) return;"""

replace = """  async sendOldMaidEmoji(sessionId: string, playerId: string, emoji: string) {
    if (!db) return;
    const updates: Record<string, any> = {};
    updates[`sessions/${sessionId}/oldMaidGame/effect`] = `EMOJI_${playerId}_${emoji}`;
    updates[`sessions/${sessionId}/oldMaidGame/effectTimestamp`] = Date.now();
    await update(ref(db), updates);
  }

  async shuffleOldMaidHand(sessionId: string, playerId: string) {
    if (!db) return;
    const sessionSnap = await get(ref(db, `sessions/${sessionId}`));
    const session = sessionSnap.val() as Session;
    if (!session || !session.oldMaidGame) return;"""

content = content.replace(target, replace)

# Also update stats when game finishes
target_end = """    updates[`sessions/${sessionId}/oldMaidGame/loserId`] = loserId;
    updates[`sessions/${sessionId}/oldMaidGame/status`] = 'FINISHED';
    updates[`sessions/${sessionId}/oldMaidGame/message`] = '게임이 종료되었습니다!';"""

replace_end = """    updates[`sessions/${sessionId}/oldMaidGame/loserId`] = loserId;
    updates[`sessions/${sessionId}/oldMaidGame/status`] = 'FINISHED';
    updates[`sessions/${sessionId}/oldMaidGame/message`] = '게임이 종료되었습니다!';
    
    // Update stats for real players
    if (session.players) {
      Object.keys(session.players).forEach(pid => {
        if (!pid.startsWith('CPU_')) {
          const currentWins = session.stats?.[pid]?.wins || 0;
          const currentScore = session.stats?.[pid]?.totalScore || 0;
          if (pid !== loserId) {
            updates[`sessions/${sessionId}/stats/${pid}/wins`] = currentWins + 1;
            updates[`sessions/${sessionId}/stats/${pid}/totalScore`] = currentScore + 10;
          } else {
            updates[`sessions/${sessionId}/stats/${pid}/totalScore`] = Math.max(0, currentScore - 5);
          }
        }
      });
    }"""

content = content.replace(target_end, replace_end)

with open('src/services/sessionService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
