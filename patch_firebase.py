import re

with open('src/firebase.ts', 'r', encoding='utf-8') as f:
    content = f.read()

target = "import.meta.env"
replace = "(import.meta as any).env"

if target in content:
    content = content.replace(target, replace)

with open('src/firebase.ts', 'w', encoding='utf-8') as f:
    f.write(content)
