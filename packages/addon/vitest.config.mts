/* eslint-disable import/no-unresolved */
import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    chaiConfig: {
      showDiff: true,
      truncateThreshold: 0,
    },
    coverage: {
      enabled: true,
      exclude: ["**/*.d.ts", "**/*.js", "**/*.test.ts", "**/*.spec.ts"],
    },
  },
});
