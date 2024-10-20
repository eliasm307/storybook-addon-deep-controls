export function setProperty<T extends Partial<Record<string, unknown>>>(
  object: T,
  path: string,
  value: any,
): T {
  if (!isAnyObject(object)) {
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

export function getProperty(value: unknown, path: string): unknown {
  for (const pathSegment of path.split(".")) {
    if (!isAnyObject(value)) {
      return; // cant go further, invalid path ignore
    }
    if (pathSegment in value) {
      value = value[pathSegment];
    } else {
      return; // invalid path ignore
    }
  }

  return value; // value at the end of the path
}

const POJO_PROTOTYPES = [Object.prototype, null];

/**
 * Is the value a simple object, ie a Plain Old Javascript Object,
 * not a class instance, function, array etc which are also objects
 *
 * @internal
 */
export function isPojo(val: unknown): val is Record<string, unknown> {
  return Boolean(
    typeof val === "object" &&
      val &&
      POJO_PROTOTYPES.includes(Object.getPrototypeOf(val)) &&
      !isReactElement(val),
  );
}

function isAnyObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null;
}

// NOTE: React has `#isValidElement` utility to check this, however we dont use it here so React isn't a dependency
export function isReactElement(val: Record<string, any>): boolean {
  return typeof val.$$typeof === "symbol";
}
