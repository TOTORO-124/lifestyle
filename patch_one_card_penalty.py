import re

with open('src/services/oneCardOnlineService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update applyOneCardPenaltyIfNeeded definition
target_apply = "const applyOneCardPenaltyIfNeeded = (uid: string, playerDocs: any[], updates: Map<string, any>, deck: any[], discardPile: any[]) => {"
replace_apply = "const applyOneCardPenaltyIfNeeded = (uid: string, playerDocs: any[], updates: Map<string, any>, deck: any[], discardPile: any[], newLogs: any[]) => {"
content = content.replace(target_apply, replace_apply)

# 2. Add log pushing in applyOneCardPenaltyIfNeeded
target_penalty_update = """      updates.set(pData.uid, {
        ...currentUpdates,
        hand: newHand,
        handCount: newHand.length,
        saidOneCard: false
      });"""
replace_penalty_update = """      updates.set(pData.uid, {
        ...currentUpdates,
        hand: newHand,
        handCount: newHand.length,
        saidOneCard: false
      });
      newLogs.push({ message: `${pData.name}님이 원카드를 선언하지 않아 카드 2장을 받았습니다.`, timestamp: Date.now() });"""
content = content.replace(target_penalty_update, replace_penalty_update)

# 3. Update calls in playCardOnline and drawCardOnline
# We need to extract `newLogs` earlier in the transaction so we can pass it to `applyOneCardPenaltyIfNeeded`

# Let's fix playCardOnline
# Instead of doing it with simple replace, we can write a more robust replacement.
