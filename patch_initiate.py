import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """  const initiateDraw = async (targetId: string, cardIndex: number) => {
    if (status !== 'PLAYING' || drawingState) return;
    if (turnOrder[currentTurnIndex] !== currentUser.uid && !turnOrder[currentTurnIndex].startsWith('CPU_')) return;"""

replacement = """  const initiateDraw = async (targetId: string, cardIndex: number) => {
    if (status !== 'PLAYING' || drawingState) return;
    const currentPid = turnOrder[currentTurnIndex];
    if (currentPid !== currentUser.uid && !currentPid.startsWith('CPU_')) return;
    if (!players[currentPid]?.isActive) return;"""

content = content.replace(target, replacement)

target2 = """    const fromPid = targetId;
    const toPid = turnOrder[currentTurnIndex];

    const fromPlayer = players[fromPid];
    const toPlayer = players[toPid];"""

replacement2 = """    const fromPid = targetId;
    const toPid = turnOrder[currentTurnIndex];

    const fromPlayer = players[fromPid];
    const toPlayer = players[toPid];
    
    if (!fromPlayer?.isActive || !toPlayer?.isActive) return;"""

content = content.replace(target2, replacement2)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

