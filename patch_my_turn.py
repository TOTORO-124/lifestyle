import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = "const isMyTurn = status === 'PLAYING' && turnOrder[currentTurnIndex] === currentUser.uid;"
replacement = "const isMyTurn = status === 'PLAYING' && turnOrder[currentTurnIndex] === currentUser.uid && players[currentUser.uid]?.isActive;"

content = content.replace(target, replacement)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

