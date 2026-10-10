import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      // Report files that no test imports, so an untested source file fails
      // the thresholds instead of being silently skipped.
      all: true,
      include: ["src/**/*.ts"],
      exclude: [
        // Process entry point: binds a real port and installs signal
        // handlers. The testable app construction lives in app.ts.
        "src/server.ts",
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
