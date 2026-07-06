import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """    const drawnCard = (fromPlayer.hand || [])[cardIndex];
    let newHandFrom = [...(fromPlayer.hand || [])];"""

replacement = """    const drawnCard = (fromPlayer.hand || [])[cardIndex];
    if (!drawnCard) return;
    let newHandFrom = [...(fromPlayer.hand || [])];"""

if target in content:
    content = content.replace(target, replacement)
    print("Replaced!")
else:
    print("Not found!")

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
