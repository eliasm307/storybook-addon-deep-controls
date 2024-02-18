import type {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Parameters as _, // need this import to allow the declaration merge below to work
  BaseAnnotations,
  ArgTypes,
} from "@storybook/types";

declare module "@storybook/types" {
  type Parameters = {
    deepControls?: DeepControlsAddonParameters;
  };
}

type DeepControlsAddonParameters = {
  enabled?: boolean;
};

export type TypeWithDeepControls<T extends Pick<BaseAnnotations, "argTypes">> = T & {
  argTypes?: ArgTypes<Record<string, unknown>>;
};
