import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Bottom player
target_bottom = '<div className="flex flex-nowrap gap-2 max-w-full overflow-x-auto p-4 md:p-8 items-center min-h-[100px] md:min-h-[140px] w-full justify-start md:justify-center no-scrollbar">'
replace_bottom = '<div className="flex -space-x-[1.5rem] sm:-space-x-[2.5rem] md:-space-x-[3.5rem] max-w-full overflow-x-auto p-4 md:p-8 items-center min-h-[100px] md:min-h-[140px] w-full justify-center no-scrollbar pb-8 px-8">'
content = content.replace(target_bottom, replace_bottom)

target_motion = 'className="flex-shrink-0"'
replace_motion = 'className="flex-shrink-0 transition-transform duration-200 hover:-translate-y-6 hover:z-30 relative"'
content = content.replace(target_motion, replace_motion)

# Opponents
target_opp = """<div className={`flex ${vertical ? 'flex-col gap-1 py-2 overflow-y-auto max-h-[300px]' : 'flex-nowrap gap-1 px-2 overflow-x-auto max-w-[250px] sm:max-w-[400px]'} items-center justify-start no-scrollbar`}>"""
replace_opp = """<div className={`flex ${vertical ? 'flex-col -space-y-[2.5rem] sm:-space-y-[3.5rem] md:-space-y-[4.5rem] py-4' : '-space-x-[1.5rem] sm:-space-x-[2.5rem] md:-space-x-[3.5rem] px-4'} items-center justify-center no-scrollbar`}>"""
content = content.replace(target_opp, replace_opp)

# Container
target_container = "w-full max-w-5xl mx-auto h-full max-h-full flex flex-col bg-[#1A4D2E]"
replace_container = "w-full max-w-5xl mx-auto aspect-[3/4] md:aspect-square lg:aspect-[4/3] max-h-full flex flex-col bg-[#1A4D2E]"
content = content.replace(target_container, replace_container)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
