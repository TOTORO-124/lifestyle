const fs = require('fs');

let path = 'src/services/sessionService.ts';
let code = fs.readFileSync(path, 'utf8');

const targetStr = `  async sendMessage(sessionId: string, senderId: string, senderName: string, content: string, isSpectatorChat: boolean = false) {`;
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
  }

  async sendMessage(sessionId: string, senderId: string, senderName: string, content: string, isSpectatorChat: boolean = false) {`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync(path, code);
console.log('patched sendEmoticon properly');
