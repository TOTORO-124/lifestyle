import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """  if (showLocalOneCard) {
    return (
      <div className="h-[100dvh] overflow-hidden flex flex-col font-sans relative">
         <button onClick={() => setShowLocalOneCard(false)} className="absolute top-4 left-4 z-50 bg-white/20 hover:bg-white/40 backdrop-blur-md px-4 py-2 rounded-full font-bold text-white transition-colors border border-white/30 shadow-lg">
           ← 로비로 돌아가기
         </button>
         <OneCard />
      </div>
    );
  }"""

if target in content:
    content = content.replace(target, "")

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
