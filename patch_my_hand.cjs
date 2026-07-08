const fs = require('fs');
const path = 'src/components/OneCard.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetStr = `      {/* My Hand Area */}
      {!isSpectator && myState && (
        <div className="flex-none p-4 sm:p-8 bg-gradient-to-t from-slate-900 via-slate-800 to-transparent relative z-30">`;

const replaceStr = `      {/* My Hand Area */}
      {!isSpectator && myState && (
        <div className="flex-none p-4 sm:p-8 bg-gradient-to-t from-slate-900 via-slate-800 to-transparent relative z-30">
          {myState.hand.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-yellow-500/30">
              <span className="text-6xl drop-shadow-[0_0_20px_rgba(250,204,21,0.6)] mb-4">🏆</span>
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">탈출 성공!</span>
              <span className="text-slate-400 mt-2">다른 플레이어들의 게임을 관전하세요.</span>
            </div>
          ) : (`;

const targetEndStr = `          </div>
        </div>
      )}`;

const replaceEndStr = `          </div>
        )}
        </div>
      )}`;

code = code.replace(targetStr, replaceStr);
code = code.replace(targetEndStr, replaceEndStr);
fs.writeFileSync(path, code);
console.log('patched my hand UI');
