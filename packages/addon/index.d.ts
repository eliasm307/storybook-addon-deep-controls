/* eslint-disable */
import type {BaseAnnotations, Parameters as ImportToKeep, StrictInputType} from "@storybook/types";

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

/**
 * This is to prevent auto complete being broken if type uses mapped types
 *
 * @see issue
 *
 * @internal
 */
type RemappedOmit<T, K extends PropertyKey> = {
  [P in keyof T as Exclude<P, K>]: T[P];
};

/**
 * We make this type partial because with DeepControls some normally requires properties are optional
 *
 * @internal
 */
export type PartialStrictInputType = RemappedOmit<Partial<StrictInputType>, "type"> & {
  type?: Partial<StrictInputType["type"]>;
};

export type TypeWithDeepControls<T extends Pick<BaseAnnotations, "argTypes">> = T & {
  // custom argTypes for deep controls only, loosens the key type to allow for deep control keys
  argTypes?: Record<`${string}.${string}`, PartialStrictInputType>;
};
