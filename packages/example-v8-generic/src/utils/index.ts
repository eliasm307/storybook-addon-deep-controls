import {createServer} from "http";
import cloneDeep from "lodash.cloneDeep";
import {STORYBOOK_PORT} from "./constants";

export function clone<T extends Record<string, unknown>>(obj: T): T {
  return cloneDeep(obj); // maintains value as is, e.g. NaN, Infinity, etc. which JSON.stringify does not
}

function localHostPortIsInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
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
  const isStorybookRunning = await localHostPortIsInUse(STORYBOOK_PORT);
  if (!isStorybookRunning) {
    throw new Error(
      `Storybook is not running (expected on localhost:${STORYBOOK_PORT}), please run 'npm run storybook' in a separate terminal`,
    );
  }
}
