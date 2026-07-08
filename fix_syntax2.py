import re

with open('src/services/sessionService.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i in range(len(lines)):
    if 'timestamp: Date.now()' in lines[i]:
        if '}' in lines[i]:
            lines[i] = lines[i].replace('}', '})')
        elif i+1 < len(lines) and '};' in lines[i+1] and 'newLogs[' not in lines[i-3] and 'newLogs[' not in lines[i-2] and 'newLogs[' not in lines[i-4]:
            # This is a bit brittle, so let's just do it manually for lines 161 and 648
            pass

lines[160] = lines[160].replace('};', '});')
lines[647] = lines[647].replace('};', '});')

with open('src/services/sessionService.ts', 'w', encoding='utf-8') as f:
    f.writelines(lines)
