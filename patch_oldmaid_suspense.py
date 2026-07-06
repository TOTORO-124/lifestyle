import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add timer state and logic
state_block = """  const { players, turnOrder, currentTurnIndex, status, loserId, effect, message } = game;
  const isMyTurn = turnOrder[currentTurnIndex] === currentUser.uid;
  const currentTurnPid = turnOrder[currentTurnIndex];"""

new_state_block = """  const { players, turnOrder, currentTurnIndex, status, loserId, effect, message, drawingState, turnStartTime } = game;
  const isMyTurn = turnOrder[currentTurnIndex] === currentUser.uid;
  const currentTurnPid = turnOrder[currentTurnIndex];
  
  const TURN_LIMIT = 15;
  const [timeLeft, setTimeLeft] = useState(TURN_LIMIT);

  useEffect(() => {
    if (status === 'PLAYING' && !drawingState) {
      const start = turnStartTime || game.startTime;
      const timer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - start) / 1000);
        const remain = Math.max(0, TURN_LIMIT - elapsed);
        setTimeLeft(remain);

        // Auto-draw if time is up and it's my turn
        if (remain === 0 && isMyTurn) {
          const nextActiveIdx = getNextActivePlayerIndex(currentTurnIndex);
          if (nextActiveIdx !== -1) {
            const targetPlayerId = turnOrder[nextActiveIdx];
            const targetHand = players[targetPlayerId]?.hand || [];
            if (targetHand.length > 0) {
              const randomCardIndex = Math.floor(Math.random() * targetHand.length);
              initiateDraw(targetPlayerId, randomCardIndex);
            }
          }
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status, isMyTurn, turnStartTime, game.startTime, drawingState, currentTurnIndex, players, turnOrder]);"""

content = content.replace(state_block, new_state_block)

# 2. Add initiateDraw logic
initiate_draw = """  const initiateDraw = async (targetId: string, cardIndex: number) => {
    if (status !== 'PLAYING' || drawingState) return;
    if (turnOrder[currentTurnIndex] !== currentUser.uid && !turnOrder[currentTurnIndex].startsWith('CPU_')) return;
    
    await sessionService.updateOldMaidGame(session.id, { 
      drawingState: { pid: targetId, cardIndex, drawer: turnOrder[currentTurnIndex], timestamp: Date.now() } 
    });
  };

  useEffect(() => {
    if (drawingState && drawingState.drawer === currentUser.uid) {
      const elapsed = Date.now() - drawingState.timestamp;
      const delay = Math.max(0, 2500 - elapsed); // 2.5 seconds suspense
      const timer = setTimeout(() => {
        handleDrawCard(drawingState.pid, drawingState.cardIndex);
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [drawingState, currentUser.uid]);"""

content = content.replace("  const handleDrawCard = async", initiate_draw + "\n\n  const handleDrawCard = async")

# 3. Add updates.drawingState = null;
handle_draw = """    const updates: any = {
      players: newPlayers,
      effect: eff,
      effectTimestamp: Date.now(),
      message: msg
    };"""

new_handle_draw = """    const updates: any = {
      players: newPlayers,
      effect: eff,
      effectTimestamp: Date.now(),
      message: msg,
      drawingState: null
    };"""

content = content.replace(handle_draw, new_handle_draw)

# 4. CPU uses initiateDraw instead of handleDrawCard
cpu_block = """            if (players[targetPlayerId] && (players[targetPlayerId].hand || []).length > 0) { 
               const randomCardIndex = Math.floor(Math.random() * (players[targetPlayerId].hand || []).length);
               handleDrawCard(targetPlayerId, randomCardIndex);
            }"""

new_cpu_block = """            if (players[targetPlayerId] && (players[targetPlayerId].hand || []).length > 0) { 
               const randomCardIndex = Math.floor(Math.random() * (players[targetPlayerId].hand || []).length);
               initiateDraw(targetPlayerId, randomCardIndex);
            }"""
content = content.replace(cpu_block, new_cpu_block)

# 5. UI click uses initiateDraw
ui_block = """                onClick={() => {
                  if (isTarget && amICurrent) handleDrawCard(pid, i);
                }}"""

new_ui_block = """                onClick={() => {
                  if (isTarget && amICurrent && !drawingState) initiateDraw(pid, i);
                }}"""
content = content.replace(ui_block, new_ui_block)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
