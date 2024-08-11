import type {StoryContextForEnhancers, StrictInputType} from "@storybook/types";
import {isPojo, setProperty} from "./general";

/** @internal */
export const USER_DEFINED_ARG_TYPE_NAMES_SYMBOL = Symbol("userDefinedArgTypeNames");

export type DeepControlsStorybookContext = Pick<
  StoryContextForEnhancers,
  "argTypes" | "initialArgs"
> & {
  parameters: {
    docs?: unknown;
    controls?: {
      /** @see https://storybook.js.org/docs/essentials/controls#custom-control-type-matchers */
      matchers?: Record<string, RegExp>;
    };
    // NOTE: this needs to be defined for the addon to be enabled, so we can assume it will be defined
    // but type needs to be optional for compatibility
    deepControls?: {
      /**
       * Contains the argType names that the user has defined, excludes the ones that were likely generated
       * e.g. by the docs addon or by us
       *
       * @remark This is set in the ArgTypeEnhancer because it runs first and receives the original argTypes,
       * then this will be available in the ArgsEnhancer which runs after it
       */
      [USER_DEFINED_ARG_TYPE_NAMES_SYMBOL]?: Set<string>;
    };
  };
};

type PrimitiveValue = bigint | boolean | number | string | undefined | null;

const PRIMITIVE_TYPE_NAMES = new Set(["bigint", "boolean", "number", "string", "undefined"]);
function isPrimitive(value: unknown): value is PrimitiveValue {
  return PRIMITIVE_TYPE_NAMES.has(typeof value) || value === null;
}

function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

type FlattenObjectRecursionContext = {
  /**
   * New object populated with the flattened properties
   */
  flatObjectOut: Record<string, unknown>;
  argTypes: Record<string, StrictInputType>;
  parameters: DeepControlsStorybookContext["parameters"];
  userDefinedArgTypeNames: Set<string>;
};

export function createFlattenedArgs(
  context: Pick<DeepControlsStorybookContext, "initialArgs" | "argTypes" | "parameters">,
): Record<string, unknown> {
  return flattenObjectRecursively(context.initialArgs, "", {
    flatObjectOut: {},
    argTypes: context.argTypes ?? {},
    parameters: context.parameters,
    // this should be defined as argType enhancers run before args enhancers
    // but handling undefined for tests and also just incase for production
    userDefinedArgTypeNames:
      context.parameters.deepControls?.[USER_DEFINED_ARG_TYPE_NAMES_SYMBOL] ?? new Set(),
  });
}

/**
 * @remark When a key is flattened its key wont exist in the new object e.g.
 * "{key: {nestedKey: value}}" becomes "{key.nestedKey: value}" ie the "key" key is removed
 */
function flattenObjectRecursively(
  nestedObject: object,
  pathToParent: string,
  context: FlattenObjectRecursionContext,
): Record<string, unknown>;
function flattenObjectRecursively(
  nestedObject: object | undefined,
  pathToParent: string,
  context: FlattenObjectRecursionContext,
): Record<string, unknown> | undefined;
function flattenObjectRecursively(
  nestedObject: object | undefined,
  pathToParent: string,
  context: FlattenObjectRecursionContext,
): Record<string, unknown> | undefined {
  if (!isPojo(nestedObject)) {
    return nestedObject; // cant or should not flatten
  }

  Object.entries(nestedObject).forEach(([key, value]) => {
    if (pathToParent) {
      key = `${pathToParent}.${key}`; // nested key
    }

    // we can only flatten if have not reached the last value we can flatten in this branch
    // and the user has not specified a custom argType for it (ie otherwise we use whatever control they chose)
    const shouldFlatten = isPojo(value) && !context.userDefinedArgTypeNames.has(key);
    if (!shouldFlatten) {
      context.flatObjectOut[key] = value; // keep the value as is
      return;
    }

    flattenObjectRecursively(value, key, context);
  });

  return context.flatObjectOut;
}

function createObjectArgType(argName: string): StrictInputType {
  return {
    name: argName,
    control: {type: "object"},
  };
}

/**
 * Removes control from the UI
 *
 * @remark We do this instead of setting "parameters.controls.exclude"
 * as that would overwrite the default excluded controls config
 *
 * @remark Not having an argType defined does not mean a control is not shown,
 * it just means the default one is used which could be a blank one
 * if the value doesn't have a relevant control
 *
 * @see https://storybook.js.org/docs/react/essentials/controls#disable-controls-for-specific-properties
 */
function createHiddenArgType(argPath: string): StrictInputType {
  return {
    name: argPath,
    table: {disable: true},
  };
}

