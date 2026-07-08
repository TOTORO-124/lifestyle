import re

with open('src/components/OneCardOnline.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

if 'const [isProcessing, setIsProcessing] = useState(false);' not in content:
    content = content.replace("const [players, setPlayers] = useState<any[]>([]);", "const [players, setPlayers] = useState<any[]>([]);\n  const [isProcessing, setIsProcessing] = useState(false);")

    # update playCard
    target_play = """  const playCard = async (cardIndex: number, chosenSuit?: string) => {
    if (!isMyTurn) return;"""
    replace_play = """  const playCard = async (cardIndex: number, chosenSuit?: string) => {
    if (!isMyTurn || isProcessing) return;"""
    content = content.replace(target_play, replace_play)

    target_play_try = """    try {
      await oneCardOnlineService.playCardOnline(roomId, uid, card.id, playerUids, chosenSuit);
    } catch (e: any) {
      alert(e.message);
    }"""
    replace_play_try = """    try {
      setIsProcessing(true);
      await oneCardOnlineService.playCardOnline(roomId, uid, card.id, playerUids, chosenSuit);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }"""
    content = content.replace(target_play_try, replace_play_try)

    # update drawCard
    target_draw = """  const drawCard = async () => {
    if (!isMyTurn) return;
    const playerUids = players.map(p => p.uid);
    try {
      await oneCardOnlineService.drawCardOnline(roomId, uid, playerUids);
    } catch (e: any) {
      alert(e.message);
    }
  };"""
    replace_draw = """  const drawCard = async () => {
    if (!isMyTurn || isProcessing) return;
    const playerUids = players.map(p => p.uid);
    try {
      setIsProcessing(true);
      await oneCardOnlineService.drawCardOnline(roomId, uid, playerUids);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsProcessing(false);
    }
  };"""
    content = content.replace(target_draw, replace_draw)
    
    with open('src/components/OneCardOnline.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
