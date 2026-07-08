import re

with open('src/components/OneCardLobby.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'import { createDeck, shuffleDeck }' not in content:
    content = content.replace("import { firestore", "import { writeBatch } from 'firebase/firestore';\nimport { createDeck, shuffleDeck } from '../game/cardUtils';\nimport { firestore")

target_start_game = """  const startGame = async () => {
    if (!firestore || !roomId) return;
    // Check if everyone is ready (excluding host if host is always ready)
    const allReady = players.every(p => p.isReady);
    if (!allReady) {
      setError("모두 준비를 완료해야 시작할 수 있습니다.");
      return;
    }
    await updateDoc(doc(firestore, 'rooms', roomId), {
      status: 'playing',
      updatedAt: serverTimestamp(),
        turnId: 0
    });
  };"""

replacement_start_game = """  const startGame = async () => {
    if (!firestore || !roomId) return;
    const allReady = players.every(p => p.isReady);
    if (!allReady) {
      setError("모두 준비를 완료해야 시작할 수 있습니다.");
      return;
    }
    
    let deck = shuffleDeck(createDeck());
    const batch = writeBatch(firestore);
    
    players.forEach(p => {
      const hand = deck.splice(0, 7);
      batch.update(doc(firestore, 'rooms', roomId, 'players', p.uid), {
        hand,
        handCount: 7,
        saidOneCard: false
      });
    });
    
    const firstCard = deck.shift();
    
    batch.update(doc(firestore, 'rooms', roomId), {
      status: 'playing',
      currentTurnSeat: 0,
      direction: 1,
      currentCard: firstCard,
      deck: deck,
      discardPile: [firstCard],
      penaltyStack: 0,
      declaredSuit: null,
      winnerUid: null,
      turnId: 0,
      botProcessing: false,
      updatedAt: serverTimestamp()
    });
    
    await batch.commit();
  };"""

if 'batch.commit()' not in content:
    content = content.replace(target_start_game, replacement_start_game)
    with open('src/components/OneCardLobby.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

