import re

with open('src/types.ts', 'r', encoding='utf-8') as f:
    content = f.read()

target = "  isAI?: boolean;"
replace = "  isAI?: boolean;\n  isBot?: boolean;"

if target in content:
    content = content.replace(target, replace)

with open('src/types.ts', 'w', encoding='utf-8') as f:
    f.write(content)
