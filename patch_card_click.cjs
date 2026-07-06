const fs = require('fs');
const content = fs.readFileSync('src/components/OldMaid.tsx', 'utf8');

const replacement = `isTarget={isTarget && amICurrent}
                onClick={() => {
                  if (isTarget && amICurrent) handleDrawCard(pid, i);
                }}`;

let newContent = content.replace(/isTarget=\{isTarget\}\s*onClick=\{\(\) => \{\s*if \(isTarget && amICurrent\) handleDrawCard\(pid, i\);\s*\}\}/, replacement);
fs.writeFileSync('src/components/OldMaid.tsx', newContent);
