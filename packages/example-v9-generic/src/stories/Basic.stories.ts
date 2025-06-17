import type {Meta, StoryObj} from "@storybook/react";
import type {TypeWithDeepControls} from "storybook-addon-deep-controls";
import Basic from "./Basic";

const meta = {
  component: Basic,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
    layout: "centered",
    deepControls: {
      enabled: true,
    },
  },
} satisfies TypeWithDeepControls<Meta<typeof Basic>>;

export default meta;

type Story = TypeWithDeepControls<StoryObj<typeof meta>>;

export const Disabled: Story = {
  args: {
    someObject: {
      anyString: "anyString",
      enumString: "value2",
      number: 42,
      boolean: true,
    },
  },
  parameters: {
    deepControls: {
      enabled: false,
    },
  },
};

export const Enabled: Story = {
  args: {
    someObject: {
      anyString: "anyString",
      enumString: "value2",
      number: 42,
      boolean: true,
    },
  },
  argTypes: {
    "someObject.enumString": {
      control: "radio",
      options: ["value1", "value2", "value3"],
    },
  },
};
