const fs = require('fs');
const content = fs.readFileSync('src/components/OldMaid.tsx', 'utf8');

let newContent = content.replace(/pState\.hand\.map/g, '(pState.hand || []).map');
fs.writeFileSync('src/components/OldMaid.tsx', newContent);
