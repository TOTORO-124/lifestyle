import re

with open('src/components/OneCardOnline.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = "const [pendingCardIndex, setPendingCardIndex] = useState<number | null>(null);"
replace = """const [pendingCardIndex, setPendingCardIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!roomData || !firestore || players.length === 0) return;
    
    // Only the host runs bot logic
    if (roomData.hostUid !== uid || roomData.winnerUid) return;

    const currentTurnPlayer = players.find(p => p.seat === roomData.currentTurnSeat);
    if (!currentTurnPlayer || !currentTurnPlayer.isBot) return;

    // It's a bot's turn, schedule a move
    const timer = setTimeout(async () => {
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
    }, 1500);

    return () => clearTimeout(timer);
  }, [roomData, players, roomId, uid]);"""

if target in content:
    content = content.replace(target, replace)

with open('src/components/OneCardOnline.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
