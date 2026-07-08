with open('src/services/sessionService.ts', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "+ i" in line and "isBot:" in lines[i-1]:
        print(f"Fixing line {i}: {line}")
        lines[i] = ""

with open('src/services/sessionService.ts', 'w', encoding='utf-8') as f:
    f.writelines(lines)
