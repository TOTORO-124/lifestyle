import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = "w-full max-w-4xl mx-auto aspect-[3/4] sm:aspect-square lg:aspect-[4/3] max-h-[85vh] flex flex-col bg-[#1A4D2E]"
replace = "w-full max-w-4xl mx-auto aspect-square lg:aspect-[4/3] max-h-[85vh] flex flex-col bg-[#1A4D2E]"
content = content.replace(target, replace)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
