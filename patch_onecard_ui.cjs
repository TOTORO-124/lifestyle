const fs = require('fs');

const path = 'src/components/OneCard.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetStr = `  if (gameState.status === 'FINISHED') {
    return (
      <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center z-[100] p-8 text-center text-white">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-8xl mb-6 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]">🏆</motion.div>
        <h2 className="text-5xl sm:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 mb-4 drop-shadow-lg">
          {gameState?.winnerId ? (session.players[gameState.winnerId]?.nickname || '컴퓨터') : '누군가'} 승리!
        </h2>
        <p className="text-xl text-slate-400 mb-12">게임이 종료되었습니다.</p>
        
        <div className="flex gap-4">`;

const replaceStr = `  if (gameState.status === 'FINISHED') {
    const isBankrupt = gameState.loserId && gameState.players[gameState.loserId]?.hand.length >= 20;
    return (
      <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center z-[100] p-4 sm:p-8 text-center text-white overflow-y-auto">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl sm:text-8xl mb-6 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]">
          {isBankrupt ? '💸' : '🎯'}
        </motion.div>
        <h2 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 mb-2 drop-shadow-lg leading-tight">
          게임 종료!
        </h2>
        {gameState.loserId && (
          <p className="text-xl sm:text-3xl font-bold text-rose-400 mb-6">
            {session.players[gameState.loserId]?.nickname || '컴퓨터'}님 {isBankrupt ? '파산 (20장 초과)' : '패배'}! 꼴찌입니다.
          </p>
        )}
        
        {gameState.rankings && gameState.rankings.length > 0 && (
          <div className="bg-slate-800/80 rounded-2xl p-6 mb-8 w-full max-w-md border border-slate-700 shadow-xl">
            <h3 className="text-2xl font-black text-slate-200 mb-4">순위</h3>
            <ul className="space-y-3">
              {gameState.rankings.map((pid, idx) => (
                <li key={pid} className="flex justify-between items-center text-lg bg-slate-700/50 p-3 rounded-xl">
                  <span className="font-bold text-slate-300">{idx + 1}등</span>
                  <span className="font-bold text-white">{session.players[pid]?.nickname || '컴퓨터'}</span>
                </li>
              ))}
              {gameState.loserId && (
                <li className="flex justify-between items-center text-lg bg-rose-900/30 border border-rose-500/30 p-3 rounded-xl">
                  <span className="font-bold text-rose-400">{gameState.rankings.length + 1}등 (꼴찌)</span>
                  <span className="font-bold text-rose-100">{session.players[gameState.loserId]?.nickname || '컴퓨터'}</span>
                </li>
              )}
            </ul>
          </div>
        )}
        
        <div className="flex gap-4">`;

code = code.replace(targetStr, replaceStr);
fs.writeFileSync(path, code);
console.log('patched UI');
