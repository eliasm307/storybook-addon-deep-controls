export const TEST_TIMEOUT_MS = 120_000;

type StorybookType = "v8-vite" | "v8-webpack";

type StorybookExampleConfig = {
  port: number;
  devCommand: string;
};

const STORYBOOK_CONFIGS: Record<"v8-vite" | "v8-webpack", StorybookExampleConfig> = {
  "v8-webpack": {
    port: 6008,
    devCommand: "npm run --prefix ../example-v8-webpack storybook",
  },
  "v8-vite": {
    port: 6018,
    devCommand: "npm run --prefix ../example-v8-vite storybook",
  },
};

// eslint-disable-next-line wrap-iife
export const CONFIG = (function getStorybookConfig(): StorybookExampleConfig {
  const storybookType: StorybookType = getEnvironmentVariable("STORYBOOK_EXAMPLE_TYPE");
  const config = STORYBOOK_CONFIGS[storybookType];
  if (!config) {
    throw new Error(`Unknown storybook type ${storybookType}`);
  }

  console.log(`Storybook config: ${JSON.stringify(config, null, 2)}`);
  return config;
})();

export const STORYBOOK_PORT: number = CONFIG.port;

function getEnvironmentVariable<T extends string>(name: "STORYBOOK_EXAMPLE_TYPE"): T {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value as T;
}
