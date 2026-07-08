const fs = require('fs');
let data = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
data.include = ["src"];
data.exclude = ["node_modules", "dist"];
fs.writeFileSync('tsconfig.json', JSON.stringify(data, null, 2));
console.log('patched tsconfig');
