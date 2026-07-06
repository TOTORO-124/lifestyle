import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('key={card.id}', 'key={`${card.id}-${i}`}')
content = content.replace('key={c.id}', 'key={`${c.id}-${i}`}')

# We need to make sure `i` is defined in the first map
target_map = "{(pState.hand || []).map(card => ("
replacement_map = "{(pState.hand || []).map((card, i) => ("
content = content.replace(target_map, replacement_map)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
