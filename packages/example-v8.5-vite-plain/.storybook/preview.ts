import type {Preview} from "@storybook/react";
import type {StrictArgTypes} from "@storybook/types";

const preview: Preview = {
  argTypesEnhancers: [
    (context): StrictArgTypes => {
      return {
        ...context.argTypes,
        newBool: {
          name: "newBool",
          control: {type: "boolean"},
          type: {name: "boolean", required: true},
        },
        newString: {
          name: "newString",
          control: {type: "text"},
          type: {name: "string", required: true},
        },
      };
    },
  ],
  argsEnhancers: [
    (context) => {
      return {
        ...context.initialArgs,
        newBool: true,
        newString: "New String Value",
      };
    },
  ],
  decorators: [
    (storyFn, context) => {
      console.log("Decorator called with context:", context);

      const args = {...context.args};
      delete args.newBool;
      delete args.newString;

      const initialArgs = {...context.initialArgs};
      delete initialArgs.newBool;
      delete initialArgs.newString;

      return storyFn({...context, args, initialArgs});
    },
  ],
};

export default preview;
