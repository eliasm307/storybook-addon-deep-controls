import {test} from "@playwright/test";
import {AppObject} from "../tests/objects/AppObject";
import {assertStorybookIsRunning} from "../utils";
import {TEST_TIMEOUT_MS} from "../utils/constants";

test.beforeAll(assertStorybookIsRunning);

test.beforeEach(async ({page}) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  await new AppObject(page).openDefaultPage();
});

test("shows story with merged arg types correctly", async ({page}) => {
  const storybookPage = new AppObject(page);
  await storybookPage.action.openStoriesTreeItemById(
    "story",
    "stories-withautodocs--with-merged-arg-types",
  );

  const storyPage = storybookPage.activeStoryPage;
  await storyPage.assert.controlsMatch({
    "object.requiredNumberProp": {
      type: "number",
      value: 5,
      isRequired: true,
    },
    "object.booleanPropWithCustomDescription": true,
  });
  await storyPage.assert.actualConfigMatches({
    object: {
      booleanPropWithCustomDescription: true,
      requiredNumberProp: 5,
    },
  });
});

test("shows docs page with merged arg types correctly", async ({page}) => {
  const storybookPage = new AppObject(page);
  await storybookPage.action.openStoriesTreeItemById("docs", "stories-withautodocs--docs");

  const docsPage = storybookPage.activeDocsPage;
  await docsPage.assert.actualConfigMatches({
    object: {
      booleanPropWithCustomDescription: true,
      requiredNumberProp: 5,
    },
  });
  await docsPage.assert.controlsMatch({
    "object.booleanPropWithCustomDescription": {
      type: "boolean",
      value: true,
      descriptionLines: ["Custom description", "boolean"],
    },
    "object.requiredNumberProp": {
      type: "number",
      value: 5,
      isRequired: true,
      descriptionLines: ["number"],
    },
  });
});
