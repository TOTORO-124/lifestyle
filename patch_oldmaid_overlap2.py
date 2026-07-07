import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update duration logic
target_duration = """      let duration = 1500;
      if (effect === 'PAIR') {
        duration = 600;
      } else if (effect === 'ESCAPE') {
        duration = 1500;
      } else if (effect && effect.startsWith('JOKER_')) {
        duration = 800;
      }"""

replace_duration = """      let duration = 2000;
      if (effect === 'PAIR') {
        duration = 1500;
      } else if (effect === 'ESCAPE') {
        duration = 2000;
      } else if (effect && effect.startsWith('JOKER_')) {
        duration = 2000;
      }"""
content = content.replace(target_duration, replace_duration)

# 2. Fix the hover effect for Left/Right players
target_hover = """className={`transition-transform duration-200 relative ${isTarget && amICurrent && !drawingState ? 'hover:-translate-y-4 hover:scale-110 cursor-pointer z-40' : ''} ${isPinged ? 'animate-pulse drop-shadow-[0_0_15px_rgba(255,215,0,1)]' : ''}`}"""
replace_hover = """className={`transition-transform duration-200 relative ${isTarget && amICurrent && !drawingState ? 'hover:scale-110 hover:z-[60] cursor-pointer ' + (position === 'left' ? 'hover:translate-x-6' : position === 'right' ? 'hover:-translate-x-6' : position === 'top' ? 'hover:translate-y-6' : 'hover:-translate-y-4') : ''} ${isPinged ? 'animate-pulse drop-shadow-[0_0_15px_rgba(255,215,0,1)]' : ''}`}"""
content = content.replace(target_hover, replace_hover)

# 3. Increase spacing to make it less overlapped
target_space = """        <div className={`flex ${vertical ? 'flex-col -space-y-[2.2rem] sm:-space-y-[4.2rem] md:-space-y-[5.5rem] py-4' : 'flex-nowrap justify-center -space-x-[1.2rem] sm:-space-x-[2.2rem] md:-space-x-[3.2rem] px-4'} items-center justify-center perspective-1000`}>"""
replace_space = """        <div className={`flex ${vertical ? 'flex-col -space-y-[1.8rem] sm:-space-y-[3.5rem] md:-space-y-[4.5rem] py-4' : 'flex-nowrap justify-center -space-x-[1.0rem] sm:-space-x-[2.0rem] md:-space-x-[2.5rem] px-4'} items-center justify-center perspective-1000`}>"""
content = content.replace(target_space, replace_space)

# 4. Move Center Status to the very top or above my cards
target_center = """            {/* Sleek Center Status / Timer */}
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

replace_center = """            {/* Sleek Center Status / Timer - Moved out of the way */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[80px] sm:-translate-y-[100px] pointer-events-none z-[100] flex flex-col items-center opacity-80 hover:opacity-10 transition-opacity duration-300">
              <div className={`inline-flex flex-col items-center bg-black/80 border border-yellow-500/30 py-1.5 px-5 rounded-full shadow-lg backdrop-blur-md transform transition-transform ${isMyTurn && status === 'PLAYING' ? 'scale-105 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]' : ''}`}>
                <div className="flex items-center gap-3">
                   <span className="font-black text-xs sm:text-sm text-yellow-400 whitespace-nowrap drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                     {status === 'FINISHED' ? '게임 종료!' : (isMyTurn ? '🚨 내 차례!' : `${session.players[currentTurnPid]?.nickname || currentTurnPid}님의 턴`)}
                   </span>
                   {status === 'PLAYING' && !drawingState && (
                      <div className="flex items-center gap-2 pointer-events-auto border-l border-gray-600 pl-3">
                         <div className="w-[50px] sm:w-[80px] h-1.5 bg-black/80 rounded-full overflow-hidden border border-gray-600">
                            <div className={`h-full transition-all duration-1000 ${timeLeft <= 5 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} style={{ width: `${(timeLeft / TURN_LIMIT) * 100}%` }}></div>
                         </div>
                         <span className={`font-bold text-xs ${timeLeft <= 5 ? 'text-red-400 font-black' : 'text-gray-300'}`}>{timeLeft}초</span>
                      </div>
                   )}
                </div>
              </div>
            </div>"""
content = content.replace(target_center, replace_center)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
