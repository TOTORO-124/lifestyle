const fs = require('fs');
const content = fs.readFileSync('src/services/sessionService.ts', 'utf8');

const regex = /async startOldMaidGame[\s\S]*?async endOldMaidGame\s*\([^)]*\)\s*\{[\s\S]*?\n  \},/m;

const replacement = `  // --- Old Maid (조커 도둑잡기) ---
  async startOldMaidGame(sessionId: string) {
    if (!db) return;
    const sessionSnap = await get(ref(db, \`sessions/\${sessionId}\`));
    const session = sessionSnap.val() as Session;
    if (!session || !session.players) return;

    const realPlayers = Object.keys(session.players);
    const turnOrder = [...realPlayers];
    
    // Pad with CPUs up to 4 players if needed
    let cpuCount = 1;
    while (turnOrder.length < 4) {
      const cpuId = \`CPU_\${cpuCount}\`;
      turnOrder.push(cpuId);
      session.players[cpuId] = { uid: cpuId, nickname: \`컴퓨터 \${cpuCount}\`, avatarIndex: 0, joinedAt: Date.now(), isReady: true };
      cpuCount++;
    }

    // Shuffle turn order
    for (let i = turnOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [turnOrder[i], turnOrder[j]] = [turnOrder[j], turnOrder[i]];
    }

    const VALUES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    let deck: {id: string, value: string}[] = [];
    VALUES.forEach(val => {
      deck.push({ id: \`A_\${val}\`, value: val });
      deck.push({ id: \`B_\${val}\`, value: val });
    });
    deck.push({ id: 'JOKER_1', value: 'JOKER' });

    // Shuffle deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    const playersState: Record<string, {hand: any[], isActive: boolean}> = {};
    turnOrder.forEach(pid => {
      playersState[pid] = { hand: [], isActive: true };
    });

    // Deal
    deck.forEach((card, index) => {
      playersState[turnOrder[index % turnOrder.length]].hand.push(card);
    });

    // Remove initial pairs
    turnOrder.forEach(pid => {
      const hand = playersState[pid].hand;
      const counts = new Map<string, any[]>();
      hand.forEach(c => {
        if (c.value === 'JOKER') return;
        if (!counts.has(c.value)) counts.set(c.value, []);
        counts.get(c.value)!.push(c);
      });

      const toRemove = new Set<string>();
      counts.forEach(cards => {
        const pairsCount = Math.floor(cards.length / 2);
        for (let i = 0; i < pairsCount * 2; i++) {
          toRemove.add(cards[i].id);
        }
      });

      playersState[pid].hand = hand.filter(c => !toRemove.has(c.id));
      if (playersState[pid].hand.length === 0) {
        playersState[pid].isActive = false;
      }
    });

    const game: any = { // Use any temporarily to avoid import issues in this script if OldMaidGameState isn't perfectly matched
      status: 'PLAYING',
      startTime: Date.now(),
      players: playersState,
      turnOrder,
      currentTurnIndex: 0,
      message: '게임이 시작되었습니다! 카드를 뽑아주세요.'
    };

    await update(ref(db, \`sessions/\${sessionId}\`), {
      oldMaidGame: game,
      status: SessionStatus.PLAYING,
      players: session.players // Update players to include CPUs if added
    });
    await this.addLog(sessionId, \`조커 도둑잡기 게임이 시작되었습니다.\`, 'success');
  },

  async updateOldMaidGame(sessionId: string, updates: any) {
    if (!db) return;
    await update(ref(db, \`sessions/\${sessionId}/oldMaidGame\`), updates);
  },

  async endOldMaidGame(sessionId: string, loserId: string) {
    if (!db) return;
    await update(ref(db, \`sessions/\${sessionId}/oldMaidGame\`), {
      status: 'FINISHED',
      loserId: loserId
    });
  },`;

const newContent = content.replace(regex, replacement);
fs.writeFileSync('src/services/sessionService.ts', newContent);
