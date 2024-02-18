import type { Meta, StoryObj } from "@storybook/react";
import type { TypeWithDeepControls } from "storybook-addon-deep-controls";
import Dev from "./Dev";

// More on writing stories with args: https://storybook.js.org/docs/react/writing-stories/args
// More on how to set up stories at: https://storybook.js.org/docs/react/writing-stories/introduction#default-export
const meta = {
  component: Dev,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/react/configure/story-layout
    layout: "centered",
    deepControls: {
      enabled: true,
    },
  },
} satisfies Meta<typeof Dev>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Enabled: Story = {
  args: createNestedObject(),
};

export const Disabled: Story = {
  args: createNestedObject(),
  parameters: {
    deepControls: {
      enabled: false,
    },
  },
};

export const WithCustomControls: Story = {
  args: {
    someObject: {
      anyString: "anyString",
      enumString: "enumString",
    },
  },
  argTypes: {
    "someObject.enumString": {
      control: "radio",
      options: ["value1", "value2", "value3"],
    },
  },
};

export const RawObject: Story = {
  args: {
    someObject: {
      anyString: "anyString",
      enumString: "enumString",
    },
  },
  parameters: {
    deepControls: {
      enabled: false,
    },
  },
};

// NOTE: this doesn't include BigInt as Storybook cant serialise this
function createNestedObject() {
  return {
    bool: true,
    string: "string1234",
    number: 1234,
    nested: {
      bool: false,
      string: "string2",
      number: 2,
      nestedWithoutPrototype: Object.assign(Object.create(null), {
        bool: true,
        string: "string3",
        element: document.createElement("span"),
      }),
      nullValue: null,
      element: document.createElement("div"),
      func: () => {},
      nested: {
        bool: true,
        string: "string3",
        number: -3,
        nullValue: null,
        infinity: Infinity,
        NaNValue: NaN,
        symbol: Symbol("symbol"),
        classRef: class Foo {},
        numberArray: [1, 2, 3],
        complexArray: [
          {
            bool: true,
            string: "string3",
            number: -3,
          },
          document.createElement("div"),
          null,
          Symbol("symbol"),
          class Bar {},
          function () {},
        ],
      },
    },
  };
}

export const TextExample: TypeWithDeepControls<Story> = {
  args: {
    children: "Text",
    strikeThrough: {
      isActive: false,
      color: "#000",
    },
  },
  argTypes: {
    foregroundStyle: { control: "color" },
    "strikeThrough.isActive": { control: "boolean" },
    "strikeThrough.color": { control: "color" },
  },
};
