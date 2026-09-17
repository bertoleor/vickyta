import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

/**
 * Vitest runner config — VICKY (Next.js 14 / React 18 / TypeScript).
 * jsdom environment for component smoke tests; "lib/format-money-ars.ts"
 * and UI components are covered under __tests__/.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["__tests__/**/*.test.{ts,tsx}"],
    // Calibrado 2026-09-16 (VICKY-P2): pool forks + timeouts generosos son
    // más estables que threads en Windows bajo carga; evita rpc-timeout de /@vite/env.
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 15000,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});