import fs from 'fs';
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
const newLines = [...lines.slice(0, 199), ...lines.slice(994)];
fs.writeFileSync('src/App.tsx', newLines.join('\n'));
console.log('Done');
