import re

with open('src/components/OneCardOnline.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# I want to replace the whole useEffect that starts around line 62
bot_effect_pattern = r"  useEffect\(\(\) => \{\n    if \(!roomData \|\| !firestore \|\| players\.length === 0\) return;\n.*?\n  \}, \[roomData, players, roomId, uid\]\);"

new_effect = """  useEffect(() => {
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
      const gameState = {
        discardPile: roomData.discardPile || [roomData.currentCard],
        currentSuit: roomData.declaredSuit || roomData.currentCard.suit,
        penaltyStack: roomData.penaltyStack || 0
      };
      
      const botAction = getBotAction(botHand, gameState as any);
      const playerUids = players.map(p => p.uid);

      try {
        if (botAction.action === 'PLAY') {
          await oneCardOnlineService.playCardOnline(roomId, currentTurnPlayer.uid, botAction.card.id, playerUids, botAction.changedSuit);
          if (botHand.length === 2) {
            await oneCardOnlineService.declareOneCardOnline(roomId, currentTurnPlayer.uid);
          }
        } else {
          await oneCardOnlineService.drawCardOnline(roomId, currentTurnPlayer.uid, playerUids);
        }
      } catch(e) {
        console.error("Bot failed to execute action", e);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [roomData, players, roomId, uid]);"""

# The existing code ends with }, [roomId]); or }, [roomData, players, roomId, uid]); or similar.
# Let's just find `  useEffect(() => {` and the next `  }, [` and replace it.
start_idx = content.find("  useEffect(() => {\n    if (!roomData || !firestore || players.length === 0) return;")
if start_idx != -1:
    end_idx = content.find("  }, [", start_idx)
    end_idx = content.find(");", end_idx) + 2
    
    content = content[:start_idx] + new_effect + content[end_idx:]
    with open('src/components/OneCardOnline.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
