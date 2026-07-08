import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Import OneCard
target_import = "import { SuikaGame } from './components/SuikaGame';"
replace_import = "import { SuikaGame } from './components/SuikaGame';\nimport OneCard from './components/OneCard';"
if "import OneCard" not in content:
    content = content.replace(target_import, replace_import)

# Render OneCard component in the main area
target_render = "            ) : session.gameType === GameType.SUIKA ? ("
replace_render = """            ) : session.gameType === GameType.ONECARD ? (
              <div className="w-full h-full min-h-[500px]">
                <OneCard session={session} currentUser={currentUser} />
              </div>
            ) : session.gameType === GameType.SUIKA ? ("""

if "session.gameType === GameType.ONECARD ?" not in content:
    content = content.replace(target_render, replace_render)


with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
