import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_lobby = """    return (
      <div className="w-full max-w-4xl mx-auto h-full min-h-[400px] md:min-h-[600px] flex flex-col bg-[#1A4D2E] text-white rounded-lg shadow-2xl relative overflow-hidden items-center justify-center space-y-6">
        <div className="text-6xl mb-4 animate-bounce">🃏</div>
        <h1 className="text-4xl md:text-5xl font-black font-sans text-yellow-400">조커 도둑잡기</h1>
        <p className="text-green-200 text-lg">심장이 쫄깃해지는 국민 눈치게임!</p>
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => setLocalState('HOW_TO_PLAY')}
            className="px-6 py-3 bg-green-800 hover:bg-green-700 rounded-full font-bold transition flex items-center gap-2 shadow-lg"
          >
            <Info className="w-5 h-5" />
            게임 방법
          </button>
          <button
            onClick={startGame}
            className="px-8 py-3 bg-[#E8B81C] hover:bg-yellow-500 text-yellow-900 rounded-full font-black text-xl transition flex items-center gap-2 shadow-lg"
          >
            <Play className="w-6 h-6" />
            시작하기
          </button>
        </div>
      </div>
    );"""

replace_lobby = """    const statsEntries = Object.entries(session.stats || {})
      .map(([pid, s]) => ({ pid, ...s }))
      .filter(s => session.players[s.pid] && !s.pid.startsWith('CPU_'))
      .sort((a, b) => b.totalScore - a.totalScore);

    return (
      <div className="w-full max-w-4xl mx-auto h-full min-h-[400px] md:min-h-[600px] flex flex-col bg-[#1A4D2E] text-white rounded-lg shadow-2xl relative overflow-hidden items-center justify-center py-10 px-4 space-y-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-6xl mb-2 animate-bounce">🃏</div>
          <h1 className="text-4xl md:text-5xl font-black font-sans text-yellow-400">조커 도둑잡기</h1>
          <p className="text-green-200 text-lg text-center">심장이 쫄깃해지는 국민 눈치게임!</p>
        </div>

        {statsEntries.length > 0 && (
          <div className="bg-black/30 rounded-xl p-6 w-full max-w-md border border-yellow-500/30">
            <h3 className="text-yellow-400 font-bold mb-4 text-center flex items-center justify-center gap-2">
              🏆 명예의 전당 (전적)
            </h3>
            <div className="space-y-3">
              {statsEntries.slice(0, 3).map((s, idx) => (
                <div key={s.pid} className="flex justify-between items-center bg-black/40 px-4 py-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-gray-400">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                    </span>
                    <span className="font-bold">{session.players[s.pid]?.nickname || '알 수 없음'}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-green-400 font-bold">{s.wins || 0}승</span>
                    <span className="text-gray-400 mx-2">|</span>
                    <span className="text-yellow-400 font-bold">{s.totalScore || 0}점</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setLocalState('HOW_TO_PLAY')}
            className="px-6 py-3 bg-green-800 hover:bg-green-700 rounded-full font-bold transition flex items-center gap-2 shadow-lg"
          >
            <Info className="w-5 h-5" />
            게임 방법
          </button>
          <button
            onClick={startGame}
            className="px-8 py-3 bg-[#E8B81C] hover:bg-yellow-500 text-yellow-900 rounded-full font-black text-xl transition flex items-center gap-2 shadow-lg"
          >
            <Play className="w-6 h-6" />
            시작하기
          </button>
        </div>
      </div>
    );"""

content = content.replace(target_lobby, replace_lobby)

target_quickchat = """            {pState.isActive && isMe && status === 'PLAYING' && (
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

replace_quickchat = """            {pState.isActive && isMe && status === 'PLAYING' && (
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
            )}"""

content = content.replace(target_quickchat, replace_quickchat)

# Also fix the floating emojis to be wider if it's text
target_emoji_render = """              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 0, scale: 0.5 }}
                animate={{ opacity: 1, y: -80, scale: 2.5 }}
                exit={{ opacity: 0, y: -150 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute top-[-40px] left-1/2 -translate-x-1/2 z-50 pointer-events-none text-6xl"
              >
                {e.emoji}
              </motion.div>"""

replace_emoji_render = """              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 0, scale: 0.5 }}
                animate={{ opacity: 1, y: -80, scale: e.emoji.length > 2 ? 1.5 : 2.5 }}
                exit={{ opacity: 0, y: -150 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={`absolute top-[-40px] left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap font-black drop-shadow-xl ${e.emoji.length > 2 ? 'bg-white text-black px-4 py-2 rounded-full border-2 border-black text-xl' : 'text-6xl'}`}
              >
                {e.emoji}
              </motion.div>"""

content = content.replace(target_emoji_render, replace_emoji_render)

target_opponent_emoji = """            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -50, scale: 2 }}
              exit={{ opacity: 0, y: -100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none text-4xl"
            >
              {e.emoji}
            </motion.div>"""

replace_opponent_emoji = """            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -50, scale: e.emoji.length > 2 ? 1 : 2 }}
              exit={{ opacity: 0, y: -100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={`absolute top-0 left-1/2 -translate-x-1/2 z-50 pointer-events-none whitespace-nowrap font-black drop-shadow-xl ${e.emoji.length > 2 ? 'bg-white text-black px-3 py-1 rounded-full border-2 border-black text-sm' : 'text-4xl'}`}
            >
              {e.emoji}
            </motion.div>"""

content = content.replace(target_opponent_emoji, replace_opponent_emoji)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
