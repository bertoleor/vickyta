import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Collect env vars used in app/, lib/, middleware.ts
const roots = ['app', 'lib'];
const files = ['middleware.ts'];
for (const root of roots) {
  const walk = (dir) => {
    for (const e of readdirSync(dir)) {
      const p = join(dir, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.(ts|tsx|js|mjs)$/.test(p)) files.push(p);
    }
  };
  walk(root);
}

const used = new Set();
const re = /process\.env\.([A-Z0-9_]+)/g;
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  let m;
  while ((m = re.exec(src))) used.add(m[1]);
}

const example = readFileSync('.env.example', 'utf8');
const documented = new Set(
  [...example.matchAll(/^([A-Z0-9_]+)=/gm)].map((m) => m[1])
);

const missing = [...used].filter((v) => !documented.has(v));
if (missing.length) {
  console.error('MISSING in .env.example:');
  for (const v of missing) console.error(`  - ${v}`);
  process.exit(1);
}
console.log('OK: all env vars are documented in .env.example');
