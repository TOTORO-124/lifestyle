import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
target_import = "import OneCard from './components/OneCard';"
replace_import = "import OneCard from './components/OneCard';\nimport OneCardLobby from './components/OneCardLobby';"
if "import OneCardLobby" not in content:
    content = content.replace(target_import, replace_import)

# Add state
target_state = "const [showSettings, setShowSettings] = useState(false);"
replace_state = "const [showSettings, setShowSettings] = useState(false);\n  const [showFirestoreOneCard, setShowFirestoreOneCard] = useState(false);\n  const [firestoreOneCardRoomId, setFirestoreOneCardRoomId] = useState<string | null>(null);"
if "showFirestoreOneCard" not in content:
    content = content.replace(target_state, replace_state)

# Replace button click
target_btn_click = "onClick={() => handleCreateSession(GameType.ONECARD)}"
replace_btn_click = "onClick={() => setShowFirestoreOneCard(true)}"
content = content.replace(target_btn_click, replace_btn_click)

# Render OneCardLobby at the top level
target_top = "  if (loading) {"
replace_top = """  if (showFirestoreOneCard) {
    if (firestoreOneCardRoomId) {
      // Game started
      return (
        <div className="h-[100dvh] overflow-hidden flex flex-col font-sans relative">
           <OneCard 
             session={{
                id: firestoreOneCardRoomId,
                status: SessionStatus.PLAYING,
                hostId: '',
                gameType: GameType.ONECARD,
                round: 1,
                createdAt: Date.now(),
                players: {},
                settings: { maxPlayers: 4 },
                oneCardGame: { status: 'PLAYING', turnOrder: [], currentTurnIndex: 0, direction: 1, deck: [], discardPile: [], players: {}, penaltyStack: 0 } // Mock to satisfy TS, real logic should use Firestore
             } as any} 
             currentUser={currentUser} 
             onLeave={() => { setShowFirestoreOneCard(false); setFirestoreOneCardRoomId(null); }}
           />
        </div>
      );
    }
    return <OneCardLobby 
             onBack={() => setShowFirestoreOneCard(false)} 
             onGameStart={(roomId) => setFirestoreOneCardRoomId(roomId)} 
           />;
  }

  if (loading) {"""
if "if (showFirestoreOneCard) {" not in content:
    content = content.replace(target_top, replace_top)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
