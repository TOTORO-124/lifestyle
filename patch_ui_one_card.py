import re

with open('src/components/OneCardOnline.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update player list to show ONE CARD tag
target_p_info = """              <div className="flex gap-1">
                 <CardView hidden className="!w-6 !h-9 sm:!w-8 sm:!h-12 border-none" />
                 <span className="text-white font-bold self-center ml-1">x {p.handCount}</span>
              </div>
              {roomData.currentTurnSeat === p.seat && ("""
replace_p_info = """              <div className="flex gap-1">
                 <CardView hidden className="!w-6 !h-9 sm:!w-8 sm:!h-12 border-none" />
                 <span className="text-white font-bold self-center ml-1">x {p.handCount}</span>
              </div>
              {p.saidOneCard && (
                 <div className="mt-1 text-[10px] sm:text-xs font-black text-rose-500 bg-rose-500/20 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(244,63,94,0.5)]">ONE CARD</div>
              )}
              {roomData.currentTurnSeat === p.seat && ("""
content = content.replace(target_p_info, replace_p_info)

# 2. Update my one card button
target_btn = """          <button 
            onClick={declareOneCard}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-black text-sm sm:text-base border-2 transition-all ${me?.saidOneCard ? 'bg-rose-600 text-white border-rose-400' : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'}`}>
            원카드!
          </button>"""
replace_btn = """          <button 
            onClick={declareOneCard}
            className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-black text-sm sm:text-base border-2 transition-all ${me?.saidOneCard ? 'bg-rose-600 text-white border-rose-400' : (me?.handCount === 1 ? 'bg-rose-500 text-white border-white/50 animate-bounce shadow-[0_0_20px_rgba(244,63,94,0.8)]' : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600')}`}>
            원카드!
          </button>"""
content = content.replace(target_btn, replace_btn)

with open('src/components/OneCardOnline.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
