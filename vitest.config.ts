import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    hookTimeout: 60000,
    testTimeout: 60000,
    globalTeardown: "./src/__tests__/helpers/global-teardown.ts",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/__tests__/",
        "**/*.d.ts",
        "**/*.config.*",
        "**/index.ts",
        "src/components/ui/**",
        "src/app/**/*.tsx",
      ],
      thresholds: {
        "src/lib/rbac/**": { statements: 70, branches: 70, functions: 70, lines: 70 },
        "src/lib/i18n/**": { statements: 70, branches: 70, functions: 70, lines: 70 },
        "src/lib/sanitization.ts": { statements: 70, branches: 70, functions: 70, lines: 70 },
        "src/lib/recurrence.ts": { statements: 70, branches: 70, functions: 70, lines: 70 },
        "src/lib/rgpd.ts": { statements: 70, branches: 70, functions: 70, lines: 70 },
        "src/lib/validations.ts": { statements: 70, branches: 70, functions: 70, lines: 70 },
        "src/lib/saf-t.ts": { statements: 70, branches: 70, functions: 70, lines: 70 },
        "src/lib/time.ts": { statements: 70, branches: 70, functions: 70, lines: 70 },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
