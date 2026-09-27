// Temp shim to run vitest while vitest.mjs bin entry is missing (partial npm install).
import { startVitest } from 'vitest/node';
const ctx = await startVitest('test', process.argv.slice(2));
await ctx.close();
