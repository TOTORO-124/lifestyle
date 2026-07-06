const fs = require('fs');
const content = fs.readFileSync('src/components/OldMaid.tsx', 'utf8');

const regex = /<div className="inline-block bg-black\/60 border border-yellow-500\/30 py-3 px-8 rounded-full shadow-2xl backdrop-blur-sm transform hover:scale-105 transition-transform">/;

const replacement = `<div className={\`inline-block bg-black/60 border border-yellow-500/30 py-4 px-10 rounded-full shadow-2xl backdrop-blur-sm transform transition-transform \${isMyTurn ? 'animate-pulse scale-105 border-yellow-400 border-2' : ''}\`}>`;

const newContent = content.replace(regex, replacement);
fs.writeFileSync('src/components/OldMaid.tsx', newContent);
