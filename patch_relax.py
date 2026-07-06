import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """      {/* Effect Overlays */}
      {isMyTurn && targetPid && (players[targetPid]?.hand || []).some(c => c.value === 'JOKER') && (
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

replacement = """      {/* Effect Overlays */}
      <AnimatePresence>
        {drawingState && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-40 bg-black/70 flex flex-col items-center justify-center backdrop-blur-md">
             <div className="text-center space-y-8 bg-black/50 p-10 rounded-2xl border border-gray-700 shadow-2xl">
                <h3 className="text-2xl md:text-4xl font-bold text-white tracking-wide">
                  {session.players[drawingState.drawer]?.nickname || drawingState.drawer}님이<br/>
                  <span className="text-yellow-400 block mt-2">카드를 조심스럽게 확인 중입니다...</span>
                </h3>
                
                <div className="w-64 h-3 bg-gray-900 rounded-full overflow-hidden mx-auto shadow-inner border border-gray-800">
                   <motion.div 
                     initial={{ width: "0%" }} 
                     animate={{ width: "100%" }} 
                     transition={{ duration: 2.5, ease: "linear" }}
                     className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.5)]"
                   />
                </div>
             </div>
          </motion.div>
        )}"""

if target in content:
    content = content.replace(target, replacement)
    print("Replaced relax animation!")
else:
    print("Could not find the target text!")

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
