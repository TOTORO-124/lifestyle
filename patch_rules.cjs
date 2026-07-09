const fs = require('fs');

let path = 'src/components/OneCard.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetStr = `                  <ul className="list-disc pl-5 space-y-1 text-slate-400">
                    <li><span className="text-white font-bold">3 카드:</span> 같은 무늬의 3을 내면 공격을 <span className="text-emerald-400">방어(무효화)</span>할 수 있습니다! (스페이드 3은 조커 방어 가능)</li>
                    <li>더 강한 공격카드를 내서 다음 사람에게 누적시킬 수도 있습니다.</li>
                  </ul>`;

const replaceStr = `                  <ul className="list-disc pl-5 space-y-1 text-slate-400">
                    <li>공격은 <span className="text-emerald-400 font-bold">같은 등급이거나 더 쎈 공격 카드</span>로 막으면서 다음 사람에게 누적시킬 수 있습니다. (예: 2는 A나 조커로 방어 가능하지만, A는 2로 방어 불가)</li>
                    <li><span className="text-white font-bold">3 카드:</span> 같은 무늬의 3(방어 카드)을 내면 공격을 <span className="text-emerald-400">방어(무효화)</span>할 수 있습니다! (스페이드 3은 조커 방어 가능)</li>
                  </ul>`;

code = code.replace(targetStr, replaceStr);

const targetStr2 = `<p className="text-xs text-slate-500 mb-2">공격을 받으면 다음 사람은 카드를 내거나 맞아야 합니다. 같은 공격이나 더 센 공격으로 방어할 수 있습니다.</p>`;
const replaceStr2 = `<p className="text-xs text-slate-500 mb-2">공격을 받으면 다음 사람은 공격 카드를 내서 누적시키거나(더 쎈 공격가능), 방어 카드를 내거나, 덱에서 카드를 먹어야 합니다. <strong className="text-rose-400">카드가 12장을 초과하면 파산(게임 오버)</strong>됩니다.</p>`;

code = code.replace(targetStr2, replaceStr2);

fs.writeFileSync(path, code);
console.log('patched rules text');
