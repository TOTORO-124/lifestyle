import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target1 = "animate-pulse scale-105 border-yellow-400 border-2"
replacement1 = "scale-105 border-yellow-400 border-2 shadow-[0_0_15px_rgba(250,204,21,0.3)]"

target2 = "text-red-400 animate-bounce"
replacement2 = "text-red-400 font-black scale-110 transition-transform"

content = content.replace(target1, replacement1)
content = content.replace(target2, replacement2)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
