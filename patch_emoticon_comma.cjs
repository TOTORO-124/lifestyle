const fs = require('fs');

let path = 'src/services/sessionService.ts';
let code = fs.readFileSync(path, 'utf8');

const targetStr = `  async sendEmoticon(sessionId: string, playerId: string, emoji: string) {
    if (!db) return;
    try {
      await update(ref(db, \`sessions/\${sessionId}/players/\${playerId}/emoticon\`), {
        emoji,
        timestamp: Date.now()
      });
    } catch (e) {
      console.error('Failed to send emoticon', e);
    }
  }

  async sendMessage`;

const replaceStr = `  async sendEmoticon(sessionId: string, playerId: string, emoji: string) {
    if (!db) return;
    try {
      await update(ref(db, \`sessions/\${sessionId}/players/\${playerId}/emoticon\`), {
        emoji,
        timestamp: Date.now()
      });
    } catch (e) {
      console.error('Failed to send emoticon', e);
    }
  },

  async sendMessage`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync(path, code);
console.log('patched comma');
