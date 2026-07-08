import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_btn = """                        <button 
                          onClick={() => setShowFirestoreOneCard(true)} 
                          className="office-btn-primary py-2 lg:py-4 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 hover:scale-[1.02] transition-transform group bg-gradient-to-br from-[#E63946] to-[#9B2226]"
                          disabled={loading}
                        >
                          <span className="font-bold text-[10px] lg:text-sm group-hover:scale-110 transition-transform">원카드</span>
                          <span className="text-[7px] lg:text-[9px] font-normal opacity-80 hidden sm:block">멀티플레이</span>
                        </button>"""

replace_btn = """                        <button 
                          onClick={() => setShowFirestoreOneCard(true)} 
                          className="office-btn-primary py-2 lg:py-4 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 hover:scale-[1.02] transition-transform group bg-gradient-to-br from-[#4F46E5] to-[#312E81]"
                          disabled={loading}
                        >
                          <span className="font-bold text-[10px] lg:text-sm group-hover:scale-110 transition-transform">원카드 (온라인)</span>
                          <span className="text-[7px] lg:text-[9px] font-normal opacity-80 hidden sm:block">Firestore 베타</span>
                        </button>
                        <button 
                          onClick={() => handleCreateSession(GameType.ONECARD)} 
                          className="office-btn-primary py-2 lg:py-4 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-1 hover:scale-[1.02] transition-transform group bg-gradient-to-br from-[#E63946] to-[#9B2226]"
                          disabled={loading}
                        >
                          <span className="font-bold text-[10px] lg:text-sm group-hover:scale-110 transition-transform">원카드 (로컬)</span>
                          <span className="text-[7px] lg:text-[9px] font-normal opacity-80 hidden sm:block">기존 RTDB 버전</span>
                        </button>"""

if target_btn in content:
    content = content.replace(target_btn, replace_btn)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
