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
} satisfies Meta<typeof Basic>;

export default meta;

type Story = StoryObj<typeof meta>;

export const BasicStory: Story = {
  args: {
    obj: {
      bool: true,
      text: "Hello, world!",
    },
    bool: true,
    num: 1,
    text: "text",
  },
};
