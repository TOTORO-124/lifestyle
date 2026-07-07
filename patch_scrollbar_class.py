import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('scrollbar-hide', 'no-scrollbar')

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
