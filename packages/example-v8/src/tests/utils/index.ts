import cloneDeep from "lodash/cloneDeep";

export function clone<T extends Record<string, unknown>>(obj: T): T {
  return cloneDeep(obj); // maintains value as is, e.g. NaN, Infinity, etc. which JSON.stringify does not
}

function localHostPortIsInUse(port: number): Promise<boolean> {
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

export async function assertStorybookIsRunning() {
  const isStorybookRunning = await localHostPortIsInUse(6006);
  if (!isStorybookRunning) {
    throw new Error(
      "Storybook is not running (expected on localhost:6006), please run `npm run storybook` in a separate terminal",
    );
  }
}
