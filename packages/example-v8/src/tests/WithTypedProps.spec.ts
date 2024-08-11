import {test} from "@playwright/test";
import {localHostPortIsInUse} from "./utils";
import StorybookPageObject from "./utils/StorybookPage";
import {TEST_TIMEOUT_MS} from "./utils/constants";

test.beforeAll(async () => {
  const isStorybookRunning = await localHostPortIsInUse(6006);
  if (!isStorybookRunning) {
    throw new Error(
      "Storybook is not running (expected on localhost:6006), please run `npm run storybook` in a separate terminal",
    );
  }
});

test.beforeEach(async ({page}) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  await new StorybookPageObject(page).openPage();
});

test("shows default controls when initial values are not defined", async ({page}) => {
  const storybookPage = new StorybookPageObject(page);
  await storybookPage.action.clickStoryById("stories-withtypedprops--default-enabled");
  await storybookPage.assert.controlsMatch({
    someString: {
      type: "set-value-button",
      valueType: "string",
    },
    someObject: {
      type: "set-value-button",
      valueType: "object",
    },
    someArray: {
      type: "set-value-button",
      valueType: "object",
    },
  });
  await storybookPage.assert.actualConfigMatches({});
});

test("shows deep controls when initial values are defined", async ({page}) => {
  const storybookPage = new StorybookPageObject(page);
  await storybookPage.action.clickStoryById("stories-withtypedprops--with-args");
  await storybookPage.assert.controlsMatch({
    someString: {
      type: "set-value-button",
      valueType: "string",
    }, // still included
    "someObject.anyString": "anyString",
    "someObject.enumString": "value2",
    someArray: {
      type: "json",
      valueText: '[0 : "string1"1 : "string2"]',
    },
  });

  await storybookPage.assert.actualConfigMatches({
    someArray: ["string1", "string2"],
    someObject: {
      anyString: "anyString",
      enumString: "value2",
    },
  });
});

test("supports customising controls with initial values", async ({page}) => {
  const storybookPage = new StorybookPageObject(page);
  await storybookPage.action.clickStoryById("stories-withtypedprops--with-custom-controls");
  await storybookPage.assert.controlsMatch({
    someString: {
      type: "radio",
      options: ["string1", "string2", "string3"],
      value: null,
    },
    "someObject.anyString": "anyString",
    "someObject.enumString": {
      type: "radio",
      options: ["value1", "value2", "value3"],
      value: "value2",
    },
    someArray: {
      type: "json",
      valueText: '[0 : "string1"1 : "string2"]',
    },
  });

  // initial value not affected by custom controls
  await storybookPage.assert.actualConfigMatches({
    someArray: ["string1", "string2"],
    someObject: {
      anyString: "anyString",
      enumString: "value2",
    },
  });
});
