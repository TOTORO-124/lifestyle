const fs = require('fs');

const path = 'src/components/OneCard.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetStr = `              <div className="flex -space-x-4 sm:-space-x-5">
                 {Array.from({ length: Math.min(handSize, 5) }).map((_, i) => (
                   <div key={i} className="transform scale-[0.6] sm:scale-75 -my-8 sm:-my-6 origin-top">
                     <CardView hidden={true} />
                   </div>
                 ))}
                 {handSize > 5 && (
                   <div className="z-10 bg-slate-900 rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] sm:text-xs font-bold -ml-2 sm:-ml-3 border-2 border-slate-700 shadow-md">
                     +{handSize - 5}
                   </div>
                 )}
              </div>
              <span className={\`text-[10px] sm:text-xs font-black mt-3 px-2 py-0.5 rounded-full \${handSize === 1 ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-700 text-slate-300'}\`}>
                {handSize}장
              </span>`;

const replaceStr = `              {handSize === 0 ? (
                <div className="flex flex-col items-center justify-center h-16 sm:h-24">
                  <span className="text-3xl sm:text-4xl drop-shadow-md">🏆</span>
                  <span className="text-xs sm:text-sm font-bold text-yellow-400 mt-2">탈출 성공</span>
                </div>
              ) : (
                <>
                  <div className="flex -space-x-4 sm:-space-x-5">
                     {Array.from({ length: Math.min(handSize, 5) }).map((_, i) => (
                       <div key={i} className="transform scale-[0.6] sm:scale-75 -my-8 sm:-my-6 origin-top">
                         <CardView hidden={true} />
                       </div>
                     ))}
                     {handSize > 5 && (
                       <div className="z-10 bg-slate-900 rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-[10px] sm:text-xs font-bold -ml-2 sm:-ml-3 border-2 border-slate-700 shadow-md">
                         +{handSize - 5}
                       </div>
                     )}
                  </div>
                  <span className={\`text-[10px] sm:text-xs font-black mt-3 px-2 py-0.5 rounded-full \${handSize === 1 ? 'bg-red-500 text-white animate-pulse' : handSize >= 15 ? 'bg-rose-900 text-rose-200 animate-pulse' : 'bg-slate-700 text-slate-300'}\`}>
                    {handSize}장 {handSize >= 15 && ' (위험)'}
                  </span>
                </>
              )}`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync(path, code);
console.log('patched opponent UI');
