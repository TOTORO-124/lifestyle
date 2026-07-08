import re

with open('src/components/OneCardLobby.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """  const startGame = async () => {
    if (!firestore || !roomId) return;

    // Check if everyone is ready (excluding host if host is always ready)
    const allReady = players.every(p => p.isReady);
    if (!allReady) {
      setError("모두 준비를 완료해야 시작할 수 있습니다.");
      return;
    }

    await updateDoc(doc(firestore, 'rooms', roomId), {
      status: 'playing',
      updatedAt: serverTimestamp()
    });
  };"""

replace = """  const startGame = async () => {
    if (!firestore || !roomId || !roomData) return;

    // Check if everyone is ready (excluding host if host is always ready)
    const allReady = players.every(p => p.isReady);
    if (!allReady) {
      setError("모두 준비를 완료해야 시작할 수 있습니다.");
      return;
    }

    try {
      setLoading(true);
      const sortedPlayers = [...players].sort((a, b) => a.joinedAt - b.joinedAt);
      
      const suits = ['spades', 'hearts', 'diamonds', 'clubs'];
      const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      let deck: any[] = [];
      let idCounter = 0;
      for (const suit of suits) {
        for (const rank of ranks) {
          deck.push({ id: `card_${idCounter++}`, suit, rank });
        }
      }
      deck.push({ id: `card_${idCounter++}`, suit: 'joker', rank: 'black' });
      deck.push({ id: `card_${idCounter++}`, suit: 'joker', rank: 'color' });
      
      for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
      }

      for (let i = 0; i < sortedPlayers.length; i++) {
        const p = sortedPlayers[i];
        const hand = deck.splice(0, 7);
        await updateDoc(doc(firestore, 'rooms', roomId, 'players', p.uid), {
          seat: i,
          hand: hand,
          handCount: hand.length,
          saidOneCard: false
        });
      }

      const firstCard = deck.shift();

      await updateDoc(doc(firestore, 'rooms', roomId), {
        status: 'playing',
        currentTurnSeat: 0,
        direction: 1,
        currentCard: firstCard,
        deck: deck,
        discardPile: [firstCard],
        penaltyStack: 0,
        declaredSuit: null,
        winnerUid: null,
        updatedAt: serverTimestamp()
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };"""

if target in content:
    content = content.replace(target, replace)

with open('src/components/OneCardLobby.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
