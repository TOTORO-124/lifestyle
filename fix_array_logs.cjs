const fs = require('fs');
let code = fs.readFileSync('src/services/sessionService.ts', 'utf8');

code = code.replace(/logs: \[\{\n\s+id: ([^,]+),\n\s+content: '원카드 게임이 시작되었습니다.',\n\s+type: 'info',\n\s+timestamp: Date.now\(\)\n\s+\}\]/g, 
  "logs: { [`log_${Date.now()}_${Math.floor(Math.random()*10000)}`]: { id: $1, content: '원카드 게임이 시작되었습니다.', type: 'info', timestamp: Date.now() } }");

code = code.replace(/logs: \[\{\n\s+id: ([^,]+),\n\s+content: '도둑잡기 게임이 시작되었습니다.',\n\s+type: 'info',\n\s+timestamp: Date.now\(\)\n\s+\}\]/g, 
  "logs: { [`log_${Date.now()}_${Math.floor(Math.random()*10000)}`]: { id: $1, content: '도둑잡기 게임이 시작되었습니다.', type: 'info', timestamp: Date.now() } }");

fs.writeFileSync('src/services/sessionService.ts', code);
console.log('fixed array logs');
