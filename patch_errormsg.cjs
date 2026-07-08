const fs = require('fs');
let code = fs.readFileSync('src/components/OneCard.tsx', 'utf8');

code = code.replace(
  'showError("방어 가능한 카드가 아닙니다! 2, A, Joker 중 조건에 맞는 카드를 내세요.");',
  'showError("방어 가능한 카드가 아닙니다! 더 높은 공격 카드나 3(방어) 카드를 내세요.");'
);

fs.writeFileSync('src/components/OneCard.tsx', code);
console.log('patched errormsg');
