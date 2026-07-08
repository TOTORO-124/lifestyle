import re

with open('src/components/OneCardOnline.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = "import { doc, collection, onSnapshot, writeBatch, serverTimestamp, increment } from 'firebase/firestore';"
replace = "import { doc, collection, onSnapshot, writeBatch, serverTimestamp, increment, updateDoc } from 'firebase/firestore';"

if target in content:
    content = content.replace(target, replace)

with open('src/components/OneCardOnline.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
