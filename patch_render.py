import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add drawingState overlay and vignette
target_vignette = "      <AnimatePresence>"
replacement_vignette = """      {isMyTurn && targetPid && (players[targetPid]?.hand || []).some(c => c.value === 'JOKER') && (
        <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(220,38,38,0.4)] animate-pulse z-0"></div>
      )}
      <AnimatePresence>
        {drawingState && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 bg-black/85 flex flex-col items-center justify-center backdrop-blur-sm">
             <motion.h3 
               animate={{ scale: [1, 1.05, 1] }} 
               transition={{ repeat: Infinity, duration: 1 }}
               className="text-3xl md:text-5xl font-black text-white mb-12 drop-shadow-lg text-center px-4"
             >
               {session.players[drawingState.drawer]?.nickname || drawingState.drawer}님이<br/><span className="text-yellow-400">카드를 뽑고 있습니다...</span>
             </motion.h3>
             <motion.div
               initial={{ scale: 0, y: 100 }}
               animate={{ scale: 1.5, y: 0, rotateY: [0, 5, -5, 0] }}
               transition={{ duration: 0.5 }}
               className="relative"
             >
               <motion.div animate={{ x: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 0.1 }}>
                 <Card isBack />
               </motion.div>
             </motion.div>
          </motion.div>
        )}"""

content = content.replace(target_vignette, replacement_vignette)

# Add timer bar
target_timer = """              <span className="font-black text-2xl md:text-4xl text-yellow-400">
                {status === 'FINISHED' ? '게임 종료! 조커의 주인공이 결정되었습니다...' : (isMyTurn ? '🚨 내 차례입니다! 카드를 뽑아주세요 🚨' : `${session.players[currentTurnPid]?.nickname || currentTurnPid}님의 턴!`)}
              </span>
              {message && status === 'PLAYING' && <div className="text-lg md:text-2xl text-yellow-100 mt-2 font-bold">{message}</div>}"""

replacement_timer = """              <span className="font-black text-2xl md:text-4xl text-yellow-400">
                {status === 'FINISHED' ? '게임 종료! 조커의 주인공이 결정되었습니다...' : (isMyTurn ? '🚨 내 차례입니다! 카드를 뽑아주세요 🚨' : `${session.players[currentTurnPid]?.nickname || currentTurnPid}님의 턴!`)}
              </span>
              {message && status === 'PLAYING' && <div className="text-lg md:text-2xl text-yellow-100 mt-2 font-bold">{message}</div>}
              {status === 'PLAYING' && !drawingState && (
                <div className="mt-4 flex items-center justify-center gap-3">
                   <div className="w-full max-w-[200px] md:max-w-[300px] h-4 bg-black/80 rounded-full overflow-hidden border border-gray-600">
                      <div className={`h-full transition-all duration-1000 ${timeLeft <= 5 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} style={{ width: `${(timeLeft / TURN_LIMIT) * 100}%` }}></div>
                   </div>
                   <span className={`font-bold text-xl md:text-2xl ${timeLeft <= 5 ? 'text-red-400 animate-bounce' : 'text-gray-300'}`}>{timeLeft}초</span>
                </div>
              )}"""

content = content.replace(target_timer, replacement_timer)

# Add hover effect to cards
target_card = """              <Card 
                key={c.id} 
                value={c.value}
                isBack={!(status === 'FINISHED' && pid === loserId) && !isMe} 
                isTarget={isTarget && amICurrent}
                onClick={() => {
                  if (isTarget && amICurrent && !drawingState) initiateDraw(pid, i);
                }} 
              />"""

replacement_card = """              <div 
                key={c.id} 
                className={`transition-transform duration-200 ${isTarget && amICurrent && !drawingState ? 'hover:-translate-y-4 hover:scale-110 cursor-pointer' : ''}`}
                onClick={() => {
                  if (isTarget && amICurrent && !drawingState) initiateDraw(pid, i);
                }} 
              >
                <Card 
                  value={c.value}
                  isBack={!(status === 'FINISHED' && pid === loserId) && !isMe} 
                  isTarget={isTarget && amICurrent}
                />
              </div>"""

content = content.replace(target_card, replacement_card)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

