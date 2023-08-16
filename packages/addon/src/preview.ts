import type { ProjectAnnotations, Renderer } from "@storybook/types";
import { expandObject, flattenObject, createFlattenedArgTypes } from "./utils/story";

const preview: ProjectAnnotations<Renderer> = {
  argsEnhancers: [
    /**
     * If enabled, adds initial args to fit the flattened controls
     */
    (context) => {
      if (!context.parameters.deepControls?.enabled) {
        return context.initialArgs;
      }
      return flattenObject(context.initialArgs);
    },
  ],

  argTypesEnhancers: [
    /**
     * If enabled, replaces controls with flattened controls based on the initial args
     * and these will be what the user interacts with, ie the flat args become the source of truth
     *
     * @remark Storybook still adds in the un-flattened args but these should be ignored
     */
    (context) => {
      if (!context.parameters.deepControls?.enabled) {
        return context.argTypes;
      }
      return createFlattenedArgTypes(context);
    },
  ],

  decorators: [
    /**
     * If enabled, un-flattens the args from controls to the original format
     * before passing them to the story component
     */
    (storyFn, context) => {
      if (!context.parameters.deepControls?.enabled) {
        return storyFn(context);
      }

      return storyFn({
        ...context,
        args: expandObject(context.args),
        initialArgs: expandObject(context.initialArgs),
      });
    },
  ],
};

export default preview;
