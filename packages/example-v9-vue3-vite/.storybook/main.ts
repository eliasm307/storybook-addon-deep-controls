import type {StorybookConfig} from "@storybook/vue3-vite";
import vue from "@vitejs/plugin-vue";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["storybook-addon-deep-controls"],
  framework: {
    name: "@storybook/vue3-vite",
    options: {
      // https://storybook.js.org/docs/get-started/frameworks/vue3-vite#using-vue-component-meta
      docgen: "vue-component-meta",
    },
  },
  viteFinal: async (config) => ({
    ...config,
    plugins: [...(config.plugins ?? []), vue()],
  }),
};

export default config;
