import type {StorybookConfig} from "@storybook/nextjs";

const config: StorybookConfig = {
  stories: ["../../generic-v8/src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-essentials", // to get controls and docs addons and make sure we are compatible with any other essential addon
    "storybook-addon-deep-controls",
  ],
  framework: {
    name: "@storybook/nextjs",
    options: {
      builder: {
        fsCache: true,
        lazyCompilation: true,
      },
    },
  },
};

export default config;
