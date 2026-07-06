import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target1 = """  const getNextActivePlayerIndex = (startIndex: number) => {
    let index = (startIndex + 1) % 4;
    while (index !== startIndex) {
      if (players[turnOrder[index]]?.isActive) return index;
      index = (index + 1) % 4;
    }
    return -1;
  };

  const nextActiveIndex = getNextActivePlayerIndex(currentTurnIndex);"""

replacement1 = """  const getNextActivePlayerIndex = (startIndex: number, playersState: any = players) => {
    let index = (startIndex + 1) % 4;
    while (index !== startIndex) {
      if (playersState[turnOrder[index]]?.isActive) return index;
      index = (index + 1) % 4;
    }
    return -1;
  };

  const nextActiveIndex = getNextActivePlayerIndex(currentTurnIndex);"""

content = content.replace(target1, replacement1)

target2 = "const nextTurn = getNextActivePlayerIndex(currentTurnIndex);"
replacement2 = "const nextTurn = getNextActivePlayerIndex(currentTurnIndex, newPlayers);"

content = content.replace(target2, replacement2)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

