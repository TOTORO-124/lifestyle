import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("Math.max(0, 2500 - elapsed)", "Math.max(0, 1000 - elapsed)")
content = content.replace("transition={{ duration: 2.5, ease: \"linear\" }}", "transition={{ duration: 1.0, ease: \"linear\" }}")
# Also change CPU turn delay from 1500 to 1000 to make it faster
content = content.replace("}, 1500);", "}, 1000);")

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

