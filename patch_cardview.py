import re

with open('src/components/OneCardOnline.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = "hidden?: boolean, className?: string }) => {"
replace = "hidden?: boolean, className?: string, key?: string | number }) => {"

if target in content:
    content = content.replace(target, replace)

with open('src/components/OneCardOnline.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
