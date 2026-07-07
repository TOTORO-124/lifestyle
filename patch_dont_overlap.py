import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target1 = '<div className="flex -space-x-[1.5rem] sm:-space-x-[2rem] md:-space-x-[2.5rem] max-w-full overflow-x-auto p-4 md:p-8 items-end min-h-[100px] md:min-h-[140px] w-full justify-center">'
replacement1 = '<div className="flex flex-nowrap gap-2 max-w-full overflow-x-auto p-4 md:p-8 items-center min-h-[100px] md:min-h-[140px] w-full justify-start md:justify-center scrollbar-hide">'
content = content.replace(target1, replacement1)

target2 = '<div className={`flex ${vertical ? \'flex-col -space-y-[3rem] sm:-space-y-[4.5rem] md:-space-y-[5.5rem] py-4\' : \'-space-x-[2rem] sm:-space-x-[2.5rem] md:-space-x-[3.5rem] px-4\'} max-w-full items-center justify-center`}>'
replacement2 = '<div className={`flex ${vertical ? \'flex-col gap-1 py-2 overflow-y-auto max-h-[300px]\' : \'flex-nowrap gap-1 px-2 overflow-x-auto max-w-[250px] sm:max-w-[400px]\'} items-center justify-start scrollbar-hide`}>'
content = content.replace(target2, replacement2)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
