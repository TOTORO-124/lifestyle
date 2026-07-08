const fs = require('fs');
let code = fs.readFileSync('src/services/sessionService.ts', 'utf8');

code = code.replace(/\{ content:/g, "{ id: Date.now().toString() + Math.random().toString(), content:");
code = code.replace(/avatarIndex: 0, /g, "");

fs.writeFileSync('src/services/sessionService.ts', code);
console.log('patched');
