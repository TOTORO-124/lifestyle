import re

with open('src/services/oneCardOnlineService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Add log to playCardOnline
if "const newLogs =" not in content:
    play_target = "transaction.update(roomRef, {"
    
    play_replacement = """const newLogs = [...(roomData.logs || [])];
      let msg = `${myData.name}님이 ${card.rank === 'color' || card.rank === 'black' ? '조커' : card.suit + ' ' + card.rank} 카드를 냈습니다.`;
      if (selectedSuit) msg += ` (무늬: ${selectedSuit})`;
      newLogs.push({ message: msg, timestamp: Date.now() });
      if (newLogs.length > 10) newLogs.shift();

      transaction.update(roomRef, {
        logs: newLogs,"""
    content = content.replace("transaction.update(roomRef, {", play_replacement, 1)

    draw_target = "transaction.update(roomRef, {"
    draw_replacement = """const newLogs = [...(roomData.logs || [])];
      newLogs.push({ message: `${myData.name}님이 카드를 ${drawCount}장 뽑았습니다.`, timestamp: Date.now() });
      if (newLogs.length > 10) newLogs.shift();

      transaction.update(roomRef, {
        logs: newLogs,"""
    # Find the second transaction.update for roomRef
    parts = content.split("transaction.update(roomRef, {")
    if len(parts) >= 3:
        content = parts[0] + "transaction.update(roomRef, {" + parts[1] + draw_replacement + parts[2]
        
with open('src/services/oneCardOnlineService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
