import re

with open('src/services/oneCardOnlineService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("updatedAt: serverTimestamp()", "updatedAt: serverTimestamp(),\n        turnId: (roomData.turnId || 0) + 1")

with open('src/services/oneCardOnlineService.ts', 'w', encoding='utf-8') as f:
    f.write(content)

with open('src/components/OneCardLobby.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

if "turnId: 0" not in content:
    content = content.replace("updatedAt: serverTimestamp()", "updatedAt: serverTimestamp(),\n        turnId: 0")
    with open('src/components/OneCardLobby.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

with open('src/components/OneCardOnline.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add lastProcessedTurnId ref
if "lastProcessedTurnId" not in content:
    content = content.replace("const [showRules, setShowRules] = useState(false);", "const [showRules, setShowRules] = useState(false);\n  const lastProcessedTurnId = useRef<number>(-1);")

# Update bot logic inside OneCardOnline.tsx
bot_logic_target = """  useEffect(() => {
    if (!roomData || !firestore || players.length === 0) return;
    
    if (roomData.winnerUid) return;
    if (roomData.status !== 'playing') return;

    const currentTurnPlayer = players.find(p => p.seat === roomData.currentTurnSeat);
    if (!currentTurnPlayer || !currentTurnPlayer.isBot) return;

    const timer = setTimeout(async () => {
      const botHand = currentTurnPlayer.hand || [];
      const playableIndex = botHand.findIndex((c: any) => isPlayable(c, roomData.currentCard, roomData.declaredSuit, roomData.penaltyStack));
      const playerUids = players.map(p => p.uid);

      if (playableIndex !== -1) {
        const card = botHand[playableIndex];
        let chosenSuit = undefined;
        if (card.rank === '7') {
          const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
          chosenSuit = suits[Math.floor(Math.random() * suits.length)];
        }
        
        try {
          await oneCardOnlineService.playCardOnline(roomId, currentTurnPlayer.uid, card.id, playerUids, chosenSuit);
          if (botHand.length === 2) {
            await oneCardOnlineService.declareOneCardOnline(roomId, currentTurnPlayer.uid);
          }
        } catch(e) {
          console.error("Bot failed to play card", e);
        }
      } else {
        try {
          await oneCardOnlineService.drawCardOnline(roomId, currentTurnPlayer.uid, playerUids);
        } catch(e) {
          console.error("Bot failed to draw card", e);
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [roomData, players, roomId]);"""

bot_logic_replacement = """  useEffect(() => {
    if (!roomData || !firestore || players.length === 0) return;
    
    if (roomData.winnerUid) return;
    if (roomData.status !== 'playing') return;

    // Decide which client runs the bot: the active human player with the lowest seat index
    const humanPlayers = players.filter(p => !p.isBot).sort((a, b) => a.seat - b.seat);
    const botControllerUid = humanPlayers.length > 0 ? humanPlayers[0].uid : null;
    if (uid !== botControllerUid) return; // Only one client controls the bots

    const currentTurnPlayer = players.find(p => p.seat === roomData.currentTurnSeat);
    if (!currentTurnPlayer || !currentTurnPlayer.isBot) return;

    if (lastProcessedTurnId.current === roomData.turnId) return;
    lastProcessedTurnId.current = roomData.turnId;

    const timer = setTimeout(async () => {
      const botHand = currentTurnPlayer.hand || [];
      const playableIndex = botHand.findIndex((c: any) => isPlayable(c, roomData.currentCard, roomData.declaredSuit, roomData.penaltyStack));
      const playerUids = players.map(p => p.uid);

      if (playableIndex !== -1) {
        const card = botHand[playableIndex];
        let chosenSuit = undefined;
        if (card.rank === '7') {
          const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
          chosenSuit = suits[Math.floor(Math.random() * suits.length)];
        }
        
        try {
          await oneCardOnlineService.playCardOnline(roomId, currentTurnPlayer.uid, card.id, playerUids, chosenSuit);
          // Check if bot needs to say 'One Card'
          if (botHand.length === 2) {
            await oneCardOnlineService.declareOneCardOnline(roomId, currentTurnPlayer.uid);
          }
        } catch(e) {
          console.error("Bot failed to play card", e);
        }
      } else {
        try {
          await oneCardOnlineService.drawCardOnline(roomId, currentTurnPlayer.uid, playerUids);
        } catch(e) {
          console.error("Bot failed to draw card", e);
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [roomData, players, roomId, uid]);"""

if "humanPlayers" not in content:
    content = content.replace(bot_logic_target, bot_logic_replacement)
    with open('src/components/OneCardOnline.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

