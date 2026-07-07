import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("flex flex-wrap justify-center -space-x-[1rem]", "flex flex-nowrap justify-center -space-x-[1rem]")
content = content.replace("'flex-wrap justify-center -space-x-[1.2rem]", "'flex-nowrap justify-center -space-x-[1.2rem]")

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
