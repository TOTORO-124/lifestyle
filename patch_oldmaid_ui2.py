import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update duration logic
target_duration = """      let duration = 1000;
      if (effect && effect.startsWith('JOKER_')) {
        duration = 800;
      }
      const timer = setTimeout(() => setShowEffect(null), duration);"""

replace_duration = """      let duration = 1500;
      if (effect === 'PAIR') {
        duration = 600;
      } else if (effect === 'ESCAPE') {
        duration = 1500;
      } else if (effect && effect.startsWith('JOKER_')) {
        duration = 800;
      }
      const timer = setTimeout(() => setShowEffect(null), duration);"""
content = content.replace(target_duration, replace_duration)

# 2. Update 짝! size
target_zzak = """        {showEffect === 'PAIR' && (
          <motion.div key="pair" initial={{ scale: 0, opacity: 0, rotate: -20 }} animate={{ scale: 1.5, opacity: 1, rotate: 0 }} exit={{ opacity: 0, scale: 2 }} className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <h2 className="text-8xl font-black text-yellow-300 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">짝!</h2>
          </motion.div>
        )}"""

replace_zzak = """        {showEffect === 'PAIR' && (
          <motion.div key="pair" initial={{ scale: 0, opacity: 0, rotate: -20 }} animate={{ scale: 1.2, opacity: 1, rotate: 0 }} exit={{ opacity: 0, scale: 1.5 }} transition={{ duration: 0.3 }} className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
            <h2 className="text-6xl font-black text-yellow-300 drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">짝!</h2>
          </motion.div>
        )}"""
content = content.replace(target_zzak, replace_zzak)

# 3. Update Center Status / Timer
target_center = """            {/* Center Status / Timer */}
            <div className="flex-none flex flex-col items-center justify-center pointer-events-none z-20">
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
            </div>"""

replace_center = """            {/* Sleek Center Status / Timer */}
            <div className="absolute top-[40%] md:top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20 flex flex-col items-center">
              <div className={`inline-flex flex-col items-center bg-black/80 border border-yellow-500/30 py-2 px-6 rounded-full shadow-2xl backdrop-blur-md transform transition-transform ${isMyTurn && status === 'PLAYING' ? 'scale-105 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : ''}`}>
                <div className="flex items-center gap-4">
                   <span className="font-black text-sm md:text-base text-yellow-400 whitespace-nowrap">
                     {status === 'FINISHED' ? '게임 종료!' : (isMyTurn ? '🚨 내 차례!' : `${session.players[currentTurnPid]?.nickname || currentTurnPid}님의 턴`)}
                   </span>
                   {status === 'PLAYING' && !drawingState && (
                      <div className="flex items-center gap-2 pointer-events-auto border-l border-gray-600 pl-4">
                         <div className="w-[60px] md:w-[100px] h-2 bg-black/80 rounded-full overflow-hidden border border-gray-600">
                            <div className={`h-full transition-all duration-1000 ${timeLeft <= 5 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} style={{ width: `${(timeLeft / TURN_LIMIT) * 100}%` }}></div>
                         </div>
                         <span className={`font-bold text-sm ${timeLeft <= 5 ? 'text-red-400 font-black' : 'text-gray-300'}`}>{timeLeft}초</span>
                      </div>
                   )}
                </div>
              </div>
              {message && status === 'PLAYING' && <div className="text-xs md:text-sm text-yellow-100 mt-2 font-bold text-center bg-black/60 px-4 py-1 rounded-full w-max mx-auto">{message}</div>}
            </div>"""
content = content.replace(target_center, replace_center)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
