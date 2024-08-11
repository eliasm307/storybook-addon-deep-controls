import type {ProjectAnnotations, Renderer} from "@storybook/types";
import {createFlattenedArgTypes, createFlattenedArgs, expandObject} from "./utils/story";

const preview: ProjectAnnotations<Renderer> = {
  argsEnhancers: [
    /**
     * If enabled, adds initial args to fit the flattened controls
     */
    (context) => {
      if (!context.parameters.deepControls?.enabled) {
        return context.initialArgs;
      }

      console.log("argsEnhancers before flatten", JSON.stringify(context.initialArgs, null, 2));

      const argsAfter = createFlattenedArgs(context);
      console.log("argsEnhancers", {
        initialArgs: context.initialArgs,
        argsAfter,
        argTypes: context.argTypes,
      });

      return argsAfter;
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

      console.log("argTypesEnhancers before flatten", JSON.stringify(context.argTypes, null, 2));

      const argTypesAfter = createFlattenedArgTypes(context);

      console.log("argTypesEnhancers", {
        initialArgs: context.initialArgs,
        argTypes: {...context.argTypes},
        argTypesAfter,
        parameters: context.parameters,
      });

      return argTypesAfter;
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

      console.log("decorator before story render context", {
        args: {...context.args},
        initialArgs: {...context.initialArgs},
        parameters: context.parameters,
        argTypes: {...context.argTypes},
      });

      return storyFn({
        ...context,
        args: expandObject(context.args),
        initialArgs: expandObject(context.initialArgs),
      });
    },
  ],
};

export default preview;
