import type {StorybookConfig} from "@storybook/nextjs";
import {join, dirname} from "path";

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
    getAbsolutePathToPackage("@storybook/addon-controls"),
    getAbsolutePathToPackage("storybook-addon-deep-controls"),
  ],
  framework: {
    name: getAbsolutePathToPackage("@storybook/nextjs"),
    options: {},
  },
};
export default config;
