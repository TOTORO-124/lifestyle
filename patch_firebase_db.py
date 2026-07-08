import re
with open('src/firebase.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("import { getDatabase } from 'firebase/database';", "")
content = content.replace("export const db = app ? getDatabase(app) : null;", "export const db = null;")
content = content.replace("databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || \"https://lifestyle-9abea-default-rtdb.firebaseio.com\",\n", "")
content = content.replace("const isValidUrl = (url: string | undefined) => {\n  if (!url || url.includes('YOUR_DATABASE_URL')) return false;\n  try {\n    new URL(url);\n    return url.startsWith('https://');\n  } catch {\n    return false;\n  }\n};\n", "")
content = content.replace("const isConfigured = true;", "const isConfigured = !!firebaseConfig.apiKey;")

with open('src/firebase.ts', 'w', encoding='utf-8') as f:
    f.write(content)
