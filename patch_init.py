import re

with open('src/services/sessionService.ts', 'r', encoding='utf-8') as f:
    content = f.read()

target = """    const game: any = { // Use any temporarily to avoid import issues in this script if OldMaidGameState isn't perfectly matched
      status: 'PLAYING',
      startTime: Date.now(),
      players: playersState,
      turnOrder,
      currentTurnIndex: 0,
      turnStartTime: Date.now(),
      message: '게임이 시작되었습니다! 카드를 뽑아주세요.'
    };"""

replacement = """    let initialTurnIndex = 0;
    while (initialTurnIndex < 4 && !playersState[turnOrder[initialTurnIndex]]?.isActive) {
      initialTurnIndex++;
    }

    const game: any = { // Use any temporarily to avoid import issues in this script if OldMaidGameState isn't perfectly matched
      status: 'PLAYING',
      startTime: Date.now(),
      players: playersState,
      turnOrder,
      currentTurnIndex: initialTurnIndex,
      turnStartTime: Date.now(),
      message: '게임이 시작되었습니다! 카드를 뽑아주세요.'
    };"""

content = content.replace(target, replacement)

with open('src/services/sessionService.ts', 'w', encoding='utf-8') as f:
    f.write(content)
