import type {
  ProjectAnnotations,
  Renderer,
  StrictArgTypes,
} from "storybook/internal/types" with {"resolution-mode": "import"};
import {createFlattenedArgTypes, createFlattenedArgs, expandObject} from "./utils/story";

// todo test it does not do anything custom if deepControls is not enabled
const preview: ProjectAnnotations<Renderer> = {
  argsEnhancers: [
    /**
     * If enabled, adds initial args to fit the flattened controls
     *
     * @note This only gets called when the story is rendered (ie not when controls change etc)
     *
     * @note Might be called multiple times during render for the same story
     */
    (context) => {
      if (!context.parameters.deepControls?.enabled) {
        return context.initialArgs;
      }

      return createFlattenedArgs(context);
    },
  ],

  argTypesEnhancers: [
    /**
     * If enabled, replaces controls with flattened controls based on the initial args
     * and these will be what the user interacts with, ie the flat args become the source of truth
     *
     * @note Storybook still adds in the un-flattened args but these should be ignored
     *
     * @note This only gets called when the story is rendered (ie not when controls change etc)
     *
     * @note Might be called multiple times during render for the same story
     */
    (context) => {
      if (!context.parameters.deepControls?.enabled) {
        return context.argTypes;
      }

      return createFlattenedArgTypes(context) as StrictArgTypes;
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
