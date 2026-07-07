import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update overall container layout
target_container = """        <div className="flex-1 flex flex-col pt-4">
          <div className="flex-1 relative w-full h-full min-h-0 overflow-hidden">
          {/* Top Player */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
            {renderPlayer(topId, 'top')}
          </div>
          
          {/* Left Player */}
          <div className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-10 flex flex-col items-start">
            {renderPlayer(leftId, 'left')}
          </div>
          
          {/* Center Status / Timer */}
          <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center">
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
          <div className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-10 flex flex-col items-end">
            {renderPlayer(rightId, 'right')}
          </div>

          {/* Bottom Player (Me) */}
          <div className="absolute bottom-0 left-0 w-full z-30">
            {renderPlayer(bottomId, 'bottom')}
          </div>
        </div>
        </div>"""

replace_container = """        <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden pb-4">
          {/* Top Player */}
          <div className="flex-none flex justify-center items-start pt-4 h-[25%] z-10">
            {renderPlayer(topId, 'top')}
          </div>
          
          {/* Middle Section: Left, Center, Right */}
          <div className="flex-1 flex justify-between items-center w-full px-2 sm:px-6 relative z-10 min-h-[30%]">
            <div className="flex-1 flex justify-start">
              {renderPlayer(leftId, 'left')}
            </div>
            
            {/* Center Status / Timer */}
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
            </div>
            
            <div className="flex-1 flex justify-end">
              {renderPlayer(rightId, 'right')}
            </div>
          </div>

          {/* Bottom Player (Me) */}
          <div className="flex-none flex justify-center items-end w-full z-30 mt-auto">
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center bg-black/30 backdrop-blur-sm rounded-t-3xl border-t border-green-600/30 pt-4 px-2">
              {renderPlayer(bottomId, 'bottom')}
            </div>
          </div>
        </div>"""

if target_container in content:
    content = content.replace(target_container, replace_container)
else:
    print("Could not find target_container")

# 2. Update renderPlayer bottom to match the new container style
target_bottom = """    if (position === 'bottom') {
      return (
        <div className="flex flex-col items-center pt-2 md:pt-4 pb-2 md:pb-4 border-t-2 border-green-700/50 w-full z-10 relative bg-black/20 backdrop-blur-sm">"""
replace_bottom = """    if (position === 'bottom') {
      return (
        <div className="flex flex-col items-center w-full relative">"""

if target_bottom in content:
    content = content.replace(target_bottom, replace_bottom)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
