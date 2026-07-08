import re

with open('src/types.ts', 'r', encoding='utf-8') as f:
    content = f.read()

if 'uid?: string;' not in content:
    content = content.replace("  id: string;", "  id: string;\n  uid?: string;")
    with open('src/types.ts', 'w', encoding='utf-8') as f:
        f.write(content)
