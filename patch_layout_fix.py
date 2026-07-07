import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = "w-full max-w-5xl mx-auto h-[85vh] md:h-[80vh] min-h-[450px] md:min-h-[600px] max-h-[800px] flex flex-col"
replacement = "w-full max-w-5xl mx-auto min-h-[600px] flex flex-col"
content = content.replace(target, replacement)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
