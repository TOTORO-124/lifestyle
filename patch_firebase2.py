import re

with open('src/firebase.ts', 'r', encoding='utf-8') as f:
    content = f.read()

target = "export const firestore = app ? getFirestore(app) : null;"
replace = "export const firestore = app ? getFirestore(app, (import.meta as any).env.VITE_FIREBASE_DATABASE_ID || undefined) : null;"

if target in content:
    content = content.replace(target, replace)

with open('src/firebase.ts', 'w', encoding='utf-8') as f:
    f.write(content)
