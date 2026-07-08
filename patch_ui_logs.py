import re

with open('src/components/OneCardOnline.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

log_ui = """
      {roomData?.logs && roomData.logs.length > 0 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm z-50 whitespace-nowrap pointer-events-none animate-fade-in-down">
          {roomData.logs[roomData.logs.length - 1].message}
        </div>
      )}
"""

if "roomData?.logs" not in content:
    content = content.replace("<div className=\"fixed inset-0 overflow-hidden bg-slate-900 text-slate-100 flex flex-col font-sans\">", "<div className=\"fixed inset-0 overflow-hidden bg-slate-900 text-slate-100 flex flex-col font-sans\">\n" + log_ui)
    with open('src/components/OneCardOnline.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
