import {viteCommonjs} from "@originjs/vite-plugin-commonjs";
import type {StorybookConfig} from "@storybook/react-vite";
import {dirname, join} from "path";
import {mergeConfig, type InlineConfig} from "vite";

/**
 * This function is used to resolve the absolute path of a package.
 * It is needed in projects that use Yarn PnP or are set up within a monorepo.
 */
function getAbsolutePathToPackage(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-essentials", // to get controls and docs addons and make sure we are compatible with any other essential addon
    "storybook-addon-deep-controls",
  ].map(getAbsolutePathToPackage),
  framework: {
    name: getAbsolutePathToPackage("@storybook/react-vite"),
    options: {},
  },
  async viteFinal(config, {configType}) {
    // return the customized config
    return mergeConfig(config, {
      plugins: [viteCommonjs()],
      // customize the Vite config here
      optimizeDeps: {
        // include: ["storybook-addon-deep-controls"],
        // esbuildOptions: {
        //   plugins: [esbuildCommonjs(["storybook-addon-deep-controls"])],
        // },
      },
    } satisfies InlineConfig);
  },
};

export default config;
