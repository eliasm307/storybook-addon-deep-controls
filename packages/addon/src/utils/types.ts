// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type { Parameters as _ } from "@storybook/types"; // need this import to allow the declaration merge below to work

declare module "@storybook/types" {
  interface Parameters {
    deepControls?: DeepControlsAddonParameters;
  }
}

interface DeepControlsAddonParameters {
  enabled?: boolean;
}
