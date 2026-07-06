import re

with open('src/services/sessionService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

target = """    await update(ref(db, `sessions/${sessionId}`), {
      oldMaidGame: game,
      status: SessionStatus.PLAYING
    });"""

replacement = """    await update(ref(db, `sessions/${sessionId}`), {
      oldMaidGame: game,
      status: SessionStatus.PLAYING,
      players: session.players
    });"""

if target in content:
    content = content.replace(target, replacement)
    print("Replaced!")
else:
    print("Not found!")

with open('src/services/sessionService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
