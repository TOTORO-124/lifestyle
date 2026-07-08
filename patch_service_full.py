import re

with open('src/services/oneCardOnlineService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

target_apply_def = "const applyOneCardPenaltyIfNeeded = (uid: string, playerDocs: any[], updates: Map<string, any>, deck: any[], discardPile: any[]) => {"
replace_apply_def = "const applyOneCardPenaltyIfNeeded = (uid: string, playerDocs: any[], updates: Map<string, any>, deck: any[], discardPile: any[], newLogs: any[]) => {"
content = content.replace(target_apply_def, replace_apply_def)

target_apply_log = """      updates.set(pData.uid, {
        ...currentUpdates,
        hand: newHand,
        handCount: newHand.length,
        saidOneCard: false
      });
    }"""
replace_apply_log = """      updates.set(pData.uid, {
        ...currentUpdates,
        hand: newHand,
        handCount: newHand.length,
        saidOneCard: false
      });
      newLogs.push({ message: `${pData.name}님이 원카드를 선언하지 않아 카드 2장을 받았습니다.`, timestamp: Date.now() });
    }"""
content = content.replace(target_apply_log, replace_apply_log)

# Fix playCardOnline
target_play_call = """      const updates = new Map<string, any>();
      
      applyOneCardPenaltyIfNeeded(uid, playerDocs, updates, deck, discardPile);"""
replace_play_call = """      const updates = new Map<string, any>();
      const newLogs = [...(roomData.logs || [])];
      
      applyOneCardPenaltyIfNeeded(uid, playerDocs, updates, deck, discardPile, newLogs);"""
content = content.replace(target_play_call, replace_play_call)

target_play_log = """      const newLogs = [...(roomData.logs || [])];
      let msg = `${myData.name}님이 ${card.rank === 'color' || card.rank === 'black' ? '조커' : card.suit + ' ' + card.rank} 카드를 냈습니다.`;
      if (selectedSuit) msg += ` (무늬: ${selectedSuit})`;
      newLogs.push({ message: msg, timestamp: Date.now() });
      if (newLogs.length > 10) newLogs.shift();"""
replace_play_log = """      let msg = `${myData.name}님이 ${card.rank === 'color' || card.rank === 'black' ? '조커' : card.suit + ' ' + card.rank} 카드를 냈습니다.`;
      if (selectedSuit) msg += ` (무늬: ${selectedSuit})`;
      newLogs.push({ message: msg, timestamp: Date.now() });
      if (newLogs.length > 10) newLogs.shift();"""
content = content.replace(target_play_log, replace_play_log)

# Fix drawCardOnline
target_draw_call = """      const updates = new Map<string, any>();

      applyOneCardPenaltyIfNeeded(uid, playerDocs, updates, deck, discardPile);"""
replace_draw_call = """      const updates = new Map<string, any>();
      const newLogs = [...(roomData.logs || [])];

      applyOneCardPenaltyIfNeeded(uid, playerDocs, updates, deck, discardPile, newLogs);"""
content = content.replace(target_draw_call, replace_draw_call)

target_draw_log = """      const newLogs = [...(roomData.logs || [])];
      newLogs.push({ message: `${myData.name}님이 카드를 ${drawCount}장 뽑았습니다.`, timestamp: Date.now() });
      if (newLogs.length > 10) newLogs.shift();"""
replace_draw_log = """      newLogs.push({ message: `${myData.name}님이 카드를 ${drawCount}장 뽑았습니다.`, timestamp: Date.now() });
      if (newLogs.length > 10) newLogs.shift();"""
content = content.replace(target_draw_log, replace_draw_log)

# Fix declareOneCardOnline
target_declare = """  declareOneCardOnline: async (roomId: string, uid: string) => {
    if (!firestore) return;
    await runTransaction(firestore, async (transaction) => {
      const myRef = doc(firestore, 'rooms', roomId, 'players', uid);
      const myDoc = await transaction.get(myRef);
      if (!myDoc.exists()) throw new Error("플레이어 정보가 없습니다.");
      const myData = myDoc.data();

      if (myData.handCount > 2) {
        throw new Error("카드가 2장 이하일 때만 원카드를 선언할 수 있습니다.");
      }

      transaction.update(myRef, {
        saidOneCard: true
      });
    });
  }"""
replace_declare = """  declareOneCardOnline: async (roomId: string, uid: string) => {
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
  }"""
content = content.replace(target_declare, replace_declare)


with open('src/services/oneCardOnlineService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
