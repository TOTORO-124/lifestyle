import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = "w-full max-w-5xl mx-auto aspect-[3/4] md:aspect-square lg:aspect-[4/3] max-h-full flex flex-col bg-[#1A4D2E]"
replace = "w-full max-w-4xl mx-auto aspect-[3/4] sm:aspect-square lg:aspect-[4/3] flex flex-col bg-[#1A4D2E]"
content = content.replace(target, replace)

# Make sure "카드 섞기" button stands out more
target_btn = 'className="ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg transition-transform active:scale-95"'
replace_btn = 'className="ml-4 px-4 py-2 bg-blue-500 hover:bg-blue-400 border border-blue-300 rounded-full text-sm font-black flex items-center gap-2 shadow-xl transition-all active:scale-95 text-white"'
content = content.replace(target_btn, replace_btn)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
