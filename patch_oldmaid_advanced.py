import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update floating emojis state to support card index
state_search = """  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string, pid: string, emoji: string }[]>([]);"""
state_replace = """  const [floatingEmojis, setFloatingEmojis] = useState<{ id: string, pid: string, emoji: string, cardIndex?: number }[]>([]);
  const [dealAnimation, setDealAnimation] = useState(true);

  useEffect(() => {
    if (status === 'PLAYING') {
      setDealAnimation(true);
      const t = setTimeout(() => setDealAnimation(false), 2000);
      return () => clearTimeout(t);
    }
  }, [status === 'PLAYING']);
"""
content = content.replace(state_search, state_replace)

# 2. Update effect parsing to handle PING
effect_search = """      } else if (effect.startsWith('EMOJI_')) {
        const parts = effect.split('_');
        const pid = parts[1];
        const emoji = parts[2];
        const id = Date.now() + Math.random().toString();
        setFloatingEmojis(prev => [...prev, { id, pid, emoji }]);
        setTimeout(() => {
          setFloatingEmojis(prev => prev.filter(e => e.id !== id));
        }, 2000);
      } else {"""
effect_replace = """      } else if (effect.startsWith('EMOJI_')) {
        const parts = effect.split('_');
        const pid = parts[1];
        const emoji = parts[2];
        const id = Date.now() + Math.random().toString();
        setFloatingEmojis(prev => [...prev, { id, pid, emoji }]);
        setTimeout(() => {
          setFloatingEmojis(prev => prev.filter(e => e.id !== id));
        }, 2000);
      } else if (effect.startsWith('PING_')) {
        const parts = effect.split('_');
        const pid = parts[1];
        const cidx = parseInt(parts[2], 10);
        const id = Date.now() + Math.random().toString();
        setFloatingEmojis(prev => [...prev, { id, pid, emoji: '✨', cardIndex: cidx }]);
        setTimeout(() => {
          setFloatingEmojis(prev => prev.filter(e => e.id !== id));
        }, 2000);
      } else {"""
content = content.replace(effect_search, effect_replace)

# 3. Bottom Player Hand Rendering (Fan shape & PING overlay)
bottom_hand_search = """          <div className="flex flex-nowrap justify-center -space-x-[1rem] sm:-space-x-[2rem] md:-space-x-[3rem] p-4 md:p-6 w-full pb-8 px-8">
            <AnimatePresence>
              {(pState.hand || []).map((card, i) => (
                <motion.div
                  key={card.id || i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, y: -50, opacity: 0 }}
                  className="flex-shrink-0 transition-transform duration-200 hover:-translate-y-6 hover:z-30 relative"
                >
                  <Card value={card.value} suit={card.suit} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>"""

bottom_hand_replace = """          <div className="flex flex-nowrap justify-center -space-x-[1rem] sm:-space-x-[2rem] md:-space-x-[3rem] p-4 md:p-6 w-full pb-8 px-8 perspective-1000">
            <AnimatePresence>
              {(pState.hand || []).map((card, i) => {
                const total = pState.hand.length;
                const middle = (total - 1) / 2;
                const rotation = (i - middle) * 4;
                const yOffset = Math.abs(i - middle) * 3;
                const isPinged = floatingEmojis.some(e => e.pid === pid && e.cardIndex === i);
                
                return (
                  <motion.div
                    key={card.id || i}
                    initial={{ scale: 0, opacity: 0, y: dealAnimation ? -500 : 50 }}
                    animate={{ scale: 1, opacity: 1, rotate: rotation, y: yOffset }}
                    exit={{ scale: 0, y: -100, opacity: 0 }}
                    transition={{ duration: dealAnimation ? 0.6 : 0.3, delay: dealAnimation ? i * 0.05 : 0 }}
                    className={`flex-shrink-0 transition-transform duration-200 hover:-translate-y-6 hover:z-30 relative group ${isPinged ? 'animate-pulse drop-shadow-[0_0_15px_rgba(255,215,0,1)]' : ''}`}
                    style={{ transformOrigin: 'bottom center', zIndex: i }}
                  >
                    <Card value={card.value} suit={card.suit} />
                    {isPinged && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl animate-bounce z-50">✨</div>
                    )}
                    {isTarget && !amICurrent && (
                      <button 
                        onClick={() => sessionService.sendOldMaidPing(session.id, pid, i)}
                        className="absolute inset-0 w-full h-full z-40 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-black/40 text-2xl rounded-xl transition-opacity"
                        title="이 카드 뽑아보라고 도발하기"
                      >
                        👇
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>"""
content = content.replace(bottom_hand_search, bottom_hand_replace)


