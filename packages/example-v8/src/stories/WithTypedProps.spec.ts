import {test} from "@playwright/test";
import {assertStorybookIsRunning} from "../tests/utils";
import StorybookPageObject from "../tests/utils/AppObject";
import {TEST_TIMEOUT_MS} from "../tests/utils/constants";

test.beforeAll(assertStorybookIsRunning);

test.beforeEach(async ({page}) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  await new StorybookPageObject(page).openPage();
});

test("shows default controls when initial values are not defined", async ({page}) => {
  const storybookPage = new StorybookPageObject(page);
  await storybookPage.action.openStoriesTreeItemById(
    "story",
    "stories-withtypedprops--default-enabled",
  );

  const storyPage = storybookPage.activeStoryPage;
  await storyPage.argsTable.assert.controlsMatch({
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
  await storyPage.assert.actualConfigMatches({});
});

test("shows deep controls when initial values are defined", async ({page}) => {
  const storybookPage = new StorybookPageObject(page);
  await storybookPage.action.openStoriesTreeItemById("story", "stories-withtypedprops--with-args");

  const storyPage = storybookPage.activeStoryPage;
  await storyPage.argsTable.assert.controlsMatch({
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

  await storyPage.assert.actualConfigMatches({
    someArray: ["string1", "string2"],
    someObject: {
      anyString: "anyString",
      enumString: "value2",
    },
  });
});

test("supports customising controls with initial values", async ({page}) => {
  const storybookPage = new StorybookPageObject(page);
  await storybookPage.action.openStoriesTreeItemById(
    "story",
    "stories-withtypedprops--with-custom-controls",
  );

  const storyPage = storybookPage.activeStoryPage;
  await storyPage.argsTable.assert.controlsMatch({
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
  await storyPage.assert.actualConfigMatches({
    someArray: ["string1", "string2"],
    someObject: {
      anyString: "anyString",
      enumString: "value2",
    },
  });
});