function createPrimitiveArgInputTypeConfig(arg: {
  name: string;
  value: PrimitiveValue;
}): StrictInputType {
  const commonConfig = {name: arg.name};
  switch (typeof arg.value) {
    case "string":
      return {
        ...commonConfig,
        type: {name: "string"},
        control: {type: "text"},
      };

    case "number":
    case "bigint":
      return {
        ...commonConfig,
        type: {name: "number"},
        control: {type: "number"},
      };

    case "boolean":
      return {
        ...commonConfig,
        type: {name: "boolean"},
        control: {type: "boolean"},
      };

    // controls should not exist for these
    case "function":
    case "undefined":
    case "object":
    case "symbol":
    default: {
      const errorMessage = `Unsupported arg value type: ${typeof arg.value} for ${arg.name}`;
      console.error(errorMessage, arg);
      throw new Error(errorMessage);
    }
  }
}

/**
 * This covers cases where a user has defined an argType for a parent object
 * so we don't want to create controls for its children
 */
function userAlreadyDefinedArgTypeForThisPath(
  argPath: string,
  userDefinedArgTypeNames: Set<string>,
) {
  for (const userDefinedArgTypeName of userDefinedArgTypeNames) {
    if (argPath.startsWith(`${userDefinedArgTypeName}.`)) {
      return true;
    }
  }
}

export function createFlattenedArgTypes(
  context: DeepControlsStorybookContext,
): Record<string, StrictInputType> {
  const userDefinedArgTypeNames = getUserDefinedArgTypeNames(context);

  // save the result so the arg enhancer can access the accurate list
  // NOTE: this assumes nothing will change these parameters as they belong to us/this addon
  Object.defineProperty(context.parameters.deepControls, USER_DEFINED_ARG_TYPE_NAMES_SYMBOL, {
    enumerable: false, // for easier test assertions
    writable: true, // might be kept on parameters between stories so needs to be re-assignable
    value: userDefinedArgTypeNames,
  });

  const flatInitialArgs = flattenObjectRecursively(context.initialArgs ?? {}, "", {
    flatObjectOut: {},
    argTypes: context.argTypes ?? {},
    parameters: context.parameters,
    userDefinedArgTypeNames,
  });
  const argTypes = {...(context.argTypes ?? {})}; // shallow clone to avoid mutating original arg types object
  const controlMatcherEntries = Object.entries(context.parameters.controls?.matchers ?? {});

  /*
  NOTE: if the docs addon injected argTypes at the top level and the user didn't define an arg value for them,
  then they wont be checked in the following loops which look at the initial args and they will be shown with the default control
  (ie basically falls back to default behaviour).

  We would need to infer types etc in order to show deep controls in that case so we don't support it for now as it would add a lot of complexity.

  Will see if its something people actually need first (ie is it commonly requested) before supporting this.
  */

  // remove argTypes for args that were flattened and don't exist now
  for (const flattenedRootArgKey of getRootKeysThatWereFlattened(flatInitialArgs)) {
    if (!userDefinedArgTypeNames.has(flattenedRootArgKey)) {
      // only hide the control if the user didn't define an argType for it
      argTypes[flattenedRootArgKey] = createHiddenArgType(flattenedRootArgKey);
    }
  }

  for (const [argPath, argValue] of Object.entries(flatInitialArgs)) {
    if (argTypes[argPath]) {
      continue; // existing argType defined, don't override
    }

    const matcherArgType = getArgTypeFromControlMatchers({argPath, controlMatcherEntries});
    if (matcherArgType) {
      argTypes[argPath] = matcherArgType;
      continue;
    }

    if (Array.isArray(argValue)) {
      argTypes[argPath] = createObjectArgType(argPath);
      continue;
    }

    // only show editable controls, remove controls for non-primitive args
    // or primitive nullish args without a manual argType from the UI
    if (isNullish(argValue) || !isPrimitive(argValue)) {
      argTypes[argPath] = createHiddenArgType(argPath);
      continue;
    }

    if (userAlreadyDefinedArgTypeForThisPath(argPath, userDefinedArgTypeNames)) {
      continue;
    }

    // add control for flattened primitive arg entry without existing control
    argTypes[argPath] = createPrimitiveArgInputTypeConfig({name: argPath, value: argValue});
  }

  return argTypes;
}

function getArgTypeFromControlMatchers({
  argPath,
  controlMatcherEntries,
}: {
  argPath: string;
  controlMatcherEntries: [string, RegExp][];
}): StrictInputType | undefined {
  const lastSegment = argPath.substring(argPath.lastIndexOf(".") + 1);
  for (const [controlType, matcherRegex] of controlMatcherEntries) {
    // we only want to match on the last segment of the argPath, ie the actual property name
    if (matcherRegex.test(lastSegment)) {
      return {
        name: argPath,
        control: {type: controlType},
      };
    }
  }
}

/**
 * Gets the argType names that the user has defined, excludes the ones that were likely generated
 * e.g. by the docs addon or by us
 *
 * @remark This only works accurately in an ArgTypeEnhancer because it runs first and receives the original argTypes,
 * when the args enhancer runs it receives the arg types after they have gone through the flattening process, so its more
 * difficult to determine which argTypes were user defined and which were generated by us or the docs addon.
 * The solution chosen is to save the result of this in the context.parameters so the arg enhancer can access the accurate list
 */
