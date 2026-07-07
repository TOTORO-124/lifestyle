import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('{drawingState && (\n          <motion.div initial', '{drawingState && (\n          <motion.div key="drawing" initial')
content = content.replace('{showJokerScreen && (\n          <motion.div initial', '{showJokerScreen && (\n          <motion.div key="joker" initial')
content = content.replace("{showEffect === 'PAIR' && (\n          <motion.div initial", "{showEffect === 'PAIR' && (\n          <motion.div key=\"pair\" initial")
content = content.replace("{showEffect === 'ESCAPE' && (\n          <motion.div initial", "{showEffect === 'ESCAPE' && (\n          <motion.div key=\"escape\" initial")

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
