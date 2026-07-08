import re

with open('src/services/sessionService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace `const newLogs = session.logs || [];` with `const newLogs = session.logs || {};`
content = content.replace("const newLogs = session.logs || [];", "const newLogs = session.logs || {};")

# Replace `newLogs.push({` with `newLogs[\`log_${Date.now()}_${Math.random()}\`] = {`
content = content.replace("newLogs.push({", "newLogs[`log_${Date.now()}_${Math.random()}`] = {")

with open('src/services/sessionService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
