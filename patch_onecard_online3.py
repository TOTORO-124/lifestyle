import re

with open('src/components/OneCardOnline.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure oneCardOnlineService is imported
if 'oneCardOnlineService' not in content:
    content = content.replace("import { isPlayable", "import { oneCardOnlineService } from '../services/oneCardOnlineService';\nimport { isPlayable")

# Remove unused imports if present
content = content.replace("writeBatch, ", "")
content = content.replace("increment, ", "")

target_play_card = """  const playCard = async (cardIndex: number, chosenSuit?: string) => {
    if (!firestore || !isMyTurn) return;
    const card = me.hand[cardIndex];

    if (card.rank === '7' && !chosenSuit) {
      setPendingCardIndex(cardIndex);
      setSuitPickerOpen(true);
      return;
    }
    
    setSuitPickerOpen(false);
    setPendingCardIndex(null);

    const batch = writeBatch(firestore);
    const roomRef = doc(firestore, 'rooms', roomId);
    const myRef = doc(firestore, 'rooms', roomId, 'players', uid);

    let nextPenalty = roomData.penaltyStack;
    if (isAttackCard(card)) {
      nextPenalty += getAttackValue(card);
    }
    
    let nextDirection = roomData.direction;
    let skip = 1;
    if (card.rank === 'Q') nextDirection *= -1;
    if (card.rank === 'J') skip = 2;
    if (card.rank === 'K') skip = 0; // Play again

    let nextTurnSeat = (roomData.currentTurnSeat + skip * nextDirection) % numPlayers;
    if (nextTurnSeat < 0) nextTurnSeat += numPlayers;

    const newHand = [...me.hand];
    newHand.splice(cardIndex, 1);

    // Winner check
    let winnerUid = roomData.winnerUid;
    if (newHand.length === 0) {
      winnerUid = uid;
    }

    batch.update(roomRef, {
      currentCard: card,
      discardPile: [...(roomData.discardPile || []), card],
      penaltyStack: nextPenalty,
      direction: nextDirection,
      currentTurnSeat: nextTurnSeat,
      declaredSuit: chosenSuit || null,
      winnerUid: winnerUid,
      updatedAt: serverTimestamp()
    });

    batch.update(myRef, {
      hand: newHand,
      handCount: newHand.length,
      saidOneCard: false
    });

    await batch.commit();
  };"""

replace_play_card = """  const playCard = async (cardIndex: number, chosenSuit?: string) => {
    if (!isMyTurn) return;
    const card = me.hand[cardIndex];

    if (card.rank === '7' && !chosenSuit) {
      setPendingCardIndex(cardIndex);
      setSuitPickerOpen(true);
      return;
    }
    
    setSuitPickerOpen(false);
    setPendingCardIndex(null);

    const playerUids = players.map(p => p.uid);
    try {
      await oneCardOnlineService.playCardOnline(roomId, uid, card.id, playerUids, chosenSuit);
    } catch (e: any) {
      alert(e.message);
    }
  };"""

if target_play_card in content:
    content = content.replace(target_play_card, replace_play_card)


target_draw_card = """  const drawCard = async () => {
    if (!firestore || !isMyTurn) return;
    
    const batch = writeBatch(firestore);
    const roomRef = doc(firestore, 'rooms', roomId);
    const myRef = doc(firestore, 'rooms', roomId, 'players', uid);

    let deck = [...(roomData.deck || [])];
    const discardPile = [...(roomData.discardPile || [])];
    
    let drawCount = roomData.penaltyStack > 0 ? roomData.penaltyStack : 1;
    let newHand = [...me.hand];

    for (let i = 0; i < drawCount; i++) {
      if (deck.length === 0) {
        if (discardPile.length <= 1) break; // Nothing to draw
        // Shuffle discard pile back to deck
        const topCard = discardPile.pop();
        deck = [...discardPile];
        for (let j = deck.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          [deck[j], deck[k]] = [deck[k], deck[j]];
        }
        discardPile.length = 0;
        if (topCard) discardPile.push(topCard);
      }
      const drawn = deck.shift();
      if (drawn) newHand.push(drawn);
    }

    let nextTurnSeat = (roomData.currentTurnSeat + roomData.direction) % numPlayers;
    if (nextTurnSeat < 0) nextTurnSeat += numPlayers;

    batch.update(roomRef, {
      deck,
      discardPile,
      penaltyStack: 0,
      currentTurnSeat: nextTurnSeat,
      updatedAt: serverTimestamp()
    });

    batch.update(myRef, {
      hand: newHand,
      handCount: newHand.length,
      saidOneCard: false
    });

    await batch.commit();
  };"""

replace_draw_card = """  const drawCard = async () => {
    if (!isMyTurn) return;
    const playerUids = players.map(p => p.uid);
    try {
      await oneCardOnlineService.drawCardOnline(roomId, uid, playerUids);
    } catch (e: any) {
      alert(e.message);
    }
  };"""

if target_draw_card in content:
    content = content.replace(target_draw_card, replace_draw_card)


target_declare = """  const declareOneCard = async () => {
    if (!firestore || !me) return;
    const myRef = doc(firestore, 'rooms', roomId, 'players', uid);
    await updateDoc(myRef, { saidOneCard: true });
  };"""

replace_declare = """  const declareOneCard = async () => {
    try {
      await oneCardOnlineService.declareOneCardOnline(roomId, uid);
    } catch (e: any) {
      alert(e.message);
    }
  };"""

if target_declare in content:
    content = content.replace(target_declare, replace_declare)


target_bot = """    const timer = setTimeout(async () => {
      const botRef = doc(firestore, 'rooms', roomId, 'players', currentTurnPlayer.uid);
      const roomRef = doc(firestore, 'rooms', roomId);
      
      const botHand = currentTurnPlayer.hand || [];
      const playableIndex = botHand.findIndex((c: any) => isPlayable(c, roomData.currentCard, roomData.declaredSuit, roomData.penaltyStack));

      const batch = writeBatch(firestore);

      if (playableIndex !== -1) {
        // Play card
        const card = botHand[playableIndex];
        let chosenSuit = undefined;
        if (card.rank === '7') {
          const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
          chosenSuit = suits[Math.floor(Math.random() * suits.length)];
        }

        let nextPenalty = roomData.penaltyStack;
        if (isAttackCard(card)) {
          nextPenalty += getAttackValue(card);
        }
        
        let nextDirection = roomData.direction;
        let skip = 1;
        if (card.rank === 'Q') nextDirection *= -1;
        if (card.rank === 'J') skip = 2;
        if (card.rank === 'K') skip = 0;

        let nextTurnSeat = (roomData.currentTurnSeat + skip * nextDirection) % players.length;
        if (nextTurnSeat < 0) nextTurnSeat += players.length;

        const newHand = [...botHand];
        newHand.splice(playableIndex, 1);

        let winnerUid = roomData.winnerUid;
        if (newHand.length === 0) {
          winnerUid = currentTurnPlayer.uid;
        }

        batch.update(roomRef, {
          currentCard: card,
          discardPile: [...(roomData.discardPile || []), card],
          penaltyStack: nextPenalty,
          direction: nextDirection,
          currentTurnSeat: nextTurnSeat,
          declaredSuit: chosenSuit || null,
          winnerUid: winnerUid,
          updatedAt: serverTimestamp()
        });

        batch.update(botRef, {
          hand: newHand,
          handCount: newHand.length,
          saidOneCard: newHand.length === 1 // Bot always says one card
        });

      } else {
        // Draw card
        let deck = [...(roomData.deck || [])];
        const discardPile = [...(roomData.discardPile || [])];
        
        let drawCount = roomData.penaltyStack > 0 ? roomData.penaltyStack : 1;
        let newHand = [...botHand];

        for (let i = 0; i < drawCount; i++) {
          if (deck.length === 0) {
            if (discardPile.length <= 1) break;
            const topCard = discardPile.pop();
            deck = [...discardPile];
            for (let j = deck.length - 1; j > 0; j--) {
              const k = Math.floor(Math.random() * (j + 1));
              [deck[j], deck[k]] = [deck[k], deck[j]];
            }
            discardPile.length = 0;
            if (topCard) discardPile.push(topCard);
          }
          const drawn = deck.shift();
          if (drawn) newHand.push(drawn);
        }

        let nextTurnSeat = (roomData.currentTurnSeat + roomData.direction) % players.length;
        if (nextTurnSeat < 0) nextTurnSeat += players.length;

        batch.update(roomRef, {
          deck,
          discardPile,
          penaltyStack: 0,
          currentTurnSeat: nextTurnSeat,
          updatedAt: serverTimestamp()
        });

        batch.update(botRef, {
          hand: newHand,
          handCount: newHand.length
        });
      }

      await batch.commit();
    }, 1500);"""

replace_bot = """    const timer = setTimeout(async () => {
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
    }, 1500);"""

if target_bot in content:
    content = content.replace(target_bot, replace_bot)

with open('src/components/OneCardOnline.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
