import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_renderPlayer = """      <div className={`flex flex-col items-center justify-center`}>
        <div className={`font-bold mb-2 flex items-center gap-2 text-sm md:text-base ${turnOrder[currentTurnIndex] === pid ? 'text-yellow-400 bg-black/40 px-3 py-1 rounded-full' : 'bg-black/20 px-3 py-1 rounded-full'}`}>
          <User className="w-4 h-4" /> {name}
          {!pState.isActive && <span className="text-xs bg-red-600 px-2 py-1 rounded font-bold">탈출</span>}
        </div>"""

replace_renderPlayer = """      <div className={`flex flex-col items-center justify-center relative`}>
        {/* Render Emojis for opponents */}
        <AnimatePresence>
          {floatingEmojis.filter(e => e.pid === pid).map(e => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -50, scale: 2 }}
              exit={{ opacity: 0, y: -100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none text-4xl"
            >
              {e.emoji}
            </motion.div>
          ))}
        </AnimatePresence>

        <div className={`font-bold mb-2 flex items-center gap-2 text-sm md:text-base ${turnOrder[currentTurnIndex] === pid ? 'text-yellow-400 bg-black/40 px-3 py-1 rounded-full' : 'bg-black/20 px-3 py-1 rounded-full'}`}>
          <User className="w-4 h-4" /> {name}
          {!pState.isActive && <span className="text-xs bg-red-600 px-2 py-1 rounded font-bold">탈출</span>}
        </div>"""

content = content.replace(target_renderPlayer, replace_renderPlayer)

target_bottomPlayer = """        <div className="flex flex-col items-center pt-2 md:pt-4 pb-2 md:pb-4 border-t-2 border-green-700/50 w-full z-10 relative bg-black/20 backdrop-blur-sm">
          <div className="font-bold mb-4 text-xl flex items-center gap-2">
            <span className={turnOrder[currentTurnIndex] === pid ? 'text-yellow-400 font-black' : ''}>{name}</span>
            {!pState.isActive && <span className="text-sm bg-black/50 px-2 py-1 rounded text-white font-bold">탈출 성공! 🎉</span>}"""

replace_bottomPlayer = """        <div className="flex flex-col items-center pt-2 md:pt-4 pb-2 md:pb-4 border-t-2 border-green-700/50 w-full z-10 relative bg-black/20 backdrop-blur-sm">
          {/* Render Emojis for bottom player */}
          <AnimatePresence>
            {floatingEmojis.filter(e => e.pid === pid).map(e => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 0, scale: 0.5 }}
                animate={{ opacity: 1, y: -80, scale: 2.5 }}
                exit={{ opacity: 0, y: -150 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute top-[-40px] left-1/2 -translate-x-1/2 z-50 pointer-events-none text-6xl"
              >
                {e.emoji}
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="font-bold mb-4 text-xl flex items-center gap-2">
            <span className={turnOrder[currentTurnIndex] === pid ? 'text-yellow-400 font-black' : ''}>{name}</span>
            {!pState.isActive && <span className="text-sm bg-black/50 px-2 py-1 rounded text-white font-bold">탈출 성공! 🎉</span>}
            {pState.isActive && isMe && status === 'PLAYING' && (
              <div className="flex items-center ml-4 gap-1">
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
            )}"""

content = content.replace(target_bottomPlayer, replace_bottomPlayer)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
