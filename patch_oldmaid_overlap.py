import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Move center panel up
target_center = """          {/* Center Status / Timer */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center">"""
replace_center = """          {/* Center Status / Timer */}
          <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none flex flex-col items-center">"""
content = content.replace(target_center, replace_center)

# 2. Compact bottom player UI (emojis & text macros & shuffle button)
target_bottom_ui = """            {pState.isActive && isMe && status === 'PLAYING' && (
              <div className="flex flex-col ml-4 gap-2 border-l border-white/20 pl-4">
                <div className="flex items-center gap-1">
                  {['😂', '😭', '😡', '👍', '😱'].map(emoji => (
                    <button 
                      key={emoji}
                      onClick={() => sessionService.sendOldMaidEmoji(session.id, pid, emoji)}
                      className="p-1 hover:bg-white/20 rounded-full transition-transform active:scale-90 text-xl"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {['여깄지롱 😜', '살려줘... 😭', '빨리 뽑아! ⏰', '안돼!! 😱'].map(msg => (
                    <button
                      key={msg}
                      onClick={() => sessionService.sendOldMaidEmoji(session.id, pid, msg)}
                      className="px-2 py-1 bg-black/40 hover:bg-black/60 rounded-full text-xs text-white transition-transform active:scale-95"
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {pState.isActive && isMe && status === 'PLAYING' && (
              <button 
                onClick={() => sessionService.shuffleOldMaidHand(session.id, pid)}
                className="ml-4 px-4 py-2 bg-blue-500 hover:bg-blue-400 border border-blue-300 rounded-full text-sm font-black flex items-center gap-2 shadow-xl transition-all active:scale-95 text-white"
              >
                <RefreshCw className="w-4 h-4" /> 카드 섞기
              </button>
            )}
          </div>"""

replace_bottom_ui = """          </div>
          
          {/* Quick Actions (Emojis, Macros, Shuffle) */}
          {pState.isActive && isMe && status === 'PLAYING' && (
            <div className="flex flex-wrap items-center justify-center gap-2 mb-2 px-2 max-w-full">
              <div className="flex items-center bg-black/30 rounded-full px-2 py-1 gap-1">
                {['😂', '😭', '😡', '👍', '😱'].map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => sessionService.sendOldMaidEmoji(session.id, pid, emoji)}
                    className="p-1 hover:bg-white/20 rounded-full transition-transform active:scale-90 text-lg sm:text-xl"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <div className="hidden sm:flex items-center gap-1">
                {['여깄지롱 😜', '살려줘... 😭', '빨리 뽑아! ⏰', '안돼!! 😱'].map(msg => (
                  <button
                    key={msg}
                    onClick={() => sessionService.sendOldMaidEmoji(session.id, pid, msg)}
                    className="px-2 py-1 bg-black/40 hover:bg-black/60 rounded-full text-[10px] sm:text-xs text-white transition-transform active:scale-95 whitespace-nowrap"
                  >
                    {msg}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => sessionService.shuffleOldMaidHand(session.id, pid)}
                className="px-3 py-1 bg-blue-500 hover:bg-blue-400 border border-blue-300 rounded-full text-xs sm:text-sm font-black flex items-center gap-1 shadow-xl transition-all active:scale-95 text-white whitespace-nowrap"
              >
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" /> 카드 섞기
              </button>
            </div>
          )}"""
content = content.replace(target_bottom_ui, replace_bottom_ui)

# 3. Increase fan overlapping to save horizontal space and smooth rotation
target_fan_bottom = """          <div className="flex flex-nowrap justify-center -space-x-[1rem] sm:-space-x-[2rem] md:-space-x-[3rem] p-4 md:p-6 w-full pb-8 px-8 perspective-1000">"""
replace_fan_bottom = """          <div className="flex flex-nowrap justify-center -space-x-[1.5rem] sm:-space-x-[2.5rem] md:-space-x-[3.5rem] p-2 sm:p-4 w-full pb-4 sm:pb-8 px-4 sm:px-8 perspective-1000">"""
content = content.replace(target_fan_bottom, replace_fan_bottom)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
