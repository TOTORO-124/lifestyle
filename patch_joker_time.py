import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """      const timer = setTimeout(() => setShowEffect(null), 1500);"""
replace = """      const duration = effect && effect.startsWith('JOKER_') ? 800 : 1500;
      const timer = setTimeout(() => setShowEffect(null), duration);"""

content = content.replace(target, replace)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
