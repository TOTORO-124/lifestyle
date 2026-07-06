import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("Math.max(0, 1000 - elapsed)", "Math.max(0, 400 - elapsed)")
content = content.replace('transition={{ duration: 1.0, ease: "linear" }}', 'transition={{ duration: 0.4, ease: "linear" }}')
content = content.replace("}, 1000);", "}, 400);")

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
