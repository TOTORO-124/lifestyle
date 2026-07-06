import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

pattern = re.compile(
    r'<div className="flex-1 flex flex-col p-4 relative">.*?(?=</AnimatePresence>)'
    r'|(<div className="flex-1 flex flex-col p-4 relative">.*?{renderPlayer\(bottomId, \'bottom\'\)}\s*</div>\s*)}\s*{status === \'FINISHED\' && showFinishedScreen && \()',
    re.DOTALL
)

replacement = """        <div className="flex-1 flex flex-col pt-4">
          <div className="flex-1 grid grid-cols-3 grid-rows-[auto_1fr] md:grid-rows-3 gap-2 px-2 pb-2 relative min-h-0">
            {/* Top Player */}
            <div className="col-start-2 row-start-1 flex items-start justify-center">
              {renderPlayer(topId, 'top')}
            </div>
            
            {/* Left Player */}
            <div className="col-start-1 row-start-2 md:row-start-2 flex items-center justify-start z-10">
              {renderPlayer(leftId, 'left')}
            </div>
            
            {/* Center Status / Timer */}
            <div className="col-start-1 col-span-3 md:col-start-2 md:col-span-1 row-start-2 flex flex-col items-center justify-center z-20 pointer-events-none self-center">
              <div className={`inline-block bg-black/70 border border-yellow-500/30 py-3 px-6 md:py-4 md:px-10 rounded-full shadow-2xl backdrop-blur-md transform transition-transform ${isMyTurn && status === 'PLAYING' ? 'scale-105 border-yellow-400 border-2 shadow-[0_0_20px_rgba(250,204,21,0.5)]' : ''}`}>
                <span className="font-black text-lg md:text-3xl text-yellow-400 text-center block leading-tight">
                  {status === 'FINISHED' ? '게임 종료!' : (isMyTurn ? '🚨 내 차례! 카드를 뽑으세요' : `${session.players[currentTurnPid]?.nickname || currentTurnPid}님의 턴`)}
                </span>
                {message && status === 'PLAYING' && <div className="text-sm md:text-xl text-yellow-100 mt-1 md:mt-2 font-bold text-center">{message}</div>}
                {status === 'PLAYING' && !drawingState && (
                  <div className="mt-2 md:mt-4 flex items-center justify-center gap-2 md:gap-3 pointer-events-auto">
                     <div className="w-[120px] md:w-[200px] h-3 md:h-4 bg-black/80 rounded-full overflow-hidden border border-gray-600">
                        <div className={`h-full transition-all duration-1000 ${timeLeft <= 5 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} style={{ width: `${(timeLeft / TURN_LIMIT) * 100}%` }}></div>
                     </div>
                     <span className={`font-bold text-lg md:text-xl ${timeLeft <= 5 ? 'text-red-400 font-black scale-110 transition-transform' : 'text-gray-300'}`}>{timeLeft}초</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right Player */}
            <div className="col-start-3 row-start-2 md:row-start-2 flex items-center justify-end z-10">
              {renderPlayer(rightId, 'right')}
            </div>
          </div>
          {/* Bottom Player (Me) */}
          <div className="w-full shrink-0">
            {renderPlayer(bottomId, 'bottom')}
          </div>
        </div>
      )}
      {status === 'FINISHED' && showFinishedScreen && ("""

match = re.search(r'<div className="flex-1 flex flex-col p-4 relative">.*?{renderPlayer\(bottomId, \'bottom\'\)}\s*</div>', content, re.DOTALL)
if match:
    content = content[:match.start()] + replacement.rsplit(')}', 1)[0] + content[match.end():]
    print("Replaced!")
else:
    print("Match not found")

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

