import type { Meta, StoryObj } from "@storybook/react";
import type { TypeWithDeepControls } from "storybook-addon-deep-controls";
import WithTypedProps from "./WithTypedProps";

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  component: WithTypedProps,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
    layout: "centered",
    deepControls: {
      enabled: true,
    },
  },
} satisfies Meta<typeof WithTypedProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultEnabled: Story = {};

export const DefaultDisabled: Story = {
  parameters: {
    deepControls: {
      enabled: false,
    },
  },
};

export const WithArgs: Story = {
  args: {
    someObject: {
      anyString: "anyString",
      enumString: "enumString",
    },
    someArray: ["string1", "string2"],
    // NOTE: we inherit the "someString" control from docs without an arg value
  },
};

export const WithCustomControls: TypeWithDeepControls<Story> = {
  args: {
    someObject: {
      anyString: "anyString",
      enumString: "enumString",
    },
    someArray: ["string1", "string2"],
  },
  argTypes: {
    "someObject.enumString": {
      control: "radio",
      options: ["value1", "value2", "value3"],
    },
    someString: {
      control: "radio",
      options: ["string1", "string2", "string3"],
    },
  },
};
