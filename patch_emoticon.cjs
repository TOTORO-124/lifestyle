const fs = require('fs');

let path = 'src/types.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(/isBot\?: boolean;/g, 'isBot?: boolean;\n  emoticon?: { emoji: string; timestamp: number };');

fs.writeFileSync(path, code);

path = 'src/services/sessionService.ts';
code = fs.readFileSync(path, 'utf8');

const targetStr = `  async sendChatMessage(sessionId: string, senderId: string, senderName: string, content: string) {`;
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

  async sendChatMessage(sessionId: string, senderId: string, senderName: string, content: string) {`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync(path, code);
console.log('patched emoticon to service');
