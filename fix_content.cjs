const fs = require('fs');
let code = fs.readFileSync('src/services/sessionService.ts', 'utf8');

code = code.replace(/content: card\.message,/g, "message: card.message,");

fs.writeFileSync('src/services/sessionService.ts', code);
console.log('fixed content');
