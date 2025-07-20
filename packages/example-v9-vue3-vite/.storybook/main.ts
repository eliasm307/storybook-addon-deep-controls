import {StorybookConfig} from "@storybook/vue3-vite";
// NOTE: dont import vite at top level: https://github.com/storybookjs/storybook/issues/26291#issuecomment-1978193283

// todo wait for react native
const config: StorybookConfig = {
  stories: ["../../example-v9-react-generic/src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-docs", "storybook-addon-deep-controls"],
  framework: {
    name: "@storybook/vue3-vite",
    options: {
      docgen: "vue-component-meta",
    },
  },
};

export default config;
