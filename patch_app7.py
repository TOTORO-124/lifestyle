import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """  if (showFirestoreOneCard) {
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
    }"""

replace = """  if (showFirestoreOneCard) {
    if (firestoreOneCardRoomId) {
      return (
        <div className="h-[100dvh] bg-slate-900 flex flex-col items-center justify-center font-sans text-white">
           <div className="text-6xl mb-6 animate-bounce">🃏</div>
           <h2 className="text-3xl font-black text-indigo-400 mb-4">게임 플레이 화면 (Firestore)</h2>
           <p className="text-slate-400 mb-8 max-w-md text-center">
             현재 방 시스템(생성/입장/대기실)이 Firestore로 성공적으로 연동되었습니다.<br/><br/>
             실제 카드 게임 동기화 로직은 추후 업데이트될 예정입니다.
           </p>
           <button 
             onClick={() => { setShowFirestoreOneCard(false); setFirestoreOneCardRoomId(null); }}
             className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-full font-bold"
           >
             로비로 돌아가기
           </button>
        </div>
      );
    }"""

if target in content:
    content = content.replace(target, replace)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
