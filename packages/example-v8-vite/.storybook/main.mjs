// import {StorybookConfig} from "@storybook/react-vite";
import {mergeConfig} from "vite";
// import {createRequire} from "node:module";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePathToPackage(value) {
  return value;
  // return dirname(require.resolve(join(value, "package.json"))).replaceAll("\\", "/");
}

const config = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-essentials", // to get controls and docs addons and make sure we are compatible with any other essential addon
    // "storybook-addon-deep-controls",
  ].map(getAbsolutePathToPackage),
  framework: {
    name: getAbsolutePathToPackage("@storybook/react-vite"),
    options: {},
  },
  viteFinal: (config) =>
    mergeConfig(config, {
      // optimizeDeps: {
      //   include: ["storybook-addon-deep-controls"],
      // },
      // build: {
      //   commonjsOptions: {
      //     include: [/storybook-addon-deep-controls/],
      //   },
      // },
    }),
};

export default config;
