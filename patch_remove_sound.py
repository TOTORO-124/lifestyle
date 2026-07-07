import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove playSound definition
sound_def_pattern = re.compile(r"  // Play sounds\n  const playSound = \(type: 'draw' \| 'pair' \| 'joker' \| 'win'\) => \{.*?\n  \};\n", re.DOTALL)
content = sound_def_pattern.sub('', content)

# 2. Remove playSound usages
content = content.replace("if (effect.split('_')[1] === currentUser.uid) playSound('joker');", "")
content = content.replace("if (effect === 'PAIR') playSound('pair');", "")
content = content.replace("if (effect === 'ESCAPE') playSound('win');", "")

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
