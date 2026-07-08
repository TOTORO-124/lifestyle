import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("  const [showLocalOneCard, setShowLocalOneCard] = useState(false);\n", "")

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
