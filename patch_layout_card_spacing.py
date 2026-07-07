import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# For bottom player
target_bottom = '<div className="flex -space-x-[1.5rem] sm:-space-x-[2.5rem] md:-space-x-[3.5rem] max-w-full overflow-x-auto p-4 md:p-8 items-center min-h-[100px] md:min-h-[140px] w-full justify-center no-scrollbar pb-8 px-8">'
replace_bottom = '<div className="flex flex-wrap justify-center -space-x-[0.5rem] sm:-space-x-[1rem] md:-space-x-[1.5rem] p-4 md:p-6 w-full pb-8 px-8">'
content = content.replace(target_bottom, replace_bottom)

# For opponents
target_opp = """<div className={`flex ${vertical ? 'flex-col -space-y-[2.5rem] sm:-space-y-[3.5rem] md:-space-y-[4.5rem] py-4' : '-space-x-[1.5rem] sm:-space-x-[2.5rem] md:-space-x-[3.5rem] px-4'} items-center justify-center no-scrollbar`}>"""
replace_opp = """<div className={`flex ${vertical ? 'flex-col -space-y-[1.5rem] sm:-space-y-[2rem] md:-space-y-[3rem] py-4' : 'flex-wrap justify-center -space-x-[0.5rem] sm:-space-x-[1rem] md:-space-x-[1.5rem] px-4'} items-center justify-center`}>"""
content = content.replace(target_opp, replace_opp)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
