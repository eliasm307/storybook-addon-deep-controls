import type { StrictInputType, StoryContextForEnhancers } from "@storybook/types";
import { isPojo, setProperty } from "./general";

export type DeepControlsStorybookContext = Pick<
  StoryContextForEnhancers,
  "argTypes" | "initialArgs" | "parameters"
>;

type PrimitiveValue = bigint | boolean | number | string | undefined | null;

const PRIMITIVE_TYPE_NAMES = new Set(["bigint", "boolean", "number", "string", "undefined"]);
function isPrimitive(value: unknown): value is PrimitiveValue {
  return PRIMITIVE_TYPE_NAMES.has(typeof value) || value === null;
}

function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

type FlattenObjectRecursionContext = {
  currentPath: string;
  flatObjectOut: Record<string, unknown>;
};

/**
 * @remark When a key is flattened its key wont exist in the new object e.g.
 * "{key: {nestedKey: value}}" becomes "{key.nestedKey: value}" ie the "key" key is removed
 */
export function flattenObject(
  nestedObject: object,
  context?: FlattenObjectRecursionContext,
): Record<string, unknown>;
export function flattenObject(
  nestedObject: object | undefined,
  context?: FlattenObjectRecursionContext,
): Record<string, unknown> | undefined;
export function flattenObject(
  nestedObject: object | undefined,
  context: FlattenObjectRecursionContext = {
    currentPath: "",
    flatObjectOut: {},
  },
): Record<string, unknown> | undefined {
  if (!isPojo(nestedObject)) {
    return; // cant or should not flatten
  }

  Object.entries(nestedObject).forEach(([key, value]) => {
    if (context.currentPath) {
      key = `${context.currentPath}.${key}`; // nested key
    }
    if (!isPojo(value)) {
      // we have reached the last value we can flatten in this branch

      context.flatObjectOut[key] = value;
      return;
    }

    flattenObject(value, { currentPath: key, flatObjectOut: context.flatObjectOut });
  });

  return context.flatObjectOut;
}

function createObjectArgType(argName: string): StrictInputType {
  return {
    name: argName,
    control: { type: "object" },
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
function createHiddenArgType(argPath: string) {
  return {
    name: argPath,
    table: { disable: true },
  };
}

function createPrimitiveArgInputTypeConfig(arg: {
  name: string;
  value: PrimitiveValue;
}): StrictInputType {
  const commonConfig = { name: arg.name };
  switch (typeof arg.value) {
    case "string":
      return {
        ...commonConfig,
        type: { name: "string" },
        control: { type: "text" },
      };

    case "number":
    case "bigint":
      return {
        ...commonConfig,
        type: { name: "number" },
        control: { type: "number" },
      };

    case "boolean":
      return {
        ...commonConfig,
        type: { name: "boolean" },
        control: { type: "boolean" },
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
  const flatInitialArgs = flattenObject(context.initialArgs ?? {});
  const argTypes = { ...(context.argTypes ?? {}) }; // shallow clone to avoid mutating original arg types object
  const userDefinedArgTypeNames = getUserDefinedArgTypeNames(context);

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
    argTypes[argPath] = createPrimitiveArgInputTypeConfig({ name: argPath, value: argValue });
  }

  return argTypes;
}

/**
 * Gets the argType names that the user has defined, excludes the ones that were likely generated e.g. by the docs addon
 */
function getUserDefinedArgTypeNames({
  argTypes = {},
  parameters,
}: DeepControlsStorybookContext): Set<string> {
  if (!parameters.docs) {
    return new Set(Object.keys(argTypes));
  }

  // NOTE: the docs addon will inject some argTypes so we need to filter them out to only have those explicitly defined by the user
  const userDefinedArgTypeNames = new Set<string>();
  for (const [argName, argType] of Object.entries(argTypes)) {
    if (!argName.includes(".") && !isArgTypeLikelyGeneratedByDocs(argType)) {
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
 * // argType generated by docs addon
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
          "jsDocTags": undefined, // key atleast included by the docs addon
          "defaultValue": null
      }
    }
  }
}
 */
function isArgTypeLikelyGeneratedByDocs(argType: StrictInputType) {
  // check argType has all the properties the docs addon would add
  for (const argTypePropertyName of ARG_TYPE_PROPERTIES_ALWAYS_INCLUDED_BY_DOCS_ADDON) {
    if (!(argTypePropertyName in argType)) {
      return false;
    }
  }

  // check type is an object
  if (!argType.type || typeof argType.type !== "object") {
    return false;
  }

  // check type is defined like the docs addon would define it
  const type = argType.type;
  if (typeof type.required !== "boolean" || typeof type.name !== "string") {
    return false;
  }

  // check table is an object
  if (!("table" in argType) || !argType.table || typeof argType.table !== "object") {
    return false;
  }

  // check table is defined like the docs addon would define it
  const table = argType.table;
  if (
    !("jsDocTags" in table) ||
    !table.type ||
    typeof table.type !== "object" ||
    typeof table.type.summary !== "string"
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
