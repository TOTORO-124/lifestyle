const fs = require('fs');
let code = fs.readFileSync('src/services/sessionService.ts', 'utf8');

// The replacement was: /Math\.random\(\)/g -> "Math.floor(Math.random() * 10000)"
// I want to change back Math.floor(Math.random() * 10000) * to Math.random() *
code = code.replace(/Math\.floor\(Math\.random\(\) \* 10000\) \*/g, "Math.random() *");
// And change back Math.floor(Math.random() * 10000) - 0.5 to Math.random() - 0.5
code = code.replace(/Math\.floor\(Math\.random\(\) \* 10000\) - 0\.5/g, "Math.random() - 0.5");
// Also any Math.floor(Math.random() * 10000).toString(36)
code = code.replace(/Math\.floor\(Math\.random\(\) \* 10000\)\.toString\(36\)/g, "Math.random().toString(36)");
// Check for any remaining
fs.writeFileSync('src/services/sessionService.ts', code);
console.log('fixed random');
