import cloneDeep from "lodash/cloneDeep.js";
import {STORYBOOK_PORT} from "./constants";

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
  const isStorybookRunning = await localHostPortIsInUse(STORYBOOK_PORT);
  if (!isStorybookRunning) {
    throw new Error(
      `Storybook is not running (expected on localhost:${STORYBOOK_PORT}), please run 'npm run storybook' in a separate terminal`,
    );
  }
}

type EnvironmentVariableName = "STORYBOOK_EXAMPLE_PORT";

function getEnvironmentVariable(name: EnvironmentVariableName): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value;
}

export function getStorybookPort(): number {
  const raw = getEnvironmentVariable("STORYBOOK_EXAMPLE_PORT");
  const value = parseInt(raw);
  if (isNaN(value)) {
    throw new Error(`Environment variable STORYBOOK_EXAMPLE_PORT is not a number: ${raw}`);
  }

  // eslint-disable-next-line no-console
  console.log(`Storybook port is ${value}`);
  return value;
}
