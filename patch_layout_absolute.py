import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the grid layout with absolute positioning
target_grid = """<div className="flex-1 grid grid-cols-3 grid-rows-[auto_1fr] md:grid-rows-3 gap-2 px-2 pb-2 relative min-h-0">
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
          </div>"""

replace_grid = """<div className="flex-1 relative w-full h-full min-h-0 overflow-hidden">
          {/* Top Player */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
            {renderPlayer(topId, 'top')}
          </div>
          
          {/* Left Player */}
          <div className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-10 flex flex-col items-start">
            {renderPlayer(leftId, 'left')}
          </div>
          
          {/* Center Status / Timer */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center">
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
        </div>"""

content = content.replace(target_grid, replace_grid)

# Adjust player spacing
target_spacing = """<div className={`flex ${vertical ? 'flex-col -space-y-[1.5rem] sm:-space-y-[2rem] md:-space-y-[3rem] py-4' : 'flex-wrap justify-center -space-x-[0.5rem] sm:-space-x-[1rem] md:-space-x-[1.5rem] px-4'} items-center justify-center`}>"""
replace_spacing = """<div className={`flex ${vertical ? 'flex-col -space-y-[2.2rem] sm:-space-y-[4.2rem] md:-space-y-[5.5rem] py-4' : 'flex-wrap justify-center -space-x-[1.2rem] sm:-space-x-[2.2rem] md:-space-x-[3.2rem] px-4'} items-center justify-center`}>"""
content = content.replace(target_spacing, replace_spacing)

# Fix horizontal scrolling for bottom player to be flex-wrap again for stability, or very tight overlaps
target_bottom_spacing = """<div className="flex flex-wrap justify-center -space-x-[0.5rem] sm:-space-x-[1rem] md:-space-x-[1.5rem] p-4 md:p-6 w-full pb-8 px-8">"""
replace_bottom_spacing = """<div className="flex flex-wrap justify-center -space-x-[1rem] sm:-space-x-[2rem] md:-space-x-[3rem] p-4 md:p-6 w-full pb-8 px-8">"""
content = content.replace(target_bottom_spacing, replace_bottom_spacing)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
