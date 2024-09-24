/* eslint-disable */
import type {BaseAnnotations, Parameters as ImportToKeep} from "@storybook/types";

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

/** @internal */
export type PartialStrictInputType = Omit<Partial<StrictInputType>, "type"> & {
  type?: Partial<StrictInputType["type"]>;
};

export type TypeWithDeepControls<T extends Pick<BaseAnnotations, "argTypes">> = T & {
  // custom argTypes for deep controls only
  argTypes?: Record<`${string}.${string}`, PartialStrictInputType>;
};
