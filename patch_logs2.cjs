const fs = require('fs');
let code = fs.readFileSync('src/services/sessionService.ts', 'utf8');

code = code.replace(/Math\.random\(\)/g, "Math.floor(Math.random() * 10000)");

fs.writeFileSync('src/services/sessionService.ts', code);
console.log('patched');