function getUserDefinedArgTypeNames({
  argTypes = {},
  parameters,
}: DeepControlsStorybookContext): Set<string> {
  if (!parameters.docs) {
    // NOTE: we assume this being truthy means the docs addon is enabled
    // there are no generated argTypes to filter out so we assume all of them are user defined
    return new Set(Object.keys(argTypes));
  }

  // the docs addon will inject some argTypes so we need to filter them out to only have those explicitly defined by the user
  const userDefinedArgTypeNames = new Set<string>();
  for (const [argName, argType] of Object.entries(argTypes)) {
    if (!isArgTypeLikelyGeneratedByDocs(argName, argType)) {
      userDefinedArgTypeNames.add(argName);
    }
  }

  return userDefinedArgTypeNames;
}

const ARG_TYPE_PROPERTIES_ALWAYS_INCLUDED_BY_DOCS_ADDON = new Set([
  "name",
  "description",
  "type",
  "table",
]);

/**
 * Tries to determine if the argTypes were likely generated by the docs addon
 *
 * @remark This determines if an argType was "likely" generated based on the amount of detail the argType has
 * We can't be 100% sure but we assume user's will have more minimal argType definitions than what typical users would have
 *
 * @remark See examples of the format users are instructed to use when defining argTypes: https://storybook.js.org/docs/api/arg-types#manually-specifying-argtypes
 *
 * @example
 * // object argType generated by docs addon
 *
{
  "argTypes": {
    "someObject": {
      "name": "someObject",
      "description": "",
      "type": {
          "required": false,
          "name": "other",
          "value": "{ anyString: string; enumString: string; }"
      },
      "table": {
          "type": {
              "summary": "{ anyString: string; enumString: string; }"
          },
          "jsDocTags": undefined, // key atleast included by the docs addon // not always included
          "defaultValue": null
      }
    }
  }
}

// string argType generated by docs addon
"someString": {
    "name": "someString",
    "description": "",
    "type": {
      "required": false,
      "name": "string"
    },
    "table": {
      "type": {
        "summary": "string"
      }
    }
  },
 */
function isArgTypeLikelyGeneratedByDocs(argName: string, argType: StrictInputType): boolean {
  // check argType only has the properties the docs addon would add
  if (Object.keys(argType).length !== ARG_TYPE_PROPERTIES_ALWAYS_INCLUDED_BY_DOCS_ADDON.size) {
    return false; // likely be a customised argType because it has a different number of properties than a generated argType
  }

  if (argType.name !== argName) {
    return false; // assuming docs doesn't do aliases
  }

  if (typeof argType.description !== "string") {
    return false; // assuming docs always includes a description
  }

  // check type object is defined like the docs addon would define it
  if (
    !argType.type ||
    typeof argType.type !== "object" ||
    typeof argType.type.required !== "boolean" ||
    typeof argType.type.name !== "string"
    // typeof type.raw !== "string" // not always included
  ) {
    return false;
  }

  // check table object is defined like the docs addon would define it
  if (
    !argType.table ||
    typeof argType.table !== "object" ||
    // !("jsDocTags" in table) || // not always included by the docs addon
    !argType.table.type ||
    typeof argType.table.type !== "object" ||
    typeof argType.table.type.summary !== "string"
  ) {
    return false;
  }

  // passes all checks so it looks like it was generated by the docs addon
  return true;
}

/**
 * When a key is flattened its key wont exist in the new object e.g.
 * "{key: {nestedKey: value}}" becomes "{key.nestedKey: value}" ie the "key" key is removed
 *
 * This finds such keys that used to exist in the original object but do not exist after flattening
 */
function getRootKeysThatWereFlattened(object: Record<string, unknown>): Set<string> {
  return Object.keys(object).reduce((flattenedKeys, argKey) => {
    if (argKey.includes(".")) {
      const rootArgKey = argKey.substring(0, argKey.indexOf("."));
      flattenedKeys.add(rootArgKey);
    }
    return flattenedKeys;
  }, new Set<string>());
}

/** @internal */
export function expandObject(flatObject: Record<string, unknown>): Record<string, unknown>;
export function expandObject(
  flatObject: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined;
export function expandObject(
  flatObject: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!flatObject) {
    return; // cant expand a non-object, assumes truthy values passed in are objects
  }

  // NOTE: tried sorting these so the unflattened props would be first and get overwritten by the nested props
  // but it didn't work for some reason so opted to just filter them out instead
  const flattenedRootArgKeys = getRootKeysThatWereFlattened(flatObject);
  return Object.entries(flatObject)
    .filter(([key]) => !flattenedRootArgKeys.has(key))
    .reduce((out, [key, value]) => {
      return setProperty(out, key, value);
    }, {});
}
