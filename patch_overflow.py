import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('max-w-full overflow-hidden items-center', 'max-w-full items-center')

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
