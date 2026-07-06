import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target_spacing = "<div className={`flex ${vertical ? 'flex-col -space-y-12 md:-space-y-16' : '-space-x-4 md:-space-x-8'}`}>"
replacement_spacing = "<div className={`flex ${vertical ? 'flex-col -space-y-[4.5rem] sm:-space-y-[5.5rem] md:-space-y-[7.5rem] py-4' : '-space-x-10 sm:-space-x-12 md:-space-x-16 px-4'} max-w-full overflow-hidden items-center`}>"

content = content.replace(target_spacing, replacement_spacing)

# Bottom player uses a different block!
target_bottom_spacing = '<div className="flex -space-x-4 md:-space-x-8 max-w-full overflow-x-auto p-4 items-end min-h-[160px]">'
replacement_bottom_spacing = '<div className="flex -space-x-10 sm:-space-x-12 md:-space-x-16 max-w-full overflow-x-auto p-4 md:p-8 items-end min-h-[140px] md:min-h-[180px] w-full justify-center">'

content = content.replace(target_bottom_spacing, replacement_bottom_spacing)

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
