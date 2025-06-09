import type {Preview} from "@storybook/react";
import type {StrictArgTypes} from "@storybook/types";

const preview: Preview = {
  argTypesEnhancers: [
    (context): StrictArgTypes => ({
      ...context.argTypes,
      "new.bool": {
        name: "new.bool",
        control: {type: "boolean"},
        type: {name: "boolean"},
      },
      "new.string": {
        name: "new.string",
        control: {type: "text"},
        type: {name: "string"},
      },
    }),
  ],
  argsEnhancers: [
    (context) => ({
      ...context.initialArgs,
      "new.bool": true,
      "new.string": "New String",
    }),
  ],
  decorators: [
    (storyFn, context) => {
      const args = {...context.args};
      args.new = {
        bool: args["new.bool"],
        string: args["new.string"],
      };
      delete args["new.bool"];
      delete args["new.string"];

      const initialArgs = {...context.initialArgs};
      initialArgs.new = {
        bool: initialArgs["new.bool"],
        string: initialArgs["new.string"],
      };
      delete initialArgs["new.bool"];
      delete initialArgs["new.string"];

      return storyFn({...context, args, initialArgs});
    },
  ],
};

export default preview;
