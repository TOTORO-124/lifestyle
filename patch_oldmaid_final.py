import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add showFinishedScreen state
state_block = """  const [showEffect, setShowEffect] = useState<string | null>(null);"""
new_state_block = """  const [showFinishedScreen, setShowFinishedScreen] = useState(false);
  useEffect(() => {
    if (status === 'FINISHED') {
      const timer = setTimeout(() => setShowFinishedScreen(true), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowFinishedScreen(false);
    }
  }, [status]);

  const [showEffect, setShowEffect] = useState<string | null>(null);"""
content = content.replace(state_block, new_state_block)

# 2. Modify isBack and value in renderPlayer
card_block = """              <Card 
                key={c.id} 
                isBack 
                isTarget={isTarget && amICurrent}"""
new_card_block = """              <Card 
                key={c.id} 
                value={c.value}
                isBack={!(status === 'FINISHED' && pid === loserId) && !isMe} 
                isTarget={isTarget && amICurrent}"""
content = content.replace(card_block, new_card_block)

# 3. Modify {status === 'PLAYING' && (
play_block = """      {status === 'PLAYING' && (
        <div className="flex-1 flex flex-col p-4 relative">
          <div className="text-center mt-2 mb-4 z-20">
            <div className={`inline-block bg-black/60 border border-yellow-500/30 py-4 px-10 rounded-full shadow-2xl backdrop-blur-sm transform transition-transform ${isMyTurn ? 'animate-pulse scale-105 border-yellow-400 border-2' : ''}`}>
              <span className="font-black text-2xl md:text-4xl text-yellow-400">
                {isMyTurn ? '🚨 내 차례입니다! 카드를 뽑아주세요 🚨' : `${session.players[currentTurnPid]?.nickname || currentTurnPid}님의 턴!`}
              </span>
              {message && <div className="text-lg md:text-2xl text-yellow-100 mt-2 font-bold">{message}</div>}"""

new_play_block = """      {(status === 'PLAYING' || (status === 'FINISHED' && !showFinishedScreen)) && (
        <div className="flex-1 flex flex-col p-4 relative">
          <div className="text-center mt-2 mb-4 z-20">
            <div className={`inline-block bg-black/60 border border-yellow-500/30 py-4 px-10 rounded-full shadow-2xl backdrop-blur-sm transform transition-transform ${isMyTurn && status === 'PLAYING' ? 'animate-pulse scale-105 border-yellow-400 border-2' : ''}`}>
              <span className="font-black text-2xl md:text-4xl text-yellow-400">
                {status === 'FINISHED' ? '게임 종료! 조커의 주인공이 결정되었습니다...' : (isMyTurn ? '🚨 내 차례입니다! 카드를 뽑아주세요 🚨' : `${session.players[currentTurnPid]?.nickname || currentTurnPid}님의 턴!`)}
              </span>
              {message && status === 'PLAYING' && <div className="text-lg md:text-2xl text-yellow-100 mt-2 font-bold">{message}</div>}"""
content = content.replace(play_block, new_play_block)

# 4. Modify {status === 'FINISHED' && (
finish_block = """      {status === 'FINISHED' && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-black/90 z-50 space-y-8 absolute inset-0">"""

new_finish_block = """      {status === 'FINISHED' && showFinishedScreen && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-black/90 z-50 space-y-8 absolute inset-0">"""
content = content.replace(finish_block, new_finish_block)

# 5. Fix bottom player card map issue if needed
# Wait, bottom player has its own AnimatePresence and Card map. Let's fix that too.
bottom_card_block = """                <motion.div
                  key={card.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, y: -50, opacity: 0 }}
                  className="flex-shrink-0"
                >
                  <Card value={card.value} />
                </motion.div>"""
# This already sets value={card.value} and defaults isBack to false.
# But wait, if they are the loser, we want it face up anyway (isMe is true, so face up anyway).
# If I am observing, isMe is false, but they are at the bottom? Wait, meIndex will be 0 if observing. 
# But in this game observers aren't really handled perfectly, they see as player 0.
# The previous isBack={!(status === 'FINISHED' && pid === loserId) && !isMe} handles observation if it's the loser.

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

