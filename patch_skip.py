import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """      if (isCpuTurn && imResponsible && players[currentPid]?.isActive) {
        const nextActiveIdx = getNextActivePlayerIndex(currentTurnIndex);
        if (nextActiveIdx !== -1) {
          const targetPlayerId = turnOrder[nextActiveIdx];
          const delay = setTimeout(() => {
            if (players[targetPlayerId] && (players[targetPlayerId].hand || []).length > 0) {
               const randomCardIndex = Math.floor(Math.random() * (players[targetPlayerId].hand || []).length);
               handleDrawCard(targetPlayerId, randomCardIndex);
            }
          }, 1000);
          return () => clearTimeout(delay);
        }
      }"""

replacement = """      if (imResponsible && !players[currentPid]?.isActive) {
        // Auto-skip inactive players
        const nextActiveIdx = getNextActivePlayerIndex(currentTurnIndex);
        if (nextActiveIdx !== -1) {
          sessionService.updateOldMaidGame(session.id, { currentTurnIndex: nextActiveIdx });
        }
      } else if (isCpuTurn && imResponsible && players[currentPid]?.isActive) {
        const nextActiveIdx = getNextActivePlayerIndex(currentTurnIndex);
        if (nextActiveIdx !== -1) {
          const targetPlayerId = turnOrder[nextActiveIdx];
          const delay = setTimeout(() => {
            if (players[targetPlayerId] && (players[targetPlayerId].hand || []).length > 0) {
               const randomCardIndex = Math.floor(Math.random() * (players[targetPlayerId].hand || []).length);
               handleDrawCard(targetPlayerId, randomCardIndex);
            }
          }, 1000);
          return () => clearTimeout(delay);
        }
      }"""

content = content.replace(target, replacement)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

