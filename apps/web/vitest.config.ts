import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      // Report files that no test imports, so an untested source file fails
      // the thresholds instead of being silently skipped.
      all: true,
      include: ["src/**/*.{ts,vue}"],
      exclude: [
        // Component and client tests live under src/.
        "src/**/*.test.ts",
        // Bootstrap entry point: mounts the Vue app on the document.
        "src/main.ts",
        // Pure type declarations; no runtime behavior to cover.
        "src/api/types.ts",
      ],
      thresholds: {
        lines: 70,
        branches: 70,
        functions: 70,
        statements: 70,
        // Enforce on every file, not just the merged total.
        perFile: true,
      },
    },
  },
});
