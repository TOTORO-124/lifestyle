import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = "  const [showDisclaimer, setShowDisclaimer] = useState(() => {"
replace = "  const [showFirestoreOneCard, setShowFirestoreOneCard] = useState(false);\n  const [firestoreOneCardRoomId, setFirestoreOneCardRoomId] = useState<string | null>(null);\n  const [showDisclaimer, setShowDisclaimer] = useState(() => {"

if "showFirestoreOneCard" not in content[:3000]:
    content = content.replace(target, replace)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
