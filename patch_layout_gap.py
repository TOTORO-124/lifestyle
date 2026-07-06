import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = "<div className={`flex ${vertical ? 'flex-col -space-y-[3rem] sm:-space-y-[4.5rem] md:-space-y-[5.5rem] py-4' : '-space-x-[2rem] sm:-space-x-[2.5rem] md:-space-x-[3.5rem] px-4'} max-w-full items-center`}>"
replacement = "<div className={`flex flex-wrap justify-center gap-1 sm:gap-2 p-2 w-full max-w-full`}>"

content = content.replace(target, replacement)

target2 = '<div className="flex -space-x-[2rem] sm:-space-x-[2.5rem] md:-space-x-[3.5rem] max-w-full overflow-x-auto p-4 md:p-8 items-end min-h-[100px] md:min-h-[140px] w-full justify-center">'
replacement2 = '<div className="flex flex-wrap justify-center gap-1 sm:gap-2 max-w-full overflow-y-auto p-2 md:p-4 items-center min-h-[100px] md:min-h-[140px] w-full">'

content = content.replace(target2, replacement2)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
