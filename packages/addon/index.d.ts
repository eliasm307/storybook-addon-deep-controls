/* eslint-disable */
import type {Parameters as ImportToKeep, ArgTypes, BaseAnnotations} from "@storybook/types";

type DummyTypeToShowImportAsUsed = ImportToKeep; // need this to keep the Parameters import to allow the declaration merge below to work

declare module "@storybook/types" {
  interface Parameters {
    /**
     * Parameters for the `storybook-addon-deep-controls` addon.
     */
    deepControls?: DeepControlsAddonParameters;
  }
}

type DeepControlsAddonParameters = {
  /**
   * Whether the deep controls addon is enabled.
   *
   * This can be enabled/disabled at the Meta level to apply to all stories,
   * or granularly at the story level to apply to a single story.
   *
   * @default false
   */
  enabled?: boolean;
};

export type TypeWithDeepControls<T extends Pick<BaseAnnotations, "argTypes">> = T & {
  argTypes?: ArgTypes<Record<string, unknown>>;
};
