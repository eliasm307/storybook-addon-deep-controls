/* eslint-disable no-console */
import {type FullConfig} from "@playwright/test";
import {CONFIG} from "./src/utils/constants";

export default function globalSetup(config: FullConfig) {
  console.log("globalSetup env", CONFIG);
  console.log("globalSetup webServer", config.webServer);
}
