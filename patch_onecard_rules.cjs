const fs = require('fs');
let code = fs.readFileSync('src/components/OneCard.tsx', 'utf8');

const targetStateStr = `  const [oneCardDeclared, setOneCardDeclared] = useState(false);`;
const replaceStateStr = `  const [oneCardDeclared, setOneCardDeclared] = useState(false);
  const [showRules, setShowRules] = useState(false);`;

code = code.replace(targetStateStr, replaceStateStr);

const targetHeaderBtnStr = `        <div className="flex gap-2">
          {isHost && (`;
const replaceHeaderBtnStr = `        <div className="flex gap-2">
          <button 
            onClick={() => setShowRules(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 rounded-full font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5"
          >
            <span>룰 보기</span>
          </button>
          {isHost && (`;

code = code.replace(targetHeaderBtnStr, replaceHeaderBtnStr);

const targetModalStr = `      {/* Top Header */}`;
const replaceModalStr = `      {/* Rules Modal */}
      <AnimatePresence>
        {showRules && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-slate-800 rounded-2xl p-6 sm:p-8 max-w-2xl w-full border border-slate-700 shadow-2xl overflow-y-auto max-h-[85vh] scrollbar-hide relative"
            >
              <button 
                onClick={() => setShowRules(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-700/50 hover:bg-slate-600 text-slate-300 transition-colors"
              >
                ✕
              </button>
              
              <h2 className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 mb-6 drop-shadow-sm">
                1CARD 룰 안내
              </h2>
              
              <div className="space-y-6 text-sm sm:text-base text-slate-300">
                <section>
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-300 flex items-center justify-center text-xs">1</span>
                    기본 룰
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-slate-400">
                    <li>바닥에 있는 카드와 <span className="text-indigo-300 font-bold">무늬</span> 또는 <span className="text-indigo-300 font-bold">숫자(기호)</span>가 같은 카드만 낼 수 있습니다.</li>
                    <li>낼 카드가 없거나 내기 싫다면 덱(뒷면 카드)을 눌러서 1장을 먹어야 합니다.</li>
                    <li>손에 든 카드를 모두 없애면 승리합니다.</li>
                  </ul>
                </section>
                
                <section>
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-rose-500/20 text-rose-300 flex items-center justify-center text-xs">⚔</span>
                    공격 카드
                  </h3>
                  <p className="text-xs text-slate-500 mb-2">공격을 받으면 다음 사람은 카드를 내거나 맞아야 합니다. 같은 공격이나 더 센 공격으로 방어할 수 있습니다.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-700/30 p-3 rounded-xl border border-slate-700">
                      <div className="font-black text-white text-lg">2</div>
                      <div className="text-rose-400 font-bold mb-1">공격력: 2장</div>
                      <div className="text-xs text-slate-400">다음 사람에게 2장을 먹입니다.</div>
                    </div>
                    <div className="bg-slate-700/30 p-3 rounded-xl border border-slate-700">
                      <div className="font-black text-white text-lg">A</div>
                      <div className="text-rose-400 font-bold mb-1">공격력: 3장 (스페이드 A는 5장)</div>
                      <div className="text-xs text-slate-400">다음 사람에게 3장(또는 5장)을 먹입니다.</div>
                    </div>
                    <div className="bg-slate-700/30 p-3 rounded-xl border border-slate-700">
                      <div className="font-black text-slate-300 text-lg">흑백 조커</div>
                      <div className="text-purple-400 font-bold mb-1">공격력: 5장</div>
                      <div className="text-xs text-slate-400">어떤 상황에서든 낼 수 있습니다.</div>
                    </div>
                    <div className="bg-slate-700/30 p-3 rounded-xl border border-slate-700">
                      <div className="font-black text-rose-400 text-lg">컬러 조커</div>
                      <div className="text-purple-400 font-bold mb-1">공격력: 7장</div>
                      <div className="text-xs text-slate-400">무적의 카드! 낼 때 무늬도 바꿀 수 있습니다.</div>
                    </div>
                  </div>
                </section>
                
                <section>
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs">🛡</span>
                    방어 카드
                  </h3>
                  <ul className="list-disc pl-5 space-y-1 text-slate-400">
                    <li><span className="text-white font-bold">3 카드:</span> 같은 무늬의 3을 내면 공격을 <span className="text-emerald-400">방어(무효화)</span>할 수 있습니다! (스페이드 3은 조커 방어 가능)</li>
                    <li>더 강한 공격카드를 내서 다음 사람에게 누적시킬 수도 있습니다.</li>
                  </ul>
                </section>
                
                <section>
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 rounded bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs">★</span>
                    특수 카드
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-700/30 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                      <span className="font-black text-white">7</span>
                      <span className="text-sm text-slate-400 text-right">내고 난 뒤 <span className="text-amber-300">원하는 무늬로 변경</span> 가능</span>
                    </div>
                    <div className="bg-slate-700/30 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                      <span className="font-black text-white">J</span>
                      <span className="text-sm text-slate-400 text-right">다음 사람을 <span className="text-amber-300">점프(건너뜀)</span></span>
                    </div>
                    <div className="bg-slate-700/30 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                      <span className="font-black text-white">Q</span>
                      <span className="text-sm text-slate-400 text-right">게임 진행 방향을 <span className="text-amber-300">반대로(리버스)</span></span>
                    </div>
                    <div className="bg-slate-700/30 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                      <span className="font-black text-white">K</span>
                      <span className="text-sm text-slate-400 text-right">카드 한 장을 <span className="text-amber-300">더 낼 수 있음</span></span>
                    </div>
                  </div>
                </section>
              </div>
              
              <div className="mt-8">
                <button 
                  onClick={() => setShowRules(false)}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg transition-colors shadow-lg active:scale-95"
                >
                  확인했습니다
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}`;

code = code.replace(targetModalStr, replaceModalStr);

fs.writeFileSync('src/components/OneCard.tsx', code);
console.log('patched rules modal');
