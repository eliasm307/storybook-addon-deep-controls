import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    chaiConfig: {
      showDiff: true,
      truncateThreshold: 0,
    },
  },
});
