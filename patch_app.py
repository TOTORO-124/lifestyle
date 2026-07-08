import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add ONECARD component import
target_import = "import Alkkagi from './components/Alkkagi';"
replace_import = "import Alkkagi from './components/Alkkagi';\nimport OneCard from './components/OneCard';"
if replace_import not in content:
    content = content.replace(target_import, replace_import)

# handleCreateSession
target_create = "else if (gameType === GameType.SUIKA) {"
replace_create = "else if (gameType === GameType.SUIKA) {\n      sessionService.createSession(newSessionId, GameType.SUIKA, currentUser.uid, currentUser.displayName || '이름 없음');\n    } else if (gameType === GameType.ONECARD) {\n      sessionService.createSession(newSessionId, GameType.ONECARD, currentUser.uid, currentUser.displayName || '이름 없음');\n    }"
if replace_create not in content:
    content = content.replace(target_create, target_create.replace("else if (gameType === GameType.SUIKA) {", replace_create.split("\n    } else if (gameType === GameType.ONECARD) {")[0] + "\n    } else if (gameType === GameType.ONECARD) {\n      sessionService.createSession(newSessionId, GameType.ONECARD, currentUser.uid, currentUser.displayName || '이름 없음');\n    }"))

# handleStartGame
target_start = "else if (session.gameType === GameType.SUIKA) {\n        await sessionService.startSuikaGame(session.id);\n      }"
replace_start = "else if (session.gameType === GameType.SUIKA) {\n        await sessionService.startSuikaGame(session.id);\n      } else if (session.gameType === GameType.ONECARD) {\n        await sessionService.startOneCardGame(session.id);\n      }"
if replace_start not in content:
    content = content.replace(target_start, replace_start)

# LOBBY UI card
target_ui = """                        <div 
                          className="bg-black/40 hover:bg-black/60 p-4 rounded-xl border border-gray-600 cursor-pointer transition-all hover:scale-105 hover:border-pink-500 hover:shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                          onClick={() => handleCreateSession(GameType.SUIKA)} 
                        >
                          <div className="text-3xl mb-2">🍉</div>
                          <h4 className="font-bold text-white mb-1 text-sm sm:text-base">수박 게임</h4>
                          <p className="text-xs text-gray-400">같은 과일을 합쳐서 가장 큰 수박을 만드세요! (솔로 플레이)</p>
                        </div>"""

replace_ui = target_ui + """
                        <div 
                          className="bg-black/40 hover:bg-black/60 p-4 rounded-xl border border-gray-600 cursor-pointer transition-all hover:scale-105 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                          onClick={() => handleCreateSession(GameType.ONECARD)} 
                        >
                          <div className="text-3xl mb-2">🃏</div>
                          <h4 className="font-bold text-white mb-1 text-sm sm:text-base">원카드</h4>
                          <p className="text-xs text-gray-400">손에 있는 카드를 가장 먼저 없애는 사람이 승리!</p>
                        </div>"""
if "onClick={() => handleCreateSession(GameType.ONECARD)}" not in content:
    content = content.replace(target_ui, replace_ui)

# Main game switch
target_switch = """      {session.gameType === GameType.SUIKA && (
        <Suika />
      )}"""
replace_switch = target_switch + """
      {session.gameType === GameType.ONECARD && (
        <OneCard />
      )}"""
if "<OneCard />" not in content and "OneCard" in replace_switch:
    content = content.replace(target_switch, replace_switch)


with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

