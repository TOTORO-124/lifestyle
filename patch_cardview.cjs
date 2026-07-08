const fs = require('fs');
let code = fs.readFileSync('src/components/OneCard.tsx', 'utf8');

const targetStr = `      {isJoker && (
         <div className={\`text-center text-4xl sm:text-5xl absolute inset-0 flex items-center justify-center opacity-15 \${color}\`}>
           🃏
         </div>
      )}`;

const replaceStr = `      <div className={\`text-center text-4xl sm:text-5xl absolute inset-0 flex items-center justify-center opacity-20 \${color}\`}>
         {isJoker ? '🃏' : symbol}
      </div>`;

code = code.replace(targetStr, replaceStr);

fs.writeFileSync('src/components/OneCard.tsx', code);
console.log('patched cardview');
