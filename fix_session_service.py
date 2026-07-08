import re

with open('src/services/sessionService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("type: 'ACTION'", "type: 'info'")
content = content.replace("type: 'SYSTEM'", "type: 'info'")
content = content.replace("type: \"ACTION\"", "type: 'info'")
content = content.replace("type: \"SYSTEM\"", "type: 'info'")

with open('src/services/sessionService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
