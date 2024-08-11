import {test} from "@playwright/test";
import {localHostPortIsInUse} from "./utils";
import StorybookPageObject from "./utils/StorybookPage";

test.beforeAll(async () => {
  const isStorybookRunning = await localHostPortIsInUse(6006);
  if (!isStorybookRunning) {
    throw new Error(
      "Storybook is not running (expected on localhost:6006), please run `npm run storybook` in a separate terminal",
    );
  }
});

test.beforeEach(async ({page}) => {
  test.setTimeout(60_000);
  await new StorybookPageObject(page).openPage();
});

test("shows default controls when initial values are not defined", async ({page}) => {
  const storybookPage = new StorybookPageObject(page);
  await storybookPage.action.clickStoryById("stories-withtypedprops--default-enabled");
  await storybookPage.assert.controlsMatch({
    someString: undefined,
    someObject: undefined,
    someArray: undefined,
  });
  await storybookPage.assert.actualConfigMatches({});
});

test("shows deep controls when initial values are defined", async ({page}) => {
  const storybookPage = new StorybookPageObject(page);
  await storybookPage.action.clickStoryById("stories-withtypedprops--with-args");
  await storybookPage.assert.controlsMatch({
    someString: undefined, // still included
    "someObject.anyString": "anyString",
    "someObject.enumString": "value2",
    someArray: {type: "json-array"},
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
    someArray: {type: "json-array"}, // just represents a complex control
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
