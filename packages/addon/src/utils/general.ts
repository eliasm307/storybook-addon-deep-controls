export function setProperty<T extends Partial<Record<string, unknown>>>(
  object: T,
  path: string,
  value: any,
): T {
  if (typeof object !== "object" || object === null) {
    return object; // should be an object but handle if it isn't
  }

  const remainingPathSegments = path.split(".");
  const currentTargetSegment = remainingPathSegments.shift();
  if (!currentTargetSegment) {
    return object; // invalid path ignore
  }

  if (!remainingPathSegments.length) {
    // we have reached the last segment so set the value
    object[currentTargetSegment as keyof T] = value;
    return object;
  }
  // we have more segments to go so recurse if possible

  let nextTargetObj = object[currentTargetSegment];
  if (nextTargetObj === undefined) {
    // next target doesn't exist so create one in our path
    object[currentTargetSegment as keyof T] = {} as any;
    nextTargetObj = object[currentTargetSegment];

    // check if we can go further
  } else if (!nextTargetObj || typeof nextTargetObj !== "object") {
    return object; // cant go further, invalid path ignore the rest
  }

  // recurse
  setProperty(nextTargetObj as object, remainingPathSegments.join("."), value);

  // need to return the original object, only the top level caller will get this
  return object;
}

const POJO_PROTOTYPES = [Object.prototype, null];

/**
 * Is the value a simple object, ie a Plain Old Javascript Object,
 * not a class instance, function, array etc which are also objects
 *
 * @internal
 */
export function isPojo(val: unknown): val is object {
  return Boolean(
    typeof val === "object" &&
      val &&
      POJO_PROTOTYPES.includes(Object.getPrototypeOf(val)) &&
      !isReactElement(val),
  );
}

// NOTE: React has `#isValidElement` utility to check this, however we dont use it here so React isn't a dependency
export function isReactElement(val: Record<string, any>): boolean {
  return typeof val.$$typeof === "symbol";
}

/**
 * @internal
 */
export function stringify(data: unknown): string {
  return JSON.stringify(data, replacer, 2);
}

function replacer(inputKey: string, inputValue: unknown): unknown {
  if (inputValue === undefined) {
    return "[undefined]";
  }

  if (typeof inputValue === "number") {
    if (isNaN(inputValue)) {
      return "[NaN]";
    }

    if (!isFinite(inputValue)) {
      return "[Infinity]";
    }
  }

  // any falsy values can be serialised?
  if (!inputValue) {
    return inputValue;
  }

  if (inputValue instanceof Error) {
    return `[Error("${inputValue.message}")]`;
  }

  if (typeof inputValue === "function") {
    return `[Function:${inputValue.name || "anonymous"}]`;
  }

  if (typeof inputValue === "symbol") {
    return `[${inputValue.toString()}]`;
  }

  if (inputValue instanceof Promise) {
    return "[Promise]";
  }

  if (inputValue instanceof Map) {
    const normalisedMap: Record<string, unknown> = {};
    for (const [key, value] of inputValue.entries()) {
      normalisedMap[key] = value;
    }
    return normalisedMap;
  }

  if (inputValue instanceof RegExp) {
    return inputValue.toString();
  }

  if (inputValue instanceof Set) {
    return Array.from<unknown>(inputValue);
  }

  if (Array.isArray(inputValue)) {
    return inputValue.map((value, index) => {
      return replacer(`${inputKey}[${index}]`, value);
    });
  }

  if (typeof inputValue === "object") {
    if (isReactElement(inputValue)) {
      return "[ReactElement]";
    }

    const isPojoValue = isPojo(inputValue);
    if (isPojoValue) {
      return inputValue;
    }

    const className = (inputValue as object).constructor.name;
    return `[${className}]`;
  }

  return inputValue;
}
