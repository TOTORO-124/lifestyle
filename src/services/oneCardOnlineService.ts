import { firestore } from '../firebase';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { isPlayable, getAttackValue, isAttackCard } from '../game/cardUtils';

const shuffle = (array: any[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const drawCards = (count: number, deck: any[], discardPile: any[]) => {
  const drawn: any[] = [];
  for (let i = 0; i < count; i++) {
    if (deck.length === 0) {
      if (discardPile.length <= 1) break;
      const topCard = discardPile.pop();
      deck.push(...shuffle([...discardPile]));
      discardPile.length = 0;
      if (topCard) discardPile.push(topCard);
    }
    const card = deck.shift();
    if (card) drawn.push(card);
  }
  return { drawn, deck, discardPile };
};

const applyOneCardPenaltyIfNeeded = (uid: string, playerDocs: any[], updates: Map<string, any>, deck: any[], discardPile: any[], newLogs: any[]) => {
  playerDocs.forEach(pDoc => {
    if (!pDoc.exists()) return;
    const pData = pDoc.data();
    if (pData.uid !== uid && pData.handCount === 1 && !pData.saidOneCard) {
      const { drawn, deck: newDeck, discardPile: newDiscard } = drawCards(2, deck, discardPile);
      deck.length = 0;
      deck.push(...newDeck);
      discardPile.length = 0;
      discardPile.push(...newDiscard);
      
      const currentUpdates = updates.get(pData.uid) || {};
      const newHand = [...(currentUpdates.hand || pData.hand), ...drawn];
      updates.set(pData.uid, {
        ...currentUpdates,
        hand: newHand,
        handCount: newHand.length,
        saidOneCard: false
      });
      newLogs.push({ message: `${pData.name}님이 원카드를 선언하지 않아 카드 2장을 받았습니다.`, timestamp: Date.now() });
    }
  });
};

export const oneCardOnlineService = {
  playCardOnline: async (roomId: string, uid: string, cardId: string, playerUids: string[], selectedSuit?: string) => {
    if (!firestore) return;
    await runTransaction(firestore, async (transaction) => {
      const roomRef = doc(firestore, 'rooms', roomId);
      const roomDoc = await transaction.get(roomRef);
      if (!roomDoc.exists()) throw new Error("방을 찾을 수 없습니다.");
      const roomData = roomDoc.data();

      if (roomData.status !== 'playing') throw new Error("게임이 진행 중이 아닙니다.");
      if (roomData.winnerUid) throw new Error("이미 종료된 게임입니다.");

      const playerRefs = playerUids.map(id => doc(firestore, 'rooms', roomId, 'players', id));
      const playerDocs = await Promise.all(playerRefs.map(ref => transaction.get(ref)));
      
      const myDoc = playerDocs.find(d => d.id === uid);
      if (!myDoc || !myDoc.exists()) throw new Error("플레이어 정보를 찾을 수 없습니다.");
      const myData = myDoc.data();

      if (roomData.currentTurnSeat !== myData.seat) throw new Error("자신의 턴이 아닙니다.");

      const cardIndex = myData.hand.findIndex((c: any) => c.id === cardId);
      if (cardIndex === -1) throw new Error("해당 카드를 가지고 있지 않습니다.");
      const card = myData.hand[cardIndex];

      if (!isPlayable(card, roomData.currentCard, roomData.declaredSuit, roomData.penaltyStack)) {
        throw new Error("지금 낼 수 없는 카드입니다.");
      }

      if (card.rank === '7' && !selectedSuit) {
        throw new Error("7 카드는 무늬를 선택해야 합니다.");
      }

      let deck = [...(roomData.deck || [])];
      let discardPile = [...(roomData.discardPile || [])];
      
      const updates = new Map<string, any>();
      const newLogs = [...(roomData.logs || [])];
      
      applyOneCardPenaltyIfNeeded(uid, playerDocs, updates, deck, discardPile, newLogs);

      let nextPenalty = roomData.penaltyStack || 0;
      if (isAttackCard(card)) {
        nextPenalty += getAttackValue(card);
      }
      
      let nextDirection = roomData.direction || 1;
      let skip = 1;
      if (card.rank === 'Q') nextDirection *= -1;
      if (card.rank === 'J') skip = 2;
      if (card.rank === 'K') skip = 0;

      let nextTurnSeat = (roomData.currentTurnSeat + skip * nextDirection) % playerUids.length;
      if (nextTurnSeat < 0) nextTurnSeat += playerUids.length;

      const myNewHand = [...myData.hand];
      myNewHand.splice(cardIndex, 1);
      
      let winnerUid = roomData.winnerUid;
      if (myNewHand.length === 0) {
        winnerUid = uid;
      }

      discardPile.push(card);

      const myCurrentUpdates = updates.get(uid) || {};
      updates.set(uid, {
        ...myCurrentUpdates,
        hand: myNewHand,
        handCount: myNewHand.length,
        saidOneCard: false
      });

      let msg = `${myData.name}님이 ${card.rank === 'color' || card.rank === 'black' ? '조커' : card.suit + ' ' + card.rank} 카드를 냈습니다.`;
      if (selectedSuit) msg += ` (무늬: ${selectedSuit})`;
      newLogs.push({ message: msg, timestamp: Date.now() });
      if (newLogs.length > 10) newLogs.shift();

      transaction.update(roomRef, {
        logs: newLogs,
        currentCard: card,
        discardPile,
        deck,
        penaltyStack: nextPenalty,
        direction: nextDirection,
        currentTurnSeat: nextTurnSeat,
        declaredSuit: selectedSuit || null,
        winnerUid: winnerUid || null,
        updatedAt: serverTimestamp(),
        turnId: (roomData.turnId || 0) + 1
      });

      updates.forEach((updateData, playerUid) => {
        transaction.update(doc(firestore, 'rooms', roomId, 'players', playerUid), updateData);
      });
    });
  },

  drawCardOnline: async (roomId: string, uid: string, playerUids: string[]) => {
    if (!firestore) return;
    await runTransaction(firestore, async (transaction) => {
      const roomRef = doc(firestore, 'rooms', roomId);
      const roomDoc = await transaction.get(roomRef);
      if (!roomDoc.exists()) throw new Error("방을 찾을 수 없습니다.");
      const roomData = roomDoc.data();

      if (roomData.status !== 'playing') throw new Error("게임이 진행 중이 아닙니다.");
      if (roomData.winnerUid) throw new Error("이미 종료된 게임입니다.");

      const playerRefs = playerUids.map(id => doc(firestore, 'rooms', roomId, 'players', id));
      const playerDocs = await Promise.all(playerRefs.map(ref => transaction.get(ref)));
      
      const myDoc = playerDocs.find(d => d.id === uid);
      if (!myDoc || !myDoc.exists()) throw new Error("플레이어 정보를 찾을 수 없습니다.");
      const myData = myDoc.data();

      if (roomData.currentTurnSeat !== myData.seat) throw new Error("자신의 턴이 아닙니다.");

      let deck = [...(roomData.deck || [])];
      let discardPile = [...(roomData.discardPile || [])];
      
      const updates = new Map<string, any>();
      const newLogs = [...(roomData.logs || [])];

      applyOneCardPenaltyIfNeeded(uid, playerDocs, updates, deck, discardPile, newLogs);

      const drawCount = roomData.penaltyStack > 0 ? roomData.penaltyStack : 1;
      const { drawn: myDrawn, deck: myNewDeck, discardPile: myNewDiscard } = drawCards(drawCount, deck, discardPile);
      deck = myNewDeck;
      discardPile = myNewDiscard;

      let nextTurnSeat = (roomData.currentTurnSeat + (roomData.direction || 1)) % playerUids.length;
      if (nextTurnSeat < 0) nextTurnSeat += playerUids.length;

      const myNewHand = [...myData.hand, ...myDrawn];
      
      const myCurrentUpdates = updates.get(uid) || {};
      updates.set(uid, {
        ...myCurrentUpdates,
        hand: myNewHand,
        handCount: myNewHand.length,
        saidOneCard: false
      });

      newLogs.push({ message: `${myData.name}님이 카드를 ${drawCount}장 뽑았습니다.`, timestamp: Date.now() });
      if (newLogs.length > 10) newLogs.shift();

      transaction.update(roomRef, {
        logs: newLogs,
        deck,
        discardPile,
        penaltyStack: 0,
        currentTurnSeat: nextTurnSeat,
        updatedAt: serverTimestamp(),
        turnId: (roomData.turnId || 0) + 1
      });

      updates.forEach((updateData, playerUid) => {
        transaction.update(doc(firestore, 'rooms', roomId, 'players', playerUid), updateData);
      });
    });
  },

  declareOneCardOnline: async (roomId: string, uid: string) => {
    if (!firestore) return;
    await runTransaction(firestore, async (transaction) => {
      const roomRef = doc(firestore, 'rooms', roomId);
      const roomDoc = await transaction.get(roomRef);
      if (!roomDoc.exists()) throw new Error("방을 찾을 수 없습니다.");
      const roomData = roomDoc.data();

      const myRef = doc(firestore, 'rooms', roomId, 'players', uid);
      const myDoc = await transaction.get(myRef);
      if (!myDoc.exists()) throw new Error("플레이어 정보가 없습니다.");
      const myData = myDoc.data();

      if (myData.handCount !== 1) {
        throw new Error("카드가 1장일 때만 원카드를 선언할 수 있습니다.");
      }

      const newLogs = [...(roomData.logs || [])];
      newLogs.push({ message: `${myData.name}님이 원카드를 선언했습니다!`, timestamp: Date.now() });
      if (newLogs.length > 10) newLogs.shift();

      transaction.update(roomRef, {
        logs: newLogs
      });

      transaction.update(myRef, {
        saidOneCard: true
      });
    });
  }
};
