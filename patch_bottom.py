import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_bottom = '<div className="mt-auto flex flex-col items-center pt-8 border-t border-green-700/50 w-full z-10 relative">'
replacement_bottom = '<div className="flex flex-col items-center pt-2 md:pt-4 pb-2 md:pb-4 border-t-2 border-green-700/50 w-full z-10 relative bg-black/20 backdrop-blur-sm">'

content = content.replace(target_bottom, replacement_bottom)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
