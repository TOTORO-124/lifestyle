import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """                        <button 
                          onClick={() => setShowLocalOneCard(true)} 
                          className="office-btn-primary py-2 lg:py-4 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 hover:scale-[1.02] transition-transform group bg-gradient-to-br from-[#E63946] to-[#9B2226]"
                        >
                          <span className="font-bold text-[10px] lg:text-sm group-hover:scale-110 transition-transform">원카드 (로컬)</span>
                          <span className="text-[7px] lg:text-[9px] font-normal opacity-80 hidden sm:block">오프라인 프로토타입</span>
                        </button>"""

if target in content:
    content = content.replace(target, "")

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
