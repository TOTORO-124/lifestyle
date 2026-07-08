import re

with open('src/components/OneCardOnline.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'import { getBotAction }' not in content:
    content = content.replace("import { isPlayable, getAttackValue, isAttackCard } from '../game/cardUtils';", "import { isPlayable, getAttackValue, isAttackCard } from '../game/cardUtils';\nimport { getBotAction } from '../game/botLogic';")

target_bot = """    const timer = setTimeout(async () => {
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
    }, 1500);"""

replacement_bot = """    const timer = setTimeout(async () => {
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
    }, 1000);"""

if 'getBotAction(' not in content:
    content = content.replace(target_bot, replacement_bot)
    with open('src/components/OneCardOnline.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
