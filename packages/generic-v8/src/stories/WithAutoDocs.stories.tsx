import type {Meta, StoryObj} from "@storybook/react";
import type {TypeWithDeepControls} from "storybook-addon-deep-controls";
import WithAutoDocs from "./WithAutoDocs";

const meta = {
  component: WithAutoDocs,
  tags: ["autodocs"],
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
    layout: "centered",
    deepControls: {
      enabled: true,
    },
  },
  args: {
    object: {
      booleanPropWithCustomDescription: true,
      requiredNumberProp: 5,
    },
  },
  argTypes: {
    "object.booleanPropWithCustomDescription": {
      description: "Custom description",
    },
    "object.requiredNumberProp": {
      type: {required: true},
    },
  },
} satisfies Meta<typeof WithAutoDocs>;

export default meta;

type Story = TypeWithDeepControls<StoryObj<typeof meta>>;

export const WithMergedArgTypes: Story = {};
