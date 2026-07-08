const fs = require('fs');
const path = 'src/components/OneCard.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetStr = `      {/* My Player Area */}
      {!isSpectator && myState && (
        <div className="flex-none bg-slate-800/90 backdrop-blur-xl rounded-t-[2rem] border-t border-slate-700/80 p-4 sm:p-6 flex flex-col items-center pb-6 sm:pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] z-30">
          
          <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-5xl mb-4 sm:mb-6 gap-3">`;

const replaceStr = `      {/* My Player Area */}
      {!isSpectator && myState && (
        <div className="flex-none bg-slate-800/90 backdrop-blur-xl rounded-t-[2rem] border-t border-slate-700/80 p-4 sm:p-6 flex flex-col items-center pb-6 sm:pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] z-30">
          {myState.hand.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-slate-800/80 backdrop-blur-sm rounded-2xl w-full max-w-5xl">
              <span className="text-6xl drop-shadow-[0_0_20px_rgba(250,204,21,0.6)] mb-4 animate-bounce">🏆</span>
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">탈출 성공!</span>
              <span className="text-slate-400 mt-2">다른 플레이어들의 게임을 관전하세요.</span>
            </div>
          ) : (
          <>
          <div className="flex flex-col sm:flex-row items-center justify-between w-full max-w-5xl mb-4 sm:mb-6 gap-3">`;

const targetEndStr = `                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}`;

const replaceEndStr = `                  );
                })}
              </AnimatePresence>
            </div>
          </div>
          </>
          )}
        </div>
      )}`;

code = code.replace(targetStr, replaceStr);
code = code.replace(targetEndStr, replaceEndStr);
fs.writeFileSync(path, code);
console.log('patched my hand UI again');
