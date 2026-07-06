import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update container sizes
content = content.replace("min-h-[600px]", "min-h-[400px] md:min-h-[600px]")

# Update card sizes
content = content.replace("w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36", "w-12 h-16 sm:w-16 sm:h-24 md:w-20 md:h-28")

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

