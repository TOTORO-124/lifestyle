const fs = require('fs');
const content = fs.readFileSync('src/components/OldMaid.tsx', 'utf8');

const regex = /let eff: 'JOKER' \| 'PAIR' \| 'ESCAPE' \| null = null;[\s\S]*?msg = \`아쉽게도 짝이 없습니다.\`;\n      }\n    \}/;

const replacement = `let eff: string | null = null;
    let msg = "";
    
    if (drawnCard.value === 'JOKER') {
      eff = \`JOKER_\${toPid}\`;
      msg = \`\${session.players[toPid]?.nickname || toPid}님이 카드를 뽑았습니다.\`;
    } else {
      if (pairMatched) {
        if (newHandTo.length === 0) {
          eff = 'ESCAPE';
          msg = \`\${session.players[toPid]?.nickname || toPid}님 탈출 성공!\`;
        } else {
          eff = 'PAIR';
          msg = \`\${session.players[toPid]?.nickname || toPid}님이 짝을 맞췄습니다!\`;
        }
      } else {
        msg = \`\${session.players[toPid]?.nickname || toPid}님이 카드를 뽑았습니다.\`;
      }
    }`;

const regex2 = /const \[showEffect, setShowEffect\] = useState<'JOKER' \| 'PAIR' \| 'ESCAPE' \| null>\(null\);[\s\S]*?\}, \[effect, game.effectTimestamp\]\);/;

const replacement2 = `const [showEffect, setShowEffect] = useState<string | null>(null);
  useEffect(() => {
    if (effect && game.effectTimestamp) {
      if (effect.startsWith('JOKER_')) {
        const drawerId = effect.split('_')[1];
        if (drawerId === currentUser.uid) {
          setShowEffect('JOKER');
        } else {
          setShowEffect(null);
        }
      } else {
        setShowEffect(effect);
      }
      
      const timer = setTimeout(() => setShowEffect(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [effect, game.effectTimestamp, currentUser.uid]);`;

let newContent = content.replace(regex, replacement).replace(regex2, replacement2);
fs.writeFileSync('src/components/OldMaid.tsx', newContent);
