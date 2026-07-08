const fs = require('fs');
let code = fs.readFileSync('src/services/sessionService.ts', 'utf8');

code = code.replace(/Math\.floor\(Math\.random\(\) \* 10000\) < /g, "Math.random() < ");
code = code.replace(/\)\_\$\{Math\.floor\(Math\.random\(\) \* 10000\)\}\)\`/g, "_${Math.floor(Math.random() * 10000)}`");
code = code.replace(/\}\)\`/g, "}`");
code = code.replace(/\}\)장/g, "}장");
code = code.replace(/\}\)님/g, "}님");

fs.writeFileSync('src/services/sessionService.ts', code);
console.log('fixed random 2');
