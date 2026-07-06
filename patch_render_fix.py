import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the first accidental replacement (inside renderPlayer 'bottom')
bad_block = """            {isMyTurn && targetPid && (players[targetPid]?.hand || []).some(c => c.value === 'JOKER') && (
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
good_block = """            <AnimatePresence>"""
content = content.replace(bad_block, good_block, 1)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
