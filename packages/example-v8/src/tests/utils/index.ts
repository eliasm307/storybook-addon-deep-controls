import cloneDeep from "lodash/cloneDeep";

export function clone<T extends Record<string, unknown>>(obj: T): T {
  return cloneDeep(obj); // maintains value as is, e.g. NaN, Infinity, etc. which JSON.stringify does not
}

export function localHostPortIsInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = require("http").createServer();
    server.on("error", () => {
      server.close();
      resolve(true);
    });
    server.on("listening", () => {
      server.close();
      resolve(false);
    });
    server.listen(port);
  });
}
