import type {StorybookConfig} from "@storybook/nextjs";
import {dirname, join} from "path";

// NOTE: need to ues this instead of passing package names directly
// as that would change how the json control renders function values for some reason
function getAbsolutePathToPackage(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}

const config: StorybookConfig = {
  stories: ["../../example-v8-generic/src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-essentials", // to get controls and docs addons and make sure we are compatible with any other essential addon
    "storybook-addon-deep-controls",
  ].map(getAbsolutePathToPackage),
  framework: {
    name: getAbsolutePathToPackage("@storybook/nextjs"),
    options: {
      builder: {
        fsCache: true,
        lazyCompilation: true,
      },
    },
  },
};

export default config;
