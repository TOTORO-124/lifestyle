import re

with open('src/services/sessionService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

target_emoji = """  async sendOldMaidEmoji(sessionId: string, playerId: string, emoji: string) {
    if (!db) return;
    const updates: Record<string, any> = {};
    updates[`sessions/${sessionId}/oldMaidGame/effect`] = `EMOJI_${playerId}_${emoji}`;
    updates[`sessions/${sessionId}/oldMaidGame/effectTimestamp`] = Date.now();
    await update(ref(db), updates);
  }"""

replace_emoji = """  async sendOldMaidEmoji(sessionId: string, playerId: string, emoji: string) {
    if (!db) return;
    const updates: Record<string, any> = {};
    updates[`sessions/${sessionId}/oldMaidGame/effect`] = `EMOJI_${playerId}_${emoji}`;
    updates[`sessions/${sessionId}/oldMaidGame/effectTimestamp`] = Date.now();
    await update(ref(db), updates);
  }

  async sendOldMaidPing(sessionId: string, playerId: string, cardIndex: number) {
    if (!db) return;
    const updates: Record<string, any> = {};
    updates[`sessions/${sessionId}/oldMaidGame/effect`] = `PING_${playerId}_${cardIndex}`;
    updates[`sessions/${sessionId}/oldMaidGame/effectTimestamp`] = Date.now();
    await update(ref(db), updates);
  }"""

content = content.replace(target_emoji, replace_emoji)

with open('src/services/sessionService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
