import re

with open('src/components/OldMaid.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = "import React, { useState, useEffect } from 'react';"
replacement = "import React, { useState, useEffect, useRef } from 'react';"

if target in content:
    content = content.replace(target, replacement)
    print("Added useRef!")
else:
    print("Could not find React import")

with open('src/components/OldMaid.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
