import re

with open('src/services/sessionService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace `\n    });` with `\n    };` where it follows `timestamp: Date.now()`
content = re.sub(r'timestamp: Date\.now\(\)\s*\}\);', r'timestamp: Date.now()\n    };', content)

# But there are also one-liners:
# newLogs[`...`] = { message: '...', type: 'SYSTEM', timestamp: Date.now() });
content = re.sub(r'timestamp: Date\.now\(\)\s*\}\);', r'timestamp: Date.now() };', content)

with open('src/services/sessionService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
