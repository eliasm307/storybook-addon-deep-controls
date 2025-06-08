import type {ProjectAnnotations, Renderer, StrictArgTypes} from "@storybook/types";
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
      console.log("argEnhancer start", {context});
      if (!context.parameters.deepControls?.enabled) {
        return context.initialArgs;
      }

      const flattenedArgs = createFlattenedArgs(context);
      console.log("argEnhancer end", {flattenedArgs});
      return flattenedArgs;
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
      console.log("argTypesEnhancer start", {context});
      if (!context.parameters.deepControls?.enabled) {
        console.log("argTypesEnhancer end, no deepControls enabled");
        return context.argTypes;
      }

      const flattenedArgTypes = createFlattenedArgTypes(context) as StrictArgTypes;
      console.log("argTypesEnhancer end", {flattenedArgTypes});
      return flattenedArgTypes;
    },
  ],

  decorators: [
    /**
     * If enabled, un-flattens the args from controls to the original format
     * before passing them to the story component
     */
    (storyFn, context) => {
      console.log("decorator start", {context});
      if (!context.parameters.deepControls?.enabled) {
        console.log("decorator end, no deepControls enabled");
        return storyFn(context);
      }

      const args = expandObject(context.args);
      const initialArgs = expandObject(context.initialArgs);
      console.log("decorator end", {args, initialArgs});

      return storyFn({...context, args, initialArgs});
    },
  ],
};

export default preview;
