import type {Meta, StoryObj} from "@storybook/react";
import type {TypeWithDeepControls} from "storybook-addon-deep-controls";
import Basic from "./Basic";

const meta = {
  component: Basic,
  parameters: {
    deepControls: {
      enabled: true,
    },
  },
} satisfies TypeWithDeepControls<Meta<typeof Basic>>;

export default meta;

type Story = TypeWithDeepControls<StoryObj<typeof meta>>;

export const Enabled: Story = {
  args: {
    deep: {
      bool: true,
    },
    num: 1,
  },
  argTypes: {
    "deep.bool": {
      control: "boolean",
    },
  },
};

export const WithoutInitialArgTypes: Story = {
  args: {
    deep: {
      bool: true,
    },
    num: 1,
  },
  argTypes: {},
};