# 4. Opponent Hand Rendering (Fan shape & PING overlay & Drawing animation)
opponent_hand_search = """        <div className={`flex ${vertical ? 'flex-col -space-y-[2.2rem] sm:-space-y-[4.2rem] md:-space-y-[5.5rem] py-4' : 'flex-nowrap justify-center -space-x-[1.2rem] sm:-space-x-[2.2rem] md:-space-x-[3.2rem] px-4'} items-center justify-center`}>
          {(pState.hand || []).map((c, i) => {
            return (
              <div 
                key={c.id || i} 
                className={`transition-transform duration-200 ${isTarget && amICurrent && !drawingState ? 'hover:-translate-y-4 hover:scale-110 cursor-pointer' : ''}`}
                onClick={() => {
                  if (isTarget && amICurrent && !drawingState) initiateDraw(pid, i);
                }} 
              >
                <Card 
                  value={c.value}
                  suit={c.suit}
                  isBack={!(status === 'FINISHED' && pid === loserId) && !isMe} 
                  isTarget={isTarget && amICurrent}
                />
              </div>
            )
          })}
        </div>"""

opponent_hand_replace = """        <div className={`flex ${vertical ? 'flex-col -space-y-[2.2rem] sm:-space-y-[4.2rem] md:-space-y-[5.5rem] py-4' : 'flex-nowrap justify-center -space-x-[1.2rem] sm:-space-x-[2.2rem] md:-space-x-[3.2rem] px-4'} items-center justify-center perspective-1000`}>
          <AnimatePresence>
            {(pState.hand || []).map((c, i) => {
              const total = pState.hand.length;
              const middle = (total - 1) / 2;
              const rotation = vertical ? 0 : (i - middle) * 3;
              const yOffset = vertical ? 0 : Math.abs(i - middle) * 1.5;
              const isPinged = floatingEmojis.some(e => e.pid === pid && e.cardIndex === i);
              const isBeingDrawn = drawingState?.pid === pid && drawingState?.cardIndex === i;
              
              return (
                <motion.div 
                  key={c.id || i}
                  initial={{ scale: 0, opacity: 0, y: dealAnimation ? 200 : 0, x: dealAnimation && vertical ? (position === 'left' ? 200 : -200) : 0 }}
                  animate={{ 
                    scale: isBeingDrawn ? 1.2 : 1, 
                    opacity: isBeingDrawn ? 0.5 : 1, 
                    rotate: rotation, 
                    y: isBeingDrawn ? 100 : yOffset,
                    zIndex: isBeingDrawn ? 100 : i
                  }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: dealAnimation ? 0.6 : 0.3, delay: dealAnimation ? i * 0.05 : 0 }}
                  className={`transition-transform duration-200 relative ${isTarget && amICurrent && !drawingState ? 'hover:-translate-y-4 hover:scale-110 cursor-pointer z-40' : ''} ${isPinged ? 'animate-pulse drop-shadow-[0_0_15px_rgba(255,215,0,1)]' : ''}`}
                  style={{ transformOrigin: vertical ? 'center center' : 'bottom center', zIndex: isBeingDrawn ? 100 : i }}
                  onClick={() => {
                    if (isTarget && amICurrent && !drawingState) initiateDraw(pid, i);
                  }} 
                >
                  <Card 
                    value={c.value}
                    suit={c.suit}
                    isBack={!(status === 'FINISHED' && pid === loserId) && !isMe} 
                    isTarget={isTarget && amICurrent}
                  />
                  {isPinged && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl animate-bounce z-50">✨</div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>"""
content = content.replace(opponent_hand_search, opponent_hand_replace)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
