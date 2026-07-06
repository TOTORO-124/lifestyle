import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("<Card value={card.value} />", "<Card value={card.value} suit={card.suit} />")
content = content.replace("<Card \n                  value={c.value}", "<Card \n                  value={c.value}\n                  suit={c.suit}")

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
