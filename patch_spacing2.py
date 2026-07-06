import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_spacing = "<div className={`flex ${vertical ? 'flex-col -space-y-[4.5rem] sm:-space-y-[5.5rem] md:-space-y-[7.5rem] py-4' : '-space-x-10 sm:-space-x-12 md:-space-x-16 px-4'} max-w-full items-center`}>"
replacement_spacing = "<div className={`flex ${vertical ? 'flex-col -space-y-[3rem] sm:-space-y-[4.5rem] md:-space-y-[5.5rem] py-4' : '-space-x-[2rem] sm:-space-x-[2.5rem] md:-space-x-[3.5rem] px-4'} max-w-full items-center`}>"

content = content.replace(target_spacing, replacement_spacing)

target_bottom_spacing = '<div className="flex -space-x-10 sm:-space-x-12 md:-space-x-16 max-w-full overflow-x-auto p-4 md:p-8 items-end min-h-[140px] md:min-h-[180px] w-full justify-center">'
replacement_bottom_spacing = '<div className="flex -space-x-[2rem] sm:-space-x-[2.5rem] md:-space-x-[3.5rem] max-w-full overflow-x-auto p-4 md:p-8 items-end min-h-[100px] md:min-h-[140px] w-full justify-center">'

content = content.replace(target_bottom_spacing, replacement_bottom_spacing)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
