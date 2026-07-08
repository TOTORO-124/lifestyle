const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/import \{ createServer as createViteServer \} from "vite";\n/, "");

const replacement = `  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({`;

code = code.replace(/  \/\/ Vite middleware for development\n  if \(process\.env\.NODE_ENV !== "production"\) \{\n    const vite = await createViteServer\(\{/, replacement);

fs.writeFileSync('server.ts', code);
console.log('patched server');
